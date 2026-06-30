# High-Level System Architecture
## Project Name: Medical AI Platform (Doctor Booking + AI Clinical Scribe & Companion)

This document describes the high-level system-wide design and data flow of the Medical AI Platform. For specific module details and tradeoffs, refer to the sub-documents in this directory.

### Sub-Architecture Directory:
* [Frontend Architecture](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/architecture/frontend.md)
* [Backend & Bot System Architecture](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/architecture/backend.md)
* [AI Scribe & Agent Pipeline Architecture](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/architecture/ai.md)
* [Architectural Tradeoff Decisions](file:///Users/ramandeepsingh/Developer/Personal%20Projects/Medical%20AI/docs/architecture/tradeoffs.md)

---

## 1. High-Level System Diagram

The platform utilizes a decoupled, event-driven **Microservices Architecture**. The core business logic is split across distinct services that communicate asynchronously via a central Message Broker and route traffic through an API Gateway:

```mermaid
graph TD
    %% Define Styles
    classDef client fill:#eef2f6,stroke:#475569,stroke-width:2px,color:#0f172a;
    classDef gateway fill:#f1f5f9,stroke:#0284c7,stroke-width:2px,color:#0f172a;
    classDef service fill:#f8fafc,stroke:#4f46e5,stroke-width:2px,color:#0f172a;
    classDef queue fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#0f172a;
    classDef storage fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#0f172a;

    %% Client App
    subgraph Clients ["Web & Mobile Clients"]
        Portal["Patient & Doctor Next.js Portal"]
        Twilio["Twilio SMS/Voice Channels"]
    end
    class Portal,Twilio client;

    %% Gateway Layer
    subgraph Ingress ["Ingress & Security Gateway"]
        APIGateway["FastAPI API Gateway<br>(Reverse Proxy / Audit Logs / WebSockets)"]
    end
    class APIGateway gateway;

    %% Microservices
    subgraph Services ["Core Microservices Layer"]
        Scheduling["Scheduling Microservice<br>(Availability & Roster CRUD)"]
        Telehealth["Telehealth Microservice<br>(LiveKit Room Tokens & Recorders)"]
        Scribe["AI Scribe & Companion Service<br>(SOAP Note Synthesis & LangGraph Agent)"]
    end
    class Scheduling,Telehealth,Scribe service;

    %% Event Broker
    Rabbit["RabbitMQ Message Broker<br>(Event-Driven Orchestration)"]
    class Rabbit queue;

    %% Datastores
    subgraph Storage ["Persistent & Vector Storage Layer"]
        SQLiteDB[("SQLite Database<br>(EHR, Users, Vitals)")]
        LocalMedia[("Encrypted Local Storage<br>(AES-256 Consultation Audio)")]
        QdrantDB[("Qdrant Vector DB<br>(Care Plan Semantic Index)")]
    end
    class SQLiteDB,LocalMedia,QdrantDB storage;

    %% External APIs
    subgraph External ["External Services"]
        LLM["AWS Bedrock / OpenAI APIs"]
        LiveKitServer["LiveKit SFU Server"]
    end
    class LLM,LiveKitServer client;

    %% Core Data Flow Relationships
    Portal & Twilio -->|HTTP / WebSocket| APIGateway
    
    APIGateway -->|Route Requests| Scheduling
    APIGateway -->|Route Requests| Telehealth
    APIGateway -->|Route Requests / Proxy WS| Scribe

    Scheduling <-->|Read / Write| SQLiteDB
    
    Telehealth -->|Spawn Headless Bot| LiveKitServer
    LiveKitServer -->|Capture WebRTC Audio| LocalMedia
    Telehealth -->|Publish 'recording_finished'| Rabbit
    
    Rabbit -->|Consume Event| Scribe
    Scribe -->|Read Encrypted Audio| LocalMedia
    Scribe <-->|LLM Prompt / Response| LLM
    Scribe <-->|Semantic Search / Upsert| QdrantDB
    Scribe -->|Flag Alert / Update SOAP Note| Scheduling
```

---

## 2. Overall System Flow Description

1. **Access Control & Routing**: All client traffic hits the central FastAPI Gateway, which gates protected routes with JWT authorization checks, creates structured JSON audit logs, and handles WebSocket proxying.
2. **Scheduling & Booking**: The Scheduling Microservice manages the SQLite database (`medical_ai_local.db`), verifying available doctor calendar slots, booking appointments with concurrency conflict blocks, and handling patient vital health profiles.
3. **Telehealth Consultation & Audio Capture**: 
   * When a virtual meet begins, the Telehealth Microservice triggers a Playwright recording bot.
   * The containerized bot joins the WebRTC session, records the consultation audio, encrypts it using AES-256 Fernet cryptography, and saves it locally.
   * The Telehealth Service then publishes a `recording_finished` event to RabbitMQ.
4. **AI Scribe Note Generation**: The Scribe Service consumes the event from RabbitMQ, decrypts the audio file, routes the transcript to AWS Bedrock (Claude 3.5 Sonnet) for SOAP note structuring, and saves the draft.
5. **Care Companion Activation & Guardrails**: Once the doctor approves the note, the Care Companion LangGraph workflow is initialized. Patient-friendly summaries are indexed in a Qdrant Vector database, enabling semantic RAG checks with symptom triage safety gates.
