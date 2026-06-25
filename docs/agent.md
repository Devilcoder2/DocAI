# Agent Guidelines & Context Directory
## Project Name: Medical AI Platform (Doctor Booking + AI Clinical Scribe & Companion)

This document defines the core developer guidelines for the AI assistant and provides direct links to the system documentation. This file must be loaded as context in every prompt.

---

## 1. Core Development Rules

### Rule 1: Always Update Progress Tracking
* Every time a development phase task, sub-phase, or milestone is completed, the agent **MUST** update [progress.md](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/progress.md) to log and track the accomplishment details.

### Rule 2: Detailed Code Documentation & Explanations
* Every time the agent writes or modifies code, it **MUST** explain the implementation in detail:
  1. What is being built and why.
  2. What libraries, models, or configurations are used.
  3. Provide comprehensive inline comments inside the code files, detailing the **input parameters** and **expected outputs** of functions.

### Rule 3: Single-File Git Commits
* Every change must be committed to the Git repository immediately.
* **Strict Constraint**: A single git commit **must not contain more than one file**.
* Whenever a single file is created or modified, the agent must commit that change individually with a clear, descriptive message (e.g., `git add path/to/file.py && git commit -m "docs: add database config module"`).

---

## 2. Documentation Context Directory

Below are the links to all active project files for context reference:

### Core Files:
* [Software Requirements Document (SRD)](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/SRD.md)
* [Technology Stack Specification](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/tech_stack.md)
* [Project Progress Tracking](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/progress.md)

### System Architecture Sub-Directory:
* [High-Level Overview](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/architecture/overall_architecture.md)
* [Frontend Client Modules](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/architecture/frontend.md)
* [Backend Services & Recorder Bot](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/architecture/backend.md)
* [AI Scribe & Agent Engine](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/architecture/ai.md)
* [Architectural Tradeoffs & Rationales](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/architecture/tradeoffs.md)

### Development Phases Sub-Directory:
* [Phases Overview Map](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/phases/overview.md)
* [Phase 1: Environment & API Gateway Setup](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/phases/phase_1.md)
* [Phase 2: Booking Engine & Marketplace Search](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/phases/phase_2.md)
* [Phase 3: Telehealth WebRTC & recording Bots](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/phases/phase_3.md)
* [Phase 4: Whisper Transcription & SOAP Compilation](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/phases/phase_4.md)
* [Phase 5: Care Companion RAG & Twilio Booking Bot](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/phases/phase_5.md)
* [Phase 6: Future Intake & Analytics Roadmap](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/phases/phase_6.md)
