# QuickSlot API 🏟️

A high-performance backend API for a venue booking application, built with Node.js, Express, PostgreSQL, and WebSockets for real-time concurrency.

## 🚀 Setup Steps

1. **Prerequisites**: Ensure you have Docker and Docker Compose installed.
2. **Clone the repository** (or navigate to this directory).
3. **Environment**: Ensure your `.env` file is present (defaults are provided in the docker-compose).
4. **Start the API**:
   ```bash
   docker-compose down -v && docker-compose up -d --build
   ```
5. **Run the Tests**:
   ```bash
   npm install socket.io-client # Only required for running the test script
   node test_endpoints.js
   ```

The REST API and WebSocket server will both be running on `http://localhost:5001`.

---

## 🏗️ Architecture Note

The application strictly follows Clean Architecture principles, isolating the web layer (Controllers) from the business logic (Services) and data access (Repositories). At the core, an Express.js API Gateway receives HTTP requests and routes them to specific modular domains: Auth, Venues, and Bookings. Concurrently, a Socket.io WebSocket server runs alongside the HTTP server to broadcast state changes. The database is a single PostgreSQL instance designed with partial unique indexes to naturally prevent duplicate bookings without needing expensive table locks.

---

## ✂️ What Was Cut and Why

- **Pagination & Advanced Rate Limiting**: The `GET /venues` and `GET /bookings` endpoints currently return all matching records. This was intentionally skipped to prioritize rock-solid transactional booking concurrency and real-time updates over boilerplate list-handling.
- **Email Verification / Password Reset**: Standard OAuth or email verifications were cut to save time; a basic but secure JWT implementation with refresh tokens was sufficient to demonstrate session lifecycle management.
- **Payment Gateway Integration**: Actual monetary checkout flows were omitted as the primary focus of the assignment was on slot reservation integrity and concurrency.

---

## 🕒 What I'd Do With One More Day

- **Comprehensive Automated Testing**: I would swap out the procedural `test_endpoints.js` script with a full suite of Jest and Supertest integration tests running in a CI/CD pipeline.
- **Redis Caching**: I would add a Redis layer to cache the `GET /venues` endpoint and heavily requested time slots to reduce database strain.
- **Swagger Documentation**: Implement OpenAPI/Swagger specs to automatically generate an interactive API documentation portal.
- **Load Balancing**: Add Nginx in the Docker setup to balance WebSocket and HTTP traffic across multiple API container replicas to test distributed locking.

---

## 🤖 AI Usage Note

**How AI was used:** I utilized AI as an advanced pair programmer to quickly scaffold the Express boilerplate, structure the Clean Architecture folders, write the Dockerfile and `docker-compose.yml`, and quickly wire up the Socket.io broadcasting boilerplate.

**What the AI got wrong (and how I fixed it):** 
When generating the initial database seed script, the AI confidently used PostgreSQL's `generate_series()` function directly with the `TIME` data type. However, PostgreSQL's `generate_series()` does *not* natively support the `TIME` data type without custom casting, causing the database container initialization to silently crash (`ENOTFOUND db`). **I caught this error** by analyzing the Docker logs, and I fixed it by changing the seed script to generate a series using `TIMESTAMP` ranges and casting the result to `::time` before insertion! I also caught and removed a `SELECT FOR UPDATE` bottleneck the AI introduced that would have unnecessarily locked slot rows across all dates, replacing it with a far more performant `INSERT ON CONFLICT DO NOTHING` approach.
