# Feature Test Specifications - AI Ambient Scribe & SOAP Notes

This document lists test scenarios, validation steps, and progress logs for audio transcription, SOAP notes generation, and note signing.

---

## Scenarios to Test

### 1. Ambient Conversation Transcription (STT)
* **What to Test**: Streaming consult audio from a video room.
* **How to Verify**:
  * Scribe service consumer converts audio streams into raw dialogue text segments.
  * Correct speaker labels (Doctor vs Patient) are appended to transcripts.

### 2. SOAP Note Generation (LLM Pipeline)
* **What to Test**: Sending a finished raw transcript to the LLM structuring agent.
* **How to Verify**:
  * Returns complete SOAP structured notes mapping (Subjective, Objective, Assessment, Plan) details.
  * Translates a layman summary explaining diagnostics in simple words.

### 3. Editor Auto-Saving
* **What to Test**: Editing fields inside the split-screen SOAP pane.
* **How to Verify**:
  * Modifications trigger background debounced auto-saves.
  * Visual saving indicator switches between "Saving Draft..." and "Draft Saved".
  * Refreshes retrieve updated draft values.

### 4. Locked Electronic Sign-off
* **What to Test**: Clicking the "Approve & Sign Note" button.
* **How to Verify**:
  * Submits lock payload `status = approved`.
  * Text fields transform into read-only states.
  * Restricts future edit calls.

---

## Testing Progress Tracker

| Scenario | Mode | Status | Bugs Found | Notes |
|---|---|---|---|---|
| Audio stream to STT | Integration | `[x] Passed` | None | Consumer transcript parsing works |
| Structuring SOAP | Unit | `[x] Passed` | None | Initial note draft generated |
| Auto-save trigger | E2E | `[x] Passed` | None | Debounced edits returned 200 |
| Lock Note sign | E2E | `[x] Passed` | None | Approved note returns 400 on edit |
