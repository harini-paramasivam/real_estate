# Architecture

## Backend layering

    routes        -> HTTP concerns only: parse request, call a service, shape the response
    services      -> business logic, authorization rules, transactions
    repositories  -> reusable query-building helpers used by services
    models        -> SQLAlchemy ORM models (the schema)
    schemas       -> Pydantic request/response contracts
    core          -> config, DB session/engine, security (JWT + password hashing)

Routes never talk to the database directly - they call into services/,
which is where authorization checks and transactional logic live. This
keeps the HTTP layer thin and makes the business rules unit-testable
without spinning up the web server.

## Booking concurrency strategy (the critical requirement)

Double-booking is prevented by two independent layers, deliberately
redundant:

### 1. Application-level row lock

booking_service.create_booking() runs inside a single DB transaction:

    BEGIN
      SELECT * FROM units WHERE id = :unit_id FOR UPDATE   -- acquire row lock
      verify lead exists
      verify unit.status == AVAILABLE                      -- re-check AFTER the lock
      INSERT INTO bookings (...)
      UPDATE units SET status = 'BOOKED'
      UPDATE leads SET stage = 'BOOKED'
    COMMIT

SELECT ... FOR UPDATE (in app/repositories/booking_repository.py) is the
key line: it blocks any other transaction from acquiring a lock on that
same unit row until this transaction commits or rolls back. If two
requests race for the same unit, the first to arrive gets the lock and
proceeds; the second blocks, waits for the first transaction to finish,
then re-reads the row, sees status = BOOKED, and is correctly rejected
with 409 Conflict, without ever creating a duplicate booking.

### 2. Database-level partial unique index

bookings has UNIQUE (unit_id) WHERE status = 'CONFIRMED'. Even if the
application-level lock were ever bypassed (a bug, a future code path, a
direct SQL write), Postgres itself would reject a second CONFIRMED
booking for the same unit with an IntegrityError, which the service layer
catches and turns into the same 409 Conflict.

This gives defense in depth: the row lock is what actually serializes
concurrent requests (and is why only one booking is ever created at all,
rather than one being created and then rolled back), and the unique index
is a schema-level guarantee that holds true no matter what code path
attempts the write.

### Verified under real concurrency

This isn't just reasoned about - it's tested against a running PostgreSQL
instance in backend/app/tests/test_bookings.py ::
test_concurrent_double_booking_is_prevented, which fires 8 simultaneous
booking requests (real threads, real HTTP calls through the FastAPI test
client, real DB connections) at the same unit and asserts that exactly one
succeeds and the rest receive 409. It was also manually verified with a
10-way concurrent stress script against the live dev server with the same
result.

## Role-based authorization

Enforced entirely in the backend (app/api/dependencies.py +
app/services/*), never only in the frontend:

- require_admin / require_any_role are FastAPI dependencies that reject
  unauthorized requests with 403 before a route handler runs.
- Lead-level authorization is finer-grained: lead_service._ensure_can_view
  and _ensure_can_edit check that a non-admin's assigned_to matches the
  requesting user, so a sales employee can never read or modify a
  colleague's lead by guessing an ID.
- The frontend also hides admin-only navigation and buttons for a clean
  UX, but this is presentation only. Every one of those checks is
  duplicated server-side, and the test suite (test_permissions.py)
  verifies the API rejects unauthorized calls directly, without going
  through the UI.

## Why projects / buildings / units are separate entities

Real estate inventory is naturally hierarchical and each level has its own
lifecycle: a Project (e.g. "Green Valley Residency") is a long-lived
marketing/legal entity; Buildings are added to a project over time as
construction phases complete; Units are the actual sellable/bookable
inventory and are the only level that carries price, type, and
availability. Modeling them as three tables, rather than flattening units
directly under projects, lets:

- unit numbers be scoped to a building (UNIQUE (building_id, unit_number))
  instead of colliding project-wide,
- buildings be added/renamed independently of the units inside them, and
- the dashboard and property pages roll counts up cleanly (building_count,
  unit_count) without denormalizing data onto the project row.

## How booking synchronizes lead and unit state

A booking is not just an insert - it's the point where three entities
must move together atomically: the Booking row is created, the Unit moves
AVAILABLE -> BOOKED, and the Lead moves to the BOOKED stage. All three
writes happen inside the same transaction described above, so either all
three happen or none do - there is no window where a booking exists but
the unit still shows as available, or where a unit is marked booked
without a corresponding booking record.

## Why PostgreSQL / relational modeling

The domain is inherently relational (projects -> buildings -> units,
leads -> notes/bookings, users -> leads/bookings) with real invariants
that benefit from being enforced by the database itself rather than only
in application code: foreign keys, a CHECK (price > 0) constraint, unique
constraints scoped to a parent (unit numbers per building), and, most
importantly, row-level locking (SELECT ... FOR UPDATE) and a partial
unique index for the double-booking guarantee. PostgreSQL's transactional
guarantees (ACID) are exactly what's needed to make "exactly one booking
per unit, even under concurrent access" a property of the system rather
than a hope.
