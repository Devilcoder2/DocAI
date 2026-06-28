# Features Checklist - End-to-End System Testing

This document lists all core platform modules and operational flows that must be tested to ensure there are no bugs in our application and that the end-to-end user journeys are functional.

---

## Core Feature Areas

### 1. [User Authentication & Access Control](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/testing/features/auth.md)
* **Auth Forms**: Email and password registration and login validations.
* **Sandbox OAuth SSO**: Google and Facebook mock authentication channels.
* **Role Gating & Route Protection**: Protecting patient dashboard vs. physician dashboard from unauthorized access.

### 2. [Provider Directory & Marketplace Scheduling](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/testing/features/scheduling.md)
* **Marketplace Search**: Filtering doctor directories by specialty and ZIP code.
* **Calendar Slot Directory**: Doctor slot loading and real-time availability matrices.
* **Booking Completion**: Confirming appointments, updating databases, and trigger validations.

### 3. [Telehealth Video Rooms & JWT Guards](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/testing/features/telehealth.md)
* **JWT Access Security**: Telehealth room gating ensuring only the assigned doctor and patient can enter the room.
* **LiveKit SFU Integration**: High-fidelity video grid connections, microphone, camera toggles, and socket handlers.

### 4. [AI Ambient Scribe & SOAP Notes Editor](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/testing/features/scribe.md)
* **Ambient Transcription**: Conversion of dialogue voice recordings into textual transcripts.
* **LLM SOAP Generation**: AI structuring of raw transcripts into Subjective, Objective, Assessment, Plan (SOAP) formats.
* **Layman translation**: AI generation of simple patient-facing care instructions.
* **SOAP Note Editor**: Doctor Continue Scribe edit, auto-saving drafts, and locked electronic signing.

### 5. [Conversational Voice Assistant & Safety Guardrails](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/testing/features/voice_agent.md)
* **Voice Activation**: Real-time microphone capture and LiveKit Agent connection.
* **Speech Recognition & Synthesis Simulator**: HTML5 Web Speech backup flow inside patient portal.
* **Emergency Triage Guardrail**: Automated detection of chest pain, breathing diffs, etc. raising 911 warnings and terminating sessions.
* **Out-of-Scope Blocker**: Polite refusal of non-medical requests (e.g. recipes, code).
* **Consultation History Summarization**: Conversational summaries of past consultations.

### 6. [Premium UI/UX Design System & Theme Toggle](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/testing/features/design_system.md)
* **Outfit & Inter Typography**: Ensuring correct font stacks rendering globally.
* **Global Light/Dark Theme toggling**: Seamless switching of text, cards, inputs, and layouts via ThemeProvider variables.
* **Frameless Dashboard Analytics Charts**: CSS consultation volume stats displays.
