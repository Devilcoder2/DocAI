# Software Requirements Document (SRD)
## Project Name: Medical AI Platform (Doctor Booking + AI Clinical Scribe & Companion)
**Author:** Product Management & AI System Design Team  
**Version:** 1.0.0  
**Date:** June 18, 2026  

---

## 1. Executive Summary & Project Goals
The Medical AI Platform is an online, health-compliant patient-doctor marketplace and clinical workflow automation tool. The platform enables patients to find, research, and book appointments with healthcare providers, and integrates automated artificial intelligence tools to handle note-taking during consultations, post-visit follow-ups, and voice/text appointment scheduling.

The primary goals of the system are:
1. **Reduce Clinical Administrative Burden**: Automatically transcribe consultations and compile drafts of clinical notes, enabling doctors to focus on patient interaction rather than manual typing.
2. **Improve Patient Post-Visit Adherence**: Provide patients with automated care plans, interactive check-ins, and a chat companion that answers questions regarding their prescribed treatment.
3. **Streamline Scheduling**: Allow patients to schedule, modify, or cancel appointments via a conversational agent that performs preliminary symptom-triage checks.

---

## 2. User Roles & Access Control Policy
The system behaves differently depending on the authenticated role:
* **Patient**: Can search for providers, manage their profile, view booking history, upload insurance details, join virtual video consultations, view doctor-approved medical summaries, and converse with their artificial intelligence care companion.
* **Doctor**: Can configure their professional profile, set office and virtual hours, view a list of scheduled patients, launch virtual video sessions, record physical check-ups, review and edit draft notes, and sign off on care plans.
* **Clinic Administrator / Staff**: Can manage rosters for multiple doctors under a clinic, review billing logs, override scheduling blocks, and configure clinic-wide settings (e.g., accepted insurance networks).

---

## 3. Patient Portal Functional Requirements

### 3.1. Landing Page & Provider Discovery
* **Discovery Search Bar**:
  * The search engine supports free-text inputs, autocomplete recommendations, and automatic medical translation.
  * If a patient searches for a general symptom or colloquial term (e.g., "aching joints"), the search engine translates this into appropriate specialties (e.g., Rheumatologist, Orthopedist) and displays matching doctors.
  * Users can search simultaneously by: Specialty/Condition, Location (Zone Improvement Plan (ZIP) code, city, or physical device location), Preferred Appointment Date, and Insurance Carrier/Plan.
* **Filter Panel**:
  * Users can narrow down search results using specific filters:
    * **Consultation Format**: In-Person Visit, Virtual Video Consult, or either.
    * **Provider Gender**: Female, Male, Non-Binary.
    * **Languages Spoken**: Multi-select checklist (e.g., English, Spanish, Hindi).
    * **Time of Day**: Morning, Afternoon, Evening.
    * **In-Network Only**: Checkbox to restrict results to doctors accepting the patient's selected insurance plan.
* **Provider Search Results Card**:
  * Displays the doctor's full name, professional photograph, primary specialty, clinic location, average review score (e.g., 4.8 out of 5 stars), and total number of reviews.
  * Shows a visual carousel of the next 3 available appointment slots with a "Show More Times" toggle.
  * Highlights "In-Network" or "Out-of-Network" badges dynamically based on the user's active insurance.

### 3.2. Doctor Public Profile Page
* **Detailed Credentials Section**:
  * Displays the doctor’s biography, education history, residencies, board certifications, awards, and affiliated hospitals.
  * Lists clinic location with an interactive map, office telephone numbers, and parking information.
* **Patient Reviews Section**:
  * Displays an aggregated rating breakdown (e.g., Bedside Manner, Wait Time, Overall Score).
  * Lists chronological patient reviews. Only patients who have a confirmed, completed appointment in the database are permitted to submit reviews, preventing fake testimonials.
* **Interactive Availability Calendar Grid**:
  * Shows a rolling 14-day calendar grid of available time slots.
  * Slots are visually color-coded or grouped by type (e.g., virtual video meetings vs. in-person clinic visits).

### 3.3. Appointment Booking Workflow
* **Step 1: Patient Classification & Reason**:
  * Patient must select whether they are a "New Patient" or a "Returning Patient" for this specific provider.
  * Patient selects a primary visit reason from a dropdown (e.g., Annual Physical, Follow-Up, Illness) and provides a mandatory written description of symptoms in a free-text area.
* **Step 2: Insurance Validation**:
  * Prompt for the user to select their insurance carrier and specific plan.
  * Prompt for insurance identification numbers.
* **Step 3: Account Sign-Up/Sign-In**:
  * Guests are prompted to log in or create a patient account to save their booking.
* **Step 4: Contact & Notification Preferences**:
  * Patient chooses preferred contact methods for reminders (email notifications, mobile text alerts, or both).
* **Step 5: Consent Forms**:
  * Patient must review and digitally sign terms of service, privacy practices, and a consent form for artificial intelligence note-taking. The form must explain that consultations will be processed by artificial intelligence to draft clinical records for doctor review.
* **Step 6: Confirmation Screen**:
  * Displays a summary of the booked appointment, doctor details, maps/directions, telehealth instructions, and an option to add the appointment to external calendars.

### 3.4. Telehealth Video Consult Screen
* **Interactive Controls**:
  * Patient console features standard toggles: camera on/off, microphone mute/unmute, chat box, screen share, and "Leave Call."
* **Recording & AI Presence Indicator**:
  * A clear visual banner at the top of the interface states: *"AI Scribe Bot is present and recording this session. Your doctor will review the notes."*
  * If the patient revokes consent during the call, they can click a "Turn Off AI Scribe" button, which stops the recording, purges the session draft, and alerts the doctor.

### 3.5. Patient Dashboard & Timeline
* **Appointments Tab**:
  * Lists upcoming appointments with options to reschedule (if permitted by the clinic’s cancellation policy) or cancel.
  * Lists historic appointments.
* **Medical Summary Tab**:
  * Displays the patient-friendly summary for each completed appointment.
  * Includes an interactive medication list detailing: Medicine Name, Prescribed Dosage, Intake Instructions (e.g., "Take twice daily with food"), Duration, and Cautions/Precautions.
  * Provides direct links to download official Portable Document Format (PDF) prescriptions or referral documents uploaded by the doctor.

---

## 4. Doctor Portal Functional Requirements

### 4.1. Clinic Dashboard & Patient Queue
* **Daily Agenda**:
  * Lists all appointments scheduled for the current day, ordered chronologically.
  * Shows patient name, visit type (virtual vs. in-person), insurance verification status, and attendance status (e.g., Scheduled, Waiting Room, Active Consult, Completed, No-Show).
* **Actionable Task Queue**:
  * Lists pending clinical summaries requiring doctor review.
  * Displays indicators for documents requiring urgent attention (e.g., "Prescription release pending").

### 4.2. Availability & Calendar Administrator
* **Office Hours Scheduler**:
  * Interactive weekly grid where the doctor or clinic staff sets regular availability patterns.
  * Supports creating exception blocks (e.g., vacation days, conferences) which automatically hide those time slots from the public search listing.
* **Sync Configuration**:
  * Enables the provider to link their professional schedule with third-party scheduling systems, ensuring outside blockages automatically sync to the platform and vice-versa.

### 4.3. Consultation Scribe Workspace (Split-Screen Interface)
* **Left Panel: Patient & Consultation Details**:
  * Displays patient demographic details, medical history notes, and the current visit reason.
  * **Live/Post-Call Transcript Viewer**: Displays the word-for-word conversation transcript, organized by speaker label (e.g., "Doctor:", "Patient"). The doctor can search the text for specific keywords.
* **Right Panel: Clinical Note Editor (SOAP Format)**:
  * Displays the artificial intelligence-generated draft of the clinical note, organized into standard medical categories:
    * **Subjective**: Patient’s described symptoms, family medical history, and onset timelines.
    * **Objective**: Findings discussed during the exam, vital signs, or visible symptoms.
    * **Assessment**: AI-suggested clinical diagnoses based on the consultation.
    * **Plan**: The proposed treatment plan, including prescriptions, referrals, lab orders, and follow-up directives.
  * **Inline Editing**: The doctor can click any section to edit the text manually.
  * **AI Draft Prompts**: A toolbar allowing the doctor to prompt the assistant to make specific edits (e.g., *"Rewrite the plan to reflect a 5-day cycle of antibiotics instead of 10 days"*, or *"Add more clinical detail to the objective assessment based on our chat"*).
* **Approval & Release Controls**:
  * **"Approve & Sign" Button**: Confirms the clinical note. Once clicked:
    1. The finalized medical record is locked and saved to the patient's medical history.
    2. A simplified, patient-friendly summary is compiled.
    3. The summary is pushed to the Patient Portal.
    4. An automated prescription notification is sent to the patient's pharmacy or portal.

### 4.4. In-Person Consultation Recorder
* **Ambient Capture Panel**:
  * When a patient visits the physical clinic, the doctor opens the app on a mobile device or desktop browser and navigates to the patient's active appointment.
  * The screen features a prominent, red "Record Consultation" button.
  * **Visual Waveform**: Confirms that audio is being successfully captured from the device microphone.
  * **Controls**:
    * **Pause**: Temporarily stops recording (e.g., if the patient needs to step out or discuss private non-medical payment issues).
    * **Resume**: Continues recording.
    * **Complete Session**: Stops the recording, submits the audio for transcription/processing, and redirects the doctor to the Scribe Workspace.
    * **Discard**: Stops the recording and deletes all captured audio immediately, leaving no trace on the server.

---

## 5. Conversational AI Booking Agent Functional Requirements

### 5.1. Channel Availability
* The booking assistant is accessible to patients via interactive text channels (e.g., Web Chat, Short Message Service) and voice channels (e.g., automated phone system).

### 5.2. Conversational Flows & Behaviors
* **Step 1: Patient Greeting & Identification**:
  * The agent greets the user and requests their full name, date of birth, and contact details. It checks the database to verify if an account exists.
* **Step 2: Emergency Triage Verification**:
  * The agent initiates a mandatory clinical screening: *"Are you experiencing any life-threatening symptoms, such as severe chest pain, extreme shortness of breath, sudden numbness, or heavy bleeding?"*
  * If the patient indicates "Yes" or uses emergency keywords, the agent interrupts the booking process: *"Please hang up and dial 911 or go to the nearest emergency room immediately. I cannot schedule emergency visits."* It provides emergency helpline information and exits the conversation.
* **Step 3: Provider Match & Referral**:
  * If the patient reports non-urgent issues (e.g., "mild throat irritation", "routine dental checkup"), the agent asks questions to determine the correct medical category.
  * The agent checks the scheduling roster and presents 2 or 3 matching providers who accept the patient's insurance, stating their names, specialties, and nearest locations.
* **Step 4: Availability Match & Selection**:
  * The agent offers the patient upcoming available slots (e.g., *"Dr. Smith has an open slot tomorrow at 10:00 AM or Thursday at 2:00 PM. Do either of those work for you?"*).
  * The patient selects a slot.
* **Step 5: Confirmation & Intake Hand-Off**:
  * The agent reserves the slot, texts/emails an appointment confirmation link, and instructs the patient: *"Please click the link to complete your digital intake forms before your visit."*

---

## 6. Post-Visit AI Care Companion Functional Requirements

### 6.1. Patient Onboarding & Engagement Triggers
* **Activation Trigger**:
  * Once the doctor approves the clinical consultation note and signs off, the Care Companion is activated for the patient.
* **Welcome Message**:
  * The companion sends an introductory message to the patient (via push notification or Short Message Service): *"Hi John, I am your Care Companion for your visit yesterday with Dr. Smith. I have your approved care summary and will check in on your recovery."*

### 6.2. Medication & Plan Follow-Ups
* **Dosing Reminders**:
  * If the doctor's plan contains a prescription, the companion schedules push alerts to check adherence: *"Hi John, time for your morning dose of your medication. Have you taken it?"*
  * The user can reply "Yes", "No", or snooze the reminder. The companion logs these responses in a medication adherence history chart.
* **Precautions Alerts**:
  * Generates proactive reminders about treatment restrictions: *"Remember to avoid direct sunlight and strenuous exercise while taking this medication."*

### 6.3. Patient Inquiry & Question Handling (Guardrails)
* **Scope of Inquiry**:
  * Patients can ask the companion questions regarding their specific care plan: *"Can I take my medication with apple juice?"* or *"What was the dosage for my eye drops again?"*
  * **Strict Data Anchoring**: The companion must answer questions using *only* the context of the doctor-approved clinical plan and a verified, locked medical dictionary. It is forbidden from diagnosing new symptoms or offering unapproved advice.
* **Safety Escalation Protocol**:
  * If the patient asks a question outside the scope of their document, or reports worsening symptoms (e.g., *"My rash is spreading and it burns now"*), the companion must respond: *"I cannot diagnose new symptoms. I have marked this for review by your doctor’s office. A clinic representative will contact you directly, or you can call them at [Office Phone]. If you are experiencing an emergency, please dial 911."*
  * The system flags the patient's record on the doctor's dashboard as "Requires Escalation," showing the conversation transcript to the clinic team.

---

## 7. Future Feature Requirements (Phase 2 Roadmap)

*The following features are scheduled for development in a subsequent phase and are excluded from the initial launch:*

### 7.1. Vision-Based Insurance Card Parser
* **Patient Scanning Interface**: Patients can take a photo of the front and back of their insurance card using a mobile camera or upload image files.
* **Data Extraction**: The system analyzes the image and extracts the Insurance Carrier, Plan Name, Member Identification Number, Group Number, and Copay values. It auto-fills the patient's profile and displays verified in-network indicators for matching doctors.

### 7.2. Conversational Pre-Visit Patient Intake
* **Intake Chat Interview**: Instead of writing in standard text forms, patients complete a conversational chat interview before their appointment. The agent asks about medical history, current medications, allergies, and symptoms, and compiles the answers into a structured pre-visit intake summary for the doctor.

### 7.3. Clinic Operational Analytics
* **No-Show Predictor**: Analytics dashboard analyzing clinic appointment data to calculate the probability of patient cancellations or no-shows based on historical patterns, weather, and distance.
* **Calendar Optimization**: Suggests double-booking options or standby slots for patients based on high-risk no-show profiles.

---

## 8. Non-Functional & Regulatory Policy Requirements

### 8.1. Data Privacy & Consent Rules
* **Health Insurance Portability and Accountability Act (HIPAA) Compliance (US)**:
  * All patient health data must be encrypted at all times (when stored on servers and when moving across the internet).
  * Strict access controls: Only authorized medical staff and the patient can view patient records.
  * Audit logging: The system must keep a detailed record of every time a patient's medical file is viewed, edited, or sent.
* **General Data Protection Regulation (GDPR) Compliance (EU)**:
  * **Consent Control**: Patients must actively check a box consenting to clinical audio recordings before a virtual meet or ambient recording begins.
  * **Data Portability**: Patients can request a digital copy of all their personal data, including consultation summaries and transcripts.
  * **Right to Erasure**: Patients can request the deletion of their records, subject to medical retention laws that govern how long doctors must keep medical files.

### 8.2. Transcription & Interface Performance Metrics
* **Processing Speed**: AI transcription and draft clinical notes must be fully compiled and visible on the doctor's dashboard within 120 seconds of completing a consultation.
* **Search Response Time**: Provider search results and map interfaces must load in under 2 seconds.
* **System Availability**: The booking platform and database services must remain online 99.9% of the time, excluding scheduled maintenance.
