# QuickSlot API

Express + PostgreSQL backend for booking sports slots. The API stores venues,
hourly slots, users, and bookings with real persistence.

## Run Locally

```bash
docker compose up -d --build
```

The API listens on `http://localhost:5001`. PostgreSQL is exposed on host port
`5433` to avoid clashing with a local Postgres install.

## Seed Data

`database/seed.sql` creates five venues and hourly slots from 6 AM through
10 PM for each venue. It also seeds two demo users:

- `test@example.com` / `password123`
- `jane@example.com` / `password123`

## API

Protected endpoints accept either a JWT `Authorization: Bearer <token>` from
`/auth/login` or a lightweight `X-User-Id: <uuid>` header.

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/venues` | List venues |
| `GET` | `/venues/:id/slots?date=YYYY-MM-DD` | List slots and `AVAILABLE` / `BOOKED` status |
| `POST` | `/bookings` | Create a booking for the current user |
| `GET` | `/users/:id/bookings` | List one user's bookings |
| `DELETE` | `/bookings/:id` | Cancel one booking |

Booking responses:

- `201 Created`: booking succeeded
- `400 Bad Request`: invalid venue, slot, date, or body shape
- `401 Unauthorized`: missing or invalid user identity
- `403 Forbidden`: user tried to access another user's booking
- `409 Conflict`: slot was already taken, including concurrent races

## Concurrency Approach

The hard double-booking rule is enforced in PostgreSQL, not only in application
code. `bookings` has a partial unique index on
`(venue_id, slot_id, booking_date)` where `status = 'CONFIRMED'`. Booking uses a
transaction and `INSERT ... ON CONFLICT DO NOTHING RETURNING ...`; exactly one
concurrent insert can return a row, and every loser receives `409 Conflict`.
Cancelled bookings no longer participate in the unique index, so a cancelled
slot can be booked again.

## Verification

With the Docker stack running:

```bash
node test_endpoints.js
node test_concurrency.js
```

`test_concurrency.js` fires two simultaneous booking requests for the same
venue/date/slot and expects one `201` and one `409`.

## Architecture Note

Routes stay thin and delegate to controllers, services, and repositories. The
service layer owns user-facing booking rules such as ownership checks. The
repository layer owns SQL and the atomic booking insert. Socket.io broadcasts
slot status changes so app clients can refresh visible slot grids.

