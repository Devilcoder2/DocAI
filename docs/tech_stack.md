# Technology Stack Specification
## Project Name: Medical AI Platform (Doctor Booking + AI Clinical Scribe & Companion)
**Author:** AI System Architect & Technical Director  
**Version:** 1.2.0  
**Date:** June 20, 2026  

---

## 1. Frontend Technologies (Web-Only Focus)

The frontend applications focus exclusively on responsive web portals. Mobile applications are excluded from this phase.

### 1.1. Patient Portal (Web App)
* **Framework**: **Next.js (React)**.
  * *Rationale*: Provides Server-Side Rendering (SSR) and Static Site Generation (SSG), which are critical for search engine optimization (SEO) on the public provider marketplace, ensuring fast page load times and indexing capabilities.
* **Styling**: **TailwindCSS** + **Shadcn/ui** (utility-first CSS with accessible component primitives).
  * *Rationale*: Accelerates UI layouts while satisfying web accessibility guidelines (WCAG 2.1) without custom CSS boilerplate.
* **State Management & Caching**: **TanStack Query (React Query)** for server-state caching + **Zustand** for local client states (e.g., active search filters, checkout steps).
  * *Rationale*: Separates local UI states from server states, providing auto-caching, pre-fetching of availability grids, and background sync logic.

### 1.2. Doctor Dashboard Portal (Web App)
* **Framework**: **Next.js (React)**.
  * *Rationale*: Maintains framework consistency across both portals, simplifying developer onboarding, component sharing (e.g., calendar widgets, input validation patterns), and deployment pipelines.
* **Telehealth Media Client**: **LiveKit WebRTC SDK** (React integration).
  * *Rationale*: Interoperates with our media server, rendering local/remote participant streams, managing microphone and camera selection, and handling signal reconnections.

---

## 2. Backend Microservices Technologies (Python-First Stack)

All backend microservices and internal service gateways utilize Python, ensuring unified coding languages, package registries, and standard utility modules across backend and AI services.

### 2.1. API Gateway & Security
* **Gateway Server**: **Python** + **FastAPI** configured as an asynchronous reverse-proxy router.
  * *Rationale*: Outperforms traditional synchronous Python frameworks. Asynchronous coroutines handle heavy I/O workloads (routing, authorization checks, rate limiting) with minimal memory overhead. Security is managed via token validation middleware.

### 2.2. Scheduling & Booking Microservice
* **Framework**: **Python** + **FastAPI** (with **SQLAlchemy** ORM & **Alembic** migrations).
  * *Rationale*: High-concurrency async database operations. SQLAlchemy handles database connections and transactions, while Alembic controls schema migration tracking.

### 2.3. Telehealth & Media Microservice
* **Framework**: **Python** + **FastAPI** (utilizing WebSockets for real-time signaling).
  * *Rationale*: FastAPI's native ASGI (Asynchronous Server Gateway Interface) WebSockets handle high-frequency events (e.g., call status updates) smoothly.
* **Media SDK**: **LiveKit Server API for Python** (`livekit-api` library).
  * *Rationale*: Integrates directly with our self-hosted LiveKit SFU (Selective Forwarding Unit) to generate WebRTC tokens, manage rooms, and coordinate headless bot recorders.

### 2.4. AI Scribe & Conversational Agent Microservices
* **Framework**: **Python** + **FastAPI** (utilizing **Celery** or **Arq** for background task management).
  * *Rationale*: Python provides direct, native integrations with modern deep learning and NLP packages, eliminating serialization latency between service layers.

---

## 3. In-House WebRTC Bot Recording System (Python-First Automation)

Our virtual meeting recorders run completely in-house using containerized browser agents written in Python:
* **Bot Lifecycle Launcher**: **Docker SDK for Python** (triggered from the Telehealth Microservice and running inside container instances).
  * *Rationale*: Spawns, monitors, and terminates isolated bot containers dynamically per meeting session.
* **Headless Browser Participant**: **Playwright for Python** (async API) running inside a Linux Docker container.
  * *Rationale*: Playwright launches a headless Chromium instance, connects to the LiveKit consult room as a silent participant, and automatically subscribes to WebRTC audio/video feeds.
* **Stream Mixer & Transcoder**: **FFmpeg** (invoked via Python subprocess pipes).
  * *Rationale*: Captures virtual audio outputs, synchronizes patient and doctor tracks based on timestamp alignment, applies volume normalization filters, and transcodes the final output into a single, high-fidelity audio container file.

---

## 4. Artificial Intelligence & NLP Stack (AWS-Aligned)

### 4.1. Speech-to-Text & Diarization (Hosted on AWS compute)
* **Hosting Platform**: **Amazon Elastic Compute Cloud (Amazon EC2) G5 instances** (featuring NVIDIA A10G GPUs) or **Amazon SageMaker Endpoints**.
* **Diarization & STT Models**: **PyAnnote.audio** + **OpenAI Whisper (Large-v3)** (running locally inside EKS container pods via **Faster-Whisper** or **vLLM**).
  * *Rationale*: Local hosting on AWS GPU instances guarantees complete data control and complies with HIPAA data residency rules, ensuring voice data never leaves our network boundaries.

### 4.2. Clinical Note Structuring (SOAP Compilation)
* **Framework**: **LlamaIndex** + **LangChain** (Python SDKs).
  * *Rationale*: Simplifies document chunking, prompt template versioning, and JSON schema extraction validation.
* **Medical LLM Endpoint**: **Amazon Bedrock (hosting Anthropic Claude 3.5 Sonnet)**.
  * *Rationale*: Fully compliant server endpoint offering a signed Business Associate Agreement (BAA) and a Zero Data Retention configuration, guaranteeing clinical data is never cached or used for public training.

### 4.3. Care Companion & Booking Agent
* **Agent Engine**: **LangGraph** (Python framework).
  * *Rationale*: Enables cyclic graph execution to build robust stateful agents. This ensures the Booking Agent is locked to a deterministic triage state machine before booking calls.
* **Vector Store**: **Qdrant** or **ChromaDB** (hosted on EKS storage volumes).
  * *Rationale*: Indexes doctor-approved care summaries for RAG-based context injection during post-visit care conversations.

---

## 5. Storage, Database, & Caching Stack (AWS Services)

* **Primary Relational Database**: **Amazon Relational Database Service (Amazon RDS) for PostgreSQL** (configured with Multi-AZ).
  * *Rationale*: Fully-managed ACID transactional database with automated failover and row-level locking to prevent slot reservation conflicts.
* **In-Memory Cache & Session Lock**: **Amazon ElastiCache for Redis**.
  * *Rationale*: Managed, high-speed cache for scheduling locks, user session cache, and active conversation state cache.
* **Object Storage (Media & Transcripts)**: **Amazon Simple Storage Service (Amazon S3)**.
  * *Rationale*: Configured with AWS Key Management Service (AWS KMS) server-side encryption. Provides durable, HIPAA-compliant storage for raw audio recordings, transcripts, and final patient-facing documents.
* **Audit Logger**: **Amazon RDS for PostgreSQL (Append-Only Table)**.
  * *Rationale*: Streamed to **Amazon CloudWatch** and logged via **AWS CloudTrail** to maintain an immutable log of all access transactions to Protected Health Information (PHI).

---

## 6. Infrastructure, CI/CD, & Messaging (AWS Infrastructure)

* **Container Orchestration**: **Amazon Elastic Kubernetes Service (Amazon EKS)**.
  * *Rationale*: Orchestrates the scaling, load balancing, and deployment of all Python microservices and containerized headless recorders.
* **Event Broker / Message Queue**: **Amazon MQ (Managed Apache ActiveMQ or managed RabbitMQ)**.
  * *Rationale*: Provides a fully-managed message broker supporting RabbitMQ protocols, ensuring reliable async messaging (`Session Ended`, `Note Approved` hooks) with zero operational server maintenance.
* **Messaging Gateways**: **Twilio API for Python** (for SMS alerts and conversational voice agent integrations).
  * *Rationale*: Bridges Python services on AWS with mobile network APIs for alerts and voice-call operations.
