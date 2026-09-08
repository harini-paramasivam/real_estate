# Database Schema

PostgreSQL, managed with SQLAlchemy models and Alembic migrations
(`backend/migrations/versions/`).

## Entity-relationship overview

```text
User 1───* Lead            (Lead.assigned_to → User.id, SET NULL on delete)
Lead 1───* LeadNote        (LeadNote.lead_id → Lead.id, CASCADE on delete)
User 1───* LeadNote        (LeadNote.created_by → User.id, SET NULL)

Project 1───* Building     (Building.project_id → Project.id, CASCADE)
Building 1───* Unit        (Unit.building_id → Building.id, CASCADE)

Lead 1───* Booking         (Booking.lead_id → Lead.id, RESTRICT on delete)
Unit 1───* Booking         (Booking.unit_id → Unit.id, RESTRICT on delete)
User 1───* Booking         (Booking.booked_by → User.id, SET NULL)
```

## Tables

### `users`
id (PK), name, email (unique), hashed_password, role (enum: ADMIN /
SALES_EMPLOYEE), is_active, created_at, updated_at

### `leads`
id (PK), name, email (nullable), phone, source (enum), stage (enum: NEW,
CONTACTED, SITE_VISIT, INTERESTED, NEGOTIATION, BOOKED, LOST — stored as a
native Postgres enum, never a free-text string), assigned_to (FK → users,
nullable), next_follow_up (nullable date), created_at, updated_at.
Indexes on stage, assigned_to, next_follow_up keep dashboard and
list-filter queries fast.

### `lead_notes`
id (PK), lead_id (FK → leads, CASCADE), created_by (FK → users, SET NULL),
content (text), created_at

### `projects`
id (PK), name, location, description (nullable), timestamps

### `buildings`
id (PK), project_id (FK → projects, CASCADE), name, description, timestamps

### `units`
id (PK), building_id (FK → buildings, CASCADE), unit_number, unit_type
(enum: 1_BHK, 2_BHK, 3_BHK, VILLA, PLOT), price (NUMERIC(14,2), CHECK
price > 0), status (enum: AVAILABLE, RESERVED, BOOKED), timestamps.
UNIQUE (building_id, unit_number) — a unit number only has to be unique
within its own building, matching how real buildings are numbered (two
different buildings can both have a unit "A-101").

### `bookings`
id (PK), lead_id (FK → leads, RESTRICT), unit_id (FK → units, RESTRICT),
booked_by (FK → users, SET NULL), booking_date, status (enum: CONFIRMED,
CANCELLED), timestamps.

**`uq_one_confirmed_booking_per_unit`** — a partial unique index:
`UNIQUE (unit_id) WHERE status = 'CONFIRMED'`. This is the database-level
half of the double-booking protection described in architecture.md; it
makes "one active booking per unit" a schema-enforced invariant, not just
an application convention.

## Deletion behavior (why RESTRICT, not CASCADE)

Booking history must never be silently destroyed:

- `Booking.lead_id` and `Booking.unit_id` use `ON DELETE RESTRICT`. The
  database itself refuses to delete a lead or unit that has a booking
  attached, at the SQL level, independent of application code.
- `DELETE /api/leads/{id}` additionally checks for booking history in
  `lead_service.delete_lead()` and returns a clean `409 Conflict` with a
  human-readable message before ever attempting the DB delete, so the
  user gets a business-level explanation rather than a raw database error.
- `LeadNote` uses CASCADE (notes are commentary with no independent value
  once the lead is gone). `Booking.booked_by` uses SET NULL, so historical
  bookings and notes survive even if the employee who created them is
  later removed from the system.

## Enums, not free-text

`lead.stage`, `lead.source`, `unit.unit_type`, `unit.status`, and
`booking.status` are all native Postgres enum types, not VARCHAR columns
with only app-level validation. This guarantees the database itself can
never hold an invalid stage/status value, even from a direct SQL script or
a future integration that bypasses the API.
