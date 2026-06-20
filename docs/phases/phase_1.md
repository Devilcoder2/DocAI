# Phase 1: Foundation Setup & Central API Gateway

## Sub-Phase 1.1: Environment & Local Development Setup
* **Current Functionality / Progress**:
  * Project directory `/Users/ramandeepsingh/Developer/Personal Projects/Medical AI` is empty. No code directories or boilerplate repositories exist.
* **Expected Outcome**:
  * Clean development workspace featuring unified environment configurations, root workspace settings, Docker Compose setups for local databases, and Git repositories.
* **Definition of Done Checklist**:
  * [ ] Git repository initialized with a standard `.gitignore` file for Python, Node.js, and environment credentials.
  * [ ] Docker Compose configuration file established, defining local containers for PostgreSQL, Redis, and RabbitMQ.
  * [ ] Environment configuration template file (`.env.example`) populated with database credentials, ports, and placeholder keys.
* **Verification Plan**:
  * Run `docker compose up -d` and verify that PostgreSQL, Redis, and RabbitMQ containers boot successfully and listen on their default ports.
  * Run `docker compose ps` to ensure all database engines remain in a stable, running state.
* **Handoff for Next Phase**:
  * Document all local port bindings (e.g., PostgreSQL on 5432, Redis on 6379, RabbitMQ on 5672) so that subsequent services can locate them immediately.

---

## Sub-Phase 1.2: API Gateway & Access Control Setup
* **Current Functionality / Progress**:
  * Databases are running locally, but no entry gateway, routing, or credential validation layer exists.
* **Expected Outcome**:
  * A running FastAPI API Gateway that intercepts incoming traffic, parses JWT (JSON Web Tokens), logs transactions to an audit channel, and proxies requests to backend routes.
* **Definition of Done Checklist**:
  * [ ] FastAPI Gateway service repository initialized with basic CORS configurations.
  * [ ] Authorization middleware built, supporting token signature verification and user role extraction.
  * [ ] Logging middleware built, outputting standard audit payloads (who, what, when, resource accessed).
* **Verification Plan**:
  * Issue a request with an invalid/missing authorization token to a protected gateway route; verify it returns an `HTTP 401 Unauthorized` status.
  * Issue a request with a valid mock token; verify it passes through the gateway and registers a line in the console log.
* **Handoff for Next Phase**:
  * Export the local gateway URL (e.g., `http://localhost:8000`) and the expected authorization header schema (`Authorization: Bearer <token>`) for the frontend and services.
