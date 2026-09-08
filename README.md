# Real Estate CRM

A small, complete, production-quality CRM for a real estate sales team:
lead management, project/building/unit inventory, and a booking workflow
with database-enforced protection against double-booking.

Built as a focused, end-to-end product rather than a large feature list -
see [Important Design Decisions](#important-design-decisions) for the
reasoning behind the key choices.

## Overview

A salesperson can capture a lead, track it through a fixed pipeline (New →
Contacted → Site Visit → Interested → Negotiation → Booked/Lost), log
notes and follow-ups, browse available inventory across projects and
buildings, and book an available unit against a lead. An admin can manage
the property catalog and see the full team's pipeline; a sales employee
sees and manages their own leads and bookings. The single hardest
requirement — that two salespeople can never both successfully book the
same unit — is enforced at both the application and database level and is
covered by an automated concurrency test.

## Key Features

- **Lead management** — create, edit, search, filter (stage / assignee /
  follow-up), assign, note-taking, follow-up scheduling
- **Property inventory** — Project → Building → Unit hierarchy with price,
  type, and availability
- **Booking workflow** — select an available unit, pick a lead, review,
  confirm; booking + unit status + lead stage update atomically
- **Double-booking prevention** — row-level locking plus a database
  partial-unique-index backstop; proven under real concurrency (see below)
- **Role-based access** — ADMIN and SALES_EMPLOYEE, enforced server-side
- **Dashboard** — pipeline funnel, follow-up counts, booking totals,
  available/booked units, upcoming follow-ups, recent bookings
- **Follow-up management** — Overdue / Today / Tomorrow / Upcoming buckets
- **Realistic seed data** — the app never opens empty

## Technology Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS v4, React Router,
Axios, TanStack Query

**Backend:** Python, FastAPI, Pydantic, SQLAlchemy, PostgreSQL, Alembic,
JWT (python-jose), bcrypt

**Tooling:** pytest, oxlint, Git

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the full write-up,
including the booking concurrency strategy in detail.

Backend layering: `routes → services → repositories/models`, with
Pydantic `schemas` as the request/response contract and `core` holding
config/DB/security. Routes contain no business logic; all authorization
and transactional logic lives in `services/`.

Frontend layering: feature-oriented (`features/leads`, `features/
properties`, `features/bookings`, ...), each with its own `api/`,
`components/`, and (where needed) `hooks/`; shared primitives live in
`components/ui`, `components/layout`, `components/feedback`; server state
is managed with TanStack Query behind a small `services/apiClient.ts`
wrapper around Axios.

## Project Structure

```text
real-estate-crm/
├── backend/
│   ├── app/
│   │   ├── api/            # routes + FastAPI dependencies (auth/role guards)
│   │   ├── core/           # config, database session, security (JWT/hashing)
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic request/response models
│   │   ├── services/       # business logic, authorization, transactions
│   │   ├── repositories/   # query-building helpers
│   │   ├── seed/           # seed_data.py
│   │   ├── tests/          # pytest suite (35 tests)
│   │   └── main.py
│   ├── migrations/         # Alembic
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env.example
├── frontend/
│   └── src/
│       ├── app/            # router, providers (auth, query, page title)
│       ├── components/     # ui, layout, forms, tables, feedback
│       ├── features/       # auth, dashboard, leads, properties, bookings, users
│       ├── pages/          # route-level components
│       ├── services/       # apiClient.ts (Axios + interceptors)
│       ├── types/, constants/, utils/
│       └── main.tsx / App.tsx
├── docs/
│   ├── architecture.md
│   ├── database-schema.md
│   └── api-overview.md
├── screenshots/
├── docker-compose.yml
└── .gitignore
```

## Database Design

See [`docs/database-schema.md`](docs/database-schema.md) for the full
entity list, relationships, and deletion-behavior rationale. Summary:
`User`, `Lead`, `LeadNote`, `Project`, `Building`, `Unit`, `Booking`, all
with foreign keys, indexes on frequently-filtered columns, a `CHECK
(price > 0)` constraint, a unit-number-unique-per-building constraint,
and — the key one — a partial unique index guaranteeing at most one
`CONFIRMED` booking per unit.

## API Overview

See [`docs/api-overview.md`](docs/api-overview.md) for the full endpoint
reference. Interactive docs are also available at `/docs` (Swagger UI)
whenever the backend is running.

## Authentication & Authorization

JWT bearer tokens (`python-jose`), passwords hashed with `bcrypt`. Two
roles: `ADMIN` and `SALES_EMPLOYEE`. Every authorization rule is enforced
in the backend (`app/api/dependencies.py`, `app/services/*`) — the
frontend hides admin-only UI for a clean experience, but that is
presentation only, not the security boundary. A sales employee cannot
view or edit another employee's lead even by guessing its ID; this is
covered by `app/tests/test_leads.py` and `test_permissions.py`.

## Booking Concurrency Protection

The critical requirement — **double-booking must never happen** — is
solved with two independent layers (application row-lock + database
partial unique index) and is proven, not just asserted, by an automated
test that fires real concurrent requests at the same unit. Full detail in
[`docs/architecture.md`](docs/architecture.md#booking-concurrency-strategy-the-critical-requirement).

## Important Design Decisions

1. **PostgreSQL / relational modeling** — the domain has real relational
   invariants (foreign keys, uniqueness scoped to a parent, positive
   price) that are enforced by the database itself, and the booking flow
   needs transactional row-locking that only a relational database
   provides.
2. **Double-booking prevention** — `SELECT ... FOR UPDATE` inside the
   booking transaction serializes concurrent attempts on the same unit;
   a partial unique index (`UNIQUE (unit_id) WHERE status = 'CONFIRMED'`)
   backs it up at the schema level. See architecture.md for the full
   transaction shape and the concurrency test that proves it.
3. **Role-based authorization** — enforced via FastAPI dependencies
   (`require_admin`, `require_any_role`) and per-lead ownership checks in
   `lead_service`, never only hidden in the React UI.
4. **Projects / Buildings / Units as separate entities** — each level has
   its own lifecycle and constraints (unit numbers unique per building,
   not per project), and separating them avoids denormalizing
   price/availability data onto a building or project row.
5. **How booking synchronizes lead and unit state** — booking creation,
   the unit's `AVAILABLE → BOOKED` transition, and the lead's move to the
   `BOOKED` stage all happen inside one database transaction, so the
   three can never drift out of sync.

## Local Setup

Prerequisites: Python 3.12+, Node.js 20+, PostgreSQL 14+ (or use the
provided `docker-compose.yml` for Postgres only — see
[Deployment](#deployment)).

### Environment Variables

Backend (`backend/.env`, copy from `backend/.env.example`):

```text
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/real_estate_crm
SECRET_KEY=change-this-to-a-long-random-secret-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=480
CORS_ORIGINS=http://localhost:5173
```

Frontend (`frontend/.env`, copy from `frontend/.env.example`):

```text
VITE_API_URL=http://localhost:8000
```

### Database Migration

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then create the database referenced by DATABASE_URL
alembic upgrade head
```

### Seed Data

```bash
python -m app.seed.seed_data
```

This creates 2 projects, several buildings, 30-50 units (mixed
available/booked), 20+ leads across every stage, several bookings, and a
mix of overdue/today/upcoming follow-ups.

### Running Backend

```bash
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`, docs at `http://localhost:8000/docs`.

### Running Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App available at `http://localhost:5173`.

## Testing

```bash
cd backend
pytest app/tests -v
```

Current result: **35/35 passing**, covering authentication, lead CRUD and
authorization, property CRUD and validation, booking (including invalid
lead/unit and already-booked-unit rejection), the concurrent
double-booking test, and cross-cutting permission checks.

Frontend checks:

```bash
cd frontend
npm run lint      # oxlint — 0 errors
npx tsc -b        # TypeScript project build — 0 errors
npm run build     # production build (tsc -b && vite build) — succeeds
```

## Demo Credentials

| Role           | Email                       | Password   |
|----------------|------------------------------|------------|
| Admin          | admin@realestatecrm.io      | Admin@123  |
| Sales Employee | rahul@realestatecrm.io      | Sales@123  |
| Sales Employee | priya@realestatecrm.io      | Sales@123  |

(Seed data only — not real personal information.)

## Screenshots

Browser automation was not available in the environment this project was
built in, so screenshots could not be captured for this submission. The
`screenshots/` folder is included in the project structure; run the app
locally (see above) to view the Login, Dashboard, Leads, Lead Details,
Properties, Unit list, Booking flow, and Bookings pages directly.

## Deployment

`docker-compose.yml` provisions a PostgreSQL container for local
development (`docker compose up -d db`), since running Postgres in a
container is the most common friction point in "clone and run" setups.
The backend and frontend are intended to run natively during development
(`uvicorn --reload`, `npm run dev`) for fast iteration; both are plain
Python/Node processes and can be containerized the same way for a
production deployment (e.g. behind Gunicorn/Uvicorn workers and a static
build served by Nginx), which was left out here to keep the deliverable
focused rather than adding container layers that wouldn't be exercised by
this assignment.

## Future Improvements

- Refresh tokens / token revocation (current JWTs are stateless and expire
  after 8 hours, with no server-side revocation list)
- Reserved unit workflow (soft-hold before a firm booking)
- Email/SMS notifications for follow-ups and booking confirmations
- Server-side sorting on the leads table (currently newest-first only)
- Optimistic UI updates for note creation
- Audit log of stage/assignment changes on a lead
