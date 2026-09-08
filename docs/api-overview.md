# API Overview

Base URL (local dev): `http://localhost:8000`

Interactive documentation (Swagger UI) is available at `/docs` and the raw
OpenAPI schema at `/openapi.json` whenever the backend is running.

All endpoints except `POST /api/auth/login` require a `Bearer` JWT in the
`Authorization` header. Tokens are obtained from the login endpoint and are
valid for `ACCESS_TOKEN_EXPIRE_MINUTES` (default 480 minutes / 8 hours).

## Auth

| Method | Path              | Description                          | Auth |
|--------|-------------------|--------------------------------------|------|
| POST   | `/api/auth/login` | Exchange email + password for a JWT  | none |
| GET    | `/api/auth/me`    | Return the current authenticated user| any  |

## Users

| Method | Path         | Description                          | Auth  |
|--------|--------------|---------------------------------------|-------|
| GET    | `/api/users` | List all users (the sales team)       | ADMIN |

## Leads

| Method | Path                        | Description                                  | Auth  |
|--------|-----------------------------|-----------------------------------------------|-------|
| GET    | `/api/leads`                | List leads (paginated, filterable)            | any   |
| POST   | `/api/leads`                | Create a lead                                 | any   |
| GET    | `/api/leads/{id}`           | Get a single lead                             | any*  |
| PUT    | `/api/leads/{id}`           | Update a lead                                 | any*  |
| DELETE | `/api/leads/{id}`           | Delete a lead (blocked if it has bookings)    | ADMIN |
| POST   | `/api/leads/{id}/notes`     | Add a note to a lead                          | any*  |
| GET    | `/api/leads/{id}/notes`     | List notes for a lead (chronological)         | any*  |

`*` Sales employees may only view/edit leads assigned to them; admins may
view/edit any lead. This is enforced in `app/services/lead_service.py`, not
just hidden in the UI.

Query parameters for `GET /api/leads`:

- `search` — matches name, phone, or email (case-insensitive)
- `stage` — one of `NEW, CONTACTED, SITE_VISIT, INTERESTED, NEGOTIATION, BOOKED, LOST`
- `assigned_to` — user id
- `follow_up` — `overdue | today | upcoming`
- `page`, `limit` — pagination (default `limit=20`, max `100`)

## Properties

| Method | Path                                   | Description                        | Auth  |
|--------|-----------------------------------------|-------------------------------------|-------|
| GET    | `/api/projects`                        | List projects with building/unit counts | any |
| POST   | `/api/projects`                        | Create a project                    | ADMIN |
| GET    | `/api/projects/{id}`                   | Get a project with its buildings    | any   |
| PUT    | `/api/projects/{id}`                   | Update a project                    | ADMIN |
| GET    | `/api/projects/{id}/buildings`         | List buildings in a project         | any   |
| POST   | `/api/projects/{id}/buildings`         | Add a building to a project         | ADMIN |
| GET    | `/api/buildings/{id}/units`            | List units in a building            | any   |
| POST   | `/api/buildings/{id}/units`            | Add a unit to a building            | ADMIN |
| GET    | `/api/units/{id}`                      | Get a single unit                   | any   |
| PUT    | `/api/units/{id}`                      | Update a unit                       | ADMIN |

## Bookings

| Method | Path                | Description                                        | Auth |
|--------|---------------------|------------------------------------------------------|------|
| GET    | `/api/bookings`     | List bookings (sales employees see only their own)    | any  |
| POST   | `/api/bookings`     | Create a booking for a lead + unit                    | any  |
| GET    | `/api/bookings/{id}`| Get a single booking                                  | any  |

`POST /api/bookings` is the most business-critical endpoint in the system.
See [architecture.md](architecture.md) for the full concurrency strategy.
On success it returns `201` with the created booking. If the unit was
already booked (including by a concurrent request that won the race), it
returns:

```json
409 Conflict
{ "detail": "Unit A-102 is no longer available." }
```

## Dashboard

| Method | Path                             | Description                                   | Auth |
|--------|-----------------------------------|------------------------------------------------|------|
| GET    | `/api/dashboard/summary`         | Aggregate counts + lead pipeline               | any  |
| GET    | `/api/dashboard/follow-ups`      | All leads with a follow-up date, bucketed       | any  |
| GET    | `/api/dashboard/recent-bookings` | Most recent bookings                            | any  |

Sales employees see metrics scoped to their own leads/bookings; admins see
the full organization's numbers. Unit availability counts (`available_units`,
`booked_units`) are organization-wide for both roles, since inventory is
shared.

## Error format

Every error response is a JSON object with a `detail` field:

```json
{ "detail": "Human-readable message." }
```

For `422` validation errors, `detail` is the list of Pydantic error objects
(field path + message), matching FastAPI's default shape.

## Status codes used

`200, 201, 204, 400, 401, 403, 404, 409, 422, 500` — see
[architecture.md](architecture.md) for where each is used.
