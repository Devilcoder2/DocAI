# Phase 2: Core Booking Marketplace & Scheduling Engine

## Sub-Phase 2.1: Scheduling Microservice & Database Schema
* **Current Functionality / Progress**:
  * Gateway is established, but no actual booking logic, calendar storage, or scheduling tables exist.
* **Expected Outcome**:
  * An independent Scheduling Microservice built in Python + FastAPI with SQLAlchemy. It exposes REST API endpoints to manage doctor profiles, calendar slots, and appointment states.
* **Definition of Done Checklist**:
  * [ ] SQLAlchemy database tables compiled for: Users, Doctors, Appointments, and Schedule Exceptions.
  * [ ] Alembic initialized, and the initial migration script run against the PostgreSQL database.
  * [ ] Endpoints built for: `GET /doctors` (search with filters), `GET /doctors/{id}/availability`, and `POST /appointments` (slot reservation).
  * [ ] Row-locking mechanism implemented on PostgreSQL slots to prevent concurrent double-booking.
* **Verification Plan**:
  * Run automated unit tests performing concurrent booking requests on the same slot; verify that only the first request succeeds (HTTP 201) and subsequent requests are rejected with a lock conflict (HTTP 409).
  * Execute Alembic migration checks: `alembic current` must show the database is in sync with models.
* **Handoff for Next Phase**:
  * Create a mock database seeding script containing 5 doctors with diverse schedules and zip codes to facilitate frontend listing development.

---

## Sub-Phase 2.2: Patient Search & Booking UI (Web Portal)
* **Current Functionality / Progress**:
  * No user interface exists.
* **Expected Outcome**:
  * A web application built in Next.js containing the Patient Portal landing page, doctor list view with filters, detailed profile views, and a booking wizard.
* **Definition of Done Checklist**:
  * [ ] Search interface built, supporting filtering by specialty, location (ZIP), date, and insurance network.
  * [ ] Profile cards built, displaying ratings, photo, reviews, and a grid of upcoming appointment slots.
  * [ ] Multi-step Booking Wizard built (Reason -> Insurance -> Guest Sign-up -> AI Consent checkboxes -> Confirmation).
* **Verification Plan**:
  * Open the local portal in a browser, type "Cardiologist", select a doctor, complete the booking wizard with test information, and verify that a "Booking Confirmed" dashboard screen is displayed.
  * Validate that the API Gateway receives the correct payload from the client upon wizard submission.
* **Handoff for Next Phase**:
  * Establish a standard styling template (Tailwind configuration, core HSL color values, button component variants) so the Doctor Dashboard portal matches visually.
