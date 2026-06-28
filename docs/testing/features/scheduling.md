# Feature Test Specifications - Directory Search & Scheduling

This document lists test scenarios, validation steps, and progress logs for the doctor search marketplace and booking engine.

---

## Scenarios to Test

### 1. Doctor Directory Search & Filtering
* **What to Test**: Querying directory via filters (specialty, ZIP code).
* **How to Verify**:
  * Filtering "Cardiology" returns only Cardiologists (e.g. Dr. Alice Heart).
  * Filtering invalid ZIP codes returns empty doctor results list.
  * Clearing filters restores full catalog array.

### 2. Provider Availability Slots Loading
* **What to Test**: Selecting a provider and loading calendar availability details.
* **How to Verify**:
  * System queries `/doctors/{doctor_id}/availability` downstream.
  * Returns formatted date slots matching open timelines.

### 3. Booking Creation & Db Commit
* **What to Test**: Confirming an appointment slot via patient form checkout.
* **How to Verify**:
  * Gateway routes `POST /appointments` payload downstream to scheduling service.
  * Returns 201 Created with appointment UUID, mapping patient ID and doctor ID.
  * Attempting to book the same slot twice triggers concurrent scheduling conflict errors.

---

## Testing Progress Tracker

| Scenario | Mode | Status | Bugs Found | Notes |
|---|---|---|---|---|
| Search specialty | Integration | `[ ] Pending` | None | Verify list matches DB |
| Search ZIP code | Integration | `[ ] Pending` | None | Verify list matches DB |
| Get doctor slots | Integration | `[ ] Pending` | None | Verify slot array structure |
| Book slot | E2E | `[ ] Pending` | None | Verify db entry created |
| Conflict booking | Unit | `[ ] Pending` | None | Verify double-booking rejected |
