# Feature Test Specifications - Telehealth Video Rooms & JWT Guards

This document lists test scenarios, validation steps, and progress logs for the WebRTC telehealth room and security gates.

---

## Scenarios to Test

### 1. signed JWT Voice/Video Token Generation
* **What to Test**: Querying telehealth `/rooms/voice-token` and `/rooms/token` downstream endpoints.
* **How to Verify**:
  * Response returns a signed JWT containing token claims (identity, room name, permissions).
  * Room name matches `voice_session_{identity}` or `appointment_{appointment_id}` template schema.

### 2. Video Room Gating & Access Control Policies
* **What to Test**: Patient A trying to join Patient B's appointment video room.
* **How to Verify**:
  * API Gateway proxy or telehealth room token builder verifies appointment owner.
  * Mismatched user claims are denied tokens, returning 403 Forbidden.

### 3. LiveKit SFU Socket Connect
* **What to Test**: Connection to the LiveKit socket server using generated tokens.
* **How to Verify**:
  * Web client establishes socket connection to `ws://localhost:7880`.
  * Audio/Video streams publish and subscribe correctly (simulated inside E2E environments).

---

## Testing Progress Tracker

| Scenario | Mode | Status | Bugs Found | Notes |
|---|---|---|---|---|
| GET voice-token | Integration | `[x] Passed` | None | Returned voice_session token |
| Join matching room | E2E | `[x] Passed` | None | Patient A successfully authorized |
| Hijack other room | Integration | `[x] Passed` | None | Patient B blocked with 403 |
| Media feed publish | E2E | `[x] Passed` | None | Doctor successfully authorized |
