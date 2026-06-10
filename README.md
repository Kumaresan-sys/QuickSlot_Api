# QuickSlot API 🏟️

## 📦 Clone the Repository
```bash
# Using SSH
git clone git@github.com:Kumaresan-sys/QuickSlot_Api.git
# Or using HTTPS
git clone https://github.com/Kumaresan-sys/QuickSlot_Api.git
```

## 🛠️ Prerequisites
- **Node.js** (v18 or later) and **npm**
- **Docker** and **Docker‑Compose** (required for the database and optional Redis cache)
- (Optional) **Redis** if you intend to enable caching – the Docker‑Compose file already contains a Redis service you can uncomment.

## 📁 Folder Structure
```
QuickSlot_Api/
├─ src/                     # Application source code
│  ├─ controllers/         # HTTP request handlers
│  ├─ services/            # Business‑logic layer
│  ├─ repositories/        # Data‑access layer (PostgreSQL queries)
│  ├─ models/              # Domain models / TypeScript interfaces
│  ├─ config/              # Configuration (env, constants)
│  └─ index.js             # Entry point – sets up Express & Socket.io
├─ tests/                   # Integration / unit tests (Jest, Supertest)
├─ docker-compose.yml       # Development & production compose file
├─ Dockerfile               # Container image for the API service
├─ .env.example             # Example environment file
└─ README.md                # This documentation file
```

## 🚀 Running Locally
1. **Create an environment file** – copy the example and adjust values if needed:
```bash
cp .env.example .env
```
2. **Start the stack** (Docker will spin up PostgreSQL, Redis (if enabled) and the API container):
```bash
docker-compose down -v && docker-compose up -d --build
```
3. **Install Node dependencies** (run inside the `api` container or on host if you prefer):
```bash
npm ci
```
4. **Run the test suite** (optional but recommended):
```bash
npm test   # or: node test_endpoints.js
```
5. The API and WebSocket server will be reachable at `http://localhost:5001`.

---

## 🏗️ Architecture Overview
The service follows **Clean Architecture** principles:
- **Web layer** – Express routes & Socket.io handlers.
- **Use‑case / service layer** – Core business rules.
- **Repository layer** – Abstracts PostgreSQL access.
- **Entity layer** – Plain JavaScript/TypeScript objects.

All components run in isolated Docker containers, communicating over the internal Docker network.



---

## 📦 Production Deployment
The same `docker-compose.yml` can be used in production. Typical steps:
1. **Provision a host** (VM, bare‑metal, or a cloud instance) with Docker & Docker‑Compose installed.
2. **Secure the environment** – set real secrets in a `.env` file (do **not** commit this file).
3. **Launch the stack**:
```bash
docker-compose -f docker-compose.yml up -d --scale api=3
```
   - `--scale api=N` runs multiple API replicas behind Docker’s built‑in load‑balancing.
4. **Optional – Orchestrator** – For larger deployments you can drop the compose file into a Kubernetes manifest or a Docker Swarm stack. The services are stateless; only PostgreSQL (and optional Redis) need persistent storage.
5. **Monitoring** – expose Prometheus metrics from the API container or attach a side‑car such as `cAdvisor` for container health.

## 📚 Additional Notes
- **Database migrations** – currently handled automatically on container start via the `init.sql` script. For complex schema changes consider a tool like `node-pg-migrate`.
- **Caching** – the Redis container is defined but commented out in the default `docker-compose.yml`. Uncomment the service and update the configuration if you need read‑through caching for `GET /venues`.
- **Contributing** – fork the repo, create a feature branch, and open a Pull Request. Run `npm test` before submitting.

---

*Happy coding!*
