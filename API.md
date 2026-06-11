# API Documentation

This document enumerates every HTTP endpoint exposed by **QuickSlot API**.
All routes are mounted under the base path defined in `src/app.js`.
The routes use an **auth middleware** (`auth.middleware`) for protected endpoints.

| Module | HTTP Method | Path | Request Body (JSON) | Success Response | Error Responses |
|--------|-------------|------|---------------------|------------------|-----------------|
| **Auth** | POST | `/auth/register` | `{ "name": "string", "email": "string", "password": "string" }` | `201 Created` – `{ "message": "User registered successfully", "data": {user…} }` | `400 Bad Request` – validation errors, `409 Conflict` – email already exists |
| **Auth** | POST | `/auth/login` | `{ "email": "string", "password": "string" }` | `200 OK` – `{ "message": "Login successful", "data": { "accessToken": "...", "refreshToken": "...", "user": {...} } }` | `400 Bad Request` – validation errors, `401 Unauthorized` – invalid credentials |
| **Auth** | POST | `/auth/refresh` | `{ "refreshToken": "string" }` | `200 OK` – `{ "accessToken": "..." }` | `401 Unauthorized` – missing/invalid/expired token |
| **Auth** | POST | `/auth/logout` *(protected)* | `{ "refreshToken": "string" }` | `200 OK` – `{ "message": "Logged out successfully" }` | `401 Unauthorized` – missing/invalid token |
| **Venue** | GET | `/venues/` *(protected)* | – | `200 OK` – list of venues `{ "data": [...] }` | `401 Unauthorized` |
| **Venue** | GET | `/venues/:id/slots` *(protected)* | – | `200 OK` – slot information `{ "data": [...] }` | `401 Unauthorized`, `404 Not Found` (if venue missing) |
| **Booking** | POST | `/bookings/` *(protected)* | `{ "venueId": "number", "slotId": "number", "bookingDate": "YYYY-MM-DD" }` | `201 Created` – `{ "message": "Booking created successfully", "data": {...} }` | `400 Bad Request` – validation, `401 Unauthorized`, other domain errors (e.g., slot unavailable) |
| **Booking** | DELETE | `/bookings/:id` *(protected)* | – | `200 OK` – `{ "message": "Booking cancelled successfully", "data": {...} }` | `401 Unauthorized`, `403 Forbidden` (not owner), `404 Not Found` |
| **User Bookings** | GET | `/users/:id/bookings` *(protected)* | – | `200 OK` – `{ "data": [...] }` | `401 Unauthorized`, `403 Forbidden` (access other user) |

All responses are JSON. Errors follow the shape `{ "message": "...", "errors": {...} }` when applicable.

**Note:** The route definitions are located in:
- `src/modules/auth/auth.routes.js`
- `src/modules/venues/venue.routes.js`
- `src/modules/bookings/booking.routes.js`

Refer to the source code for detailed controller logic.
