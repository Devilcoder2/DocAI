# Phase 7: Authenticated Portal Gating, User/Doctor Profile CRUD, and Insurance Removal

## Sub-Phase 7.1: Database Schema Refactor & Insurance Field Removal
* **Current Functionality / Progress**:
  * Appointments schemas and tables require entering insurance carrier, plan, and policy number information.
* **Expected Outcome**:
  * Complete removal of insurance references across the database models, API endpoint validation checks, and frontend wizard steps. 
  * The booking system automatically determines returning patient status without manual intake questions.
* **Definition of Done Checklist**:
  * [ ] Delete `insurance_carrier`, `insurance_plan`, and `insurance_policy_number` from the scheduling database models and schemas.
  * [ ] Create and execute Alembic migrations to apply drops to the database tables.
  * [ ] Refactor scheduling route validations to process booking payloads without insurance keys.
* **Verification Plan**:
  * Run schema inspection checks on the scheduling SQLite database; verify the `appointments` table contains no insurance columns.
* **Handoff for Next Phase**:
  * Refactored booking API specifications and schemas.

---

## Sub-Phase 7.2: Portal Login Gating & Aesthetic Landing Page
* **Current Functionality / Progress**:
  * Next.js pages open directly without authentication gating, relying on mock store states.
* **Expected Outcome**:
  * High-aesthetic welcome landing page showcasing features. Gated login dashboard routing for doctor and patient roles.
* **Definition of Done Checklist**:
  * [ ] Build modern, aesthetic welcomes and feature list on `/welcome` landing page.
  * [ ] Implement Sign-in and Sign-up screens for both Doctor and Patient accounts.
  * [ ] Program routing guards and middleware to redirect unauthorized sessions to `/welcome`.
* **Verification Plan**:
  * Open a fresh browser window and attempt to access `/doctor/dashboard` or `/profile` directly. Verify it redirects to `/welcome`.
* **Handoff for Next Phase**:
  * Shared React authentication store and hook utilities.

---

## Sub-Phase 7.3: User Profile & Health Parameters CRUD
* **Current Functionality / Progress**:
  * Users cannot edit details after registration. Patients have no pre-defined clinical parameters.
* **Expected Outcome**:
  * Patient profile dashboard supporting age, weight, height, gender, allergies, and chronic illness metrics.
* **Definition of Done Checklist**:
  * [ ] Add age, weight, height, gender, allergies, and chronic illnesses to the User schema.
  * [ ] Implement profile GET and PUT endpoints in the scheduling and gateway services.
  * [ ] Build the profile form card layout on the patient dashboard.
* **Verification Plan**:
  * Save a profile update with age `28` and weight `70.0`. Verify the database matches and returns these values on refresh.
* **Handoff for Next Phase**:
  * Unified user profile models and endpoints.
