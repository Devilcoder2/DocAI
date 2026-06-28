# Feature Test Specifications - User Authentication & Access Gating

This document lists test scenarios, validation steps, and progress logs for user registration, authentication, and dashboard routing protection.

---

## Scenarios to Test

### 1. Account Creation (Patient & Physician)
* **What to Test**: Submitting the registration form with email, password, full name, and role.
* **How to Verify**:
  * Downstream database receives patient or doctor record.
  * API Gateway response returns a valid `token` and `user` profile payload.
  * Duplicate email attempts receive 400 Bad Request error.

### 2. User Sign-In (Credentials Validation)
* **What to Test**: Submitting valid or invalid credentials.
* **How to Verify**:
  * Valid login returns 200 OK with session JWT.
  * Invalid passwords receive 400/401 authentication errors.

### 3. Sandbox SSO OAuth Path
* **What to Test**: Clicking the mock "Google SSO" or "Facebook SSO" triggers.
* **How to Verify**:
  * Automatically authenticates using seeded sandbox accounts (`alice.heart@medical.com` or `john.doe@email.com`).
  * Success notification alerts display and redirect automatically to dashboard.

### 4. Role Gating & Security Route protection
* **What to Test**: Attempting to access physician dashboards using patient tokens, or accessing portal main dashboard without being signed in.
* **How to Verify**:
  * Doctor dashboard `/doctor/dashboard` redirects to "/" or shows Access Denied on unauthorized tokens.
  * Patients are gated from `/doctor/appointments/[id]/scribe` route.

---

## Testing Progress Tracker

| Scenario | Mode | Status | Bugs Found | Notes |
|---|---|---|---|---|
| Register Patient | Integration | `[x] Passed` | None | Verified via verify_auth.py |
| Register Physician | Integration | `[x] Passed` | None | Verified via verify_auth.py |
| Login Credentials | Integration | `[x] Passed` | None | Correctly issues JWT |
| Google Mock SSO | E2E | `[x] Passed` | None | Sandbox OAuth logs in |
| Role Guard checking | E2E | `[x] Passed` | None | Gated patient profile request returned 403 |
