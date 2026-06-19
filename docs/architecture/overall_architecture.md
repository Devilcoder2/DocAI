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

The platform utilizes a decoupled, event-driven **Microservices Architecture**. Distinct business segments run as isolated services that manage their own databases and communicate asynchronously via a central Event Broker.

```mermaid
graph TD
    %% Presentation Layer
    subgraph Presentation_Layer [Presentation Layer]
        PatientApp[Patient Web & Mobile Clients]
        DoctorApp[Doctor Dashboard Client]
        VoiceSMS[SMS & Voice Phone Gateways]
    end

    %% Gateway Layer
    subgraph Gateway_Layer [Gateway & Security Layer]
        APIGateway[API Gateway / Router]
        AuthN[Authentication & Access Controller]
        Audit[Audit Logs Logger]
    end

    %% Microservices Layer
    subgraph Microservices_Layer [Decoupled Microservices Layer]
        SchedulingService[Scheduling Microservice]
        TelehealthService[Telehealth & Media Microservice]
        ScribeService[AI Scribe Microservice]
        AgentService[Conversational Agent Microservice]
    end

    %% In-house Bot System
    subgraph In_house_Recording_Bot [In-House Bot Recorder System]
        BotManager[Bot Launcher & Manager]
        HeadlessBot[Headless WebRTC Recording Bot]
    end

    %% Event Broker
    EventBroker[Event Broker / Message Queue]

    %% Storage Layer
    subgraph Storage_Layer [Storage & Data Layer]
        SchedDB[(Scheduling DB)]
        MediaStore[(Media & Storage Service)]
        DocStore[(Clinical Note DB)]
        AuditDB[(Immutable Access Log DB)]
    end

    %% Connections
    PatientApp & DoctorApp & VoiceSMS -->|HTTPS / WSS| APIGateway
    APIGateway --> AuthN
    AuthN -->|Success| Audit
    Audit --> AuditDB
    
    %% Gateway Routing
    APIGateway -->|Route Requests| SchedulingService & TelehealthService & AgentService
    
    %% Service DB Ownership
    SchedulingService --> SchedDB
    TelehealthService --> MediaStore
    ScribeService --> DocStore
    AgentService --> DocStore & SchedDB
    
    %% Telehealth Bot Flow
    TelehealthService -->|Trigger Session Bot| BotManager
    BotManager -->|Launch Container| HeadlessBot
    HeadlessBot -->|Stream Raw Audio/Video| MediaStore
    
    %% Event-Driven Coordination
    TelehealthService -->|Publish Session Ended Event| EventBroker
    EventBroker -->|Consume Event| ScribeService
    ScribeService -->|Publish Note Approved Event| EventBroker
    EventBroker -->|Consume Event| AgentService
```

---

## 2. Overall System Flow Description

1. **Access Control & Routing**: All client calls hit the central API Gateway. It validates access tokens, records audit entries, and routes requests to the corresponding microservice.
2. **Scheduling & Booking**: The Scheduling Microservice operates independently, managing availability slots and booking records in its own database.
3. **Telehealth Consultation & Recording**: 
   * When a virtual meet begins, the Telehealth Microservice triggers the in-house Bot Launcher.
   * A containerized Headless Recording Bot joins the room, captures raw synchronized audio/video, and streams it directly to the Media Storage Service.
   * Once the session terminates, the Telehealth Service emits a `Session Ended` event onto the Event Broker.
4. **AI Note Processing**: The AI Scribe Microservice consumes the `Session Ended` event, retrieves the audio from storage, transcribes and structures the clinical note, and saves the draft.
5. **Care Companion Activation**: When the doctor signs off on the note, a `Note Approved` event is published, signaling the Conversational Agent Microservice to initialize Care Companion follow-up schedules.
