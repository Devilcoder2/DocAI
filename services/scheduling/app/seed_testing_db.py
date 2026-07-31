"""Create a deterministic, frontend-oriented dataset for local testing.

This script is intentionally separate from the application's runtime code. It
resets the local SQLite development database and creates accounts and records
that exercise the patient portal, doctor portal, booking, telehealth, scribe,
history, and care-companion flows.

All seeded accounts use the password: password123
"""

import os
import sys
import uuid
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from passlib.context import CryptContext

from app.database import SessionLocal
from app.models import (
    Appointment,
    ClinicalNote,
    Doctor,
    ScheduleException,
    SystemEvent,
    User,
)


PASSWORD = "password123"
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def fixed_id(value: str) -> uuid.UUID:
    return uuid.UUID(value)


DOCTORS = [
    ("04a7568a-05ca-4130-943c-f80371b837d3", "Dr. Alice Heart", "alice.heart@medical.com", "Cardiologist", "123 Cardiac Ave, Suite 100", "90210", 4.9),
    ("b1000000-0000-0000-0000-000000000002", "Dr. Bob Tooth", "bob.tooth@medical.com", "Dentist", "456 Dental Way", "10001", 4.7),
    ("c1000000-0000-0000-0000-000000000003", "Dr. Charlie General", "charlie.general@medical.com", "General Practitioner", "789 Care Blvd", "90210", 4.8),
    ("d1000000-0000-0000-0000-000000000004", "Dr. Diana Skin", "diana.skin@medical.com", "Dermatologist", "18 Skin Health Road", "60601", 4.8),
    ("e1000000-0000-0000-0000-000000000005", "Dr. Ethan Bones", "ethan.bones@medical.com", "Orthopedist", "25 Mobility Center", "94105", 4.6),
    ("f1000000-0000-0000-0000-000000000006", "Dr. Farah Women", "farah.women@medical.com", "Obstetrician-Gynecologist", "31 Women’s Wellness Dr", "10001", 4.9),
    ("a1000000-0000-0000-0000-000000000007", "Dr. George Kids", "george.kids@medical.com", "Pediatrician", "42 Bright Kids Lane", "75201", 4.8),
    ("a1000000-0000-0000-0000-000000000008", "Dr. Hannah Mind", "hannah.mind@medical.com", "Psychiatrist", "57 Mindful Care Plaza", "98101", 4.7),
    ("a1000000-0000-0000-0000-000000000009", "Dr. Ivan Lungs", "ivan.lungs@medical.com", "Pulmonologist", "63 Respiratory Center", "30301", 4.6),
    ("a1000000-0000-0000-0000-00000000000a", "Dr. Julia Eyes", "julia.eyes@medical.com", "Ophthalmologist", "74 Vision Park", "02108", 4.9),
    ("a1000000-0000-0000-0000-00000000000b", "Dr. Kevin Neuro", "kevin.neuro@medical.com", "Neurologist", "86 Neuro Health Blvd", "20001", 4.5),
    ("11111111-1111-1111-1111-11111111111a", "Dr. Twilio Specialist", "twilio.doc@medical.com", "General Practitioner", "456 Webhook Ave", "90210", 4.8),
]

PATIENTS = [
    ("a2000000-0000-0000-0000-000000000001", "John Doe", "john.doe@email.com", 45, 82.0, 178.0, "Male", "Penicillin", "Hypertension"),
    ("b2000000-0000-0000-0000-000000000002", "Jane Smith", "jane.smith@email.com", 34, 64.0, 165.0, "Female", "No known allergies", "Asthma"),
    ("c2000000-0000-0000-0000-000000000003", "Priya Sharma", "priya.sharma@email.com", 29, 58.0, 160.0, "Female", "Latex", "Migraine"),
    ("22222222-2222-2222-2222-22222222222b", "Twilio Patient", "twilio.patient@email.com", 52, 91.0, 181.0, "Male", "Sulfa drugs", "Type 2 diabetes"),
]


def make_user(user_id, name, email, role, **health):
    return User(
        id=fixed_id(user_id),
        name=name,
        email=email,
        role=role,
        password_hash=pwd_context.hash(PASSWORD),
        **health,
    )


def add_appointment(db, doctor_id, patient_id, when, status, consult_type, reason):
    appt = Appointment(
        id=uuid.uuid4(),
        doctor_id=fixed_id(doctor_id),
        patient_id=fixed_id(patient_id),
        appointment_time=when,
        duration_minutes=30,
        status=status,
        consult_type=consult_type,
        reason_for_visit=reason,
    )
    db.add(appt)
    db.flush()
    return appt


def add_note(db, appointment, *, status="draft", escalation=False, signed_days_ago=None, **fields):
    note = ClinicalNote(
        id=uuid.uuid4(),
        appointment_id=appointment.id,
        status=status,
        requires_escalation=escalation,
        signed_at=(datetime.now() - timedelta(days=signed_days_ago) if signed_days_ago is not None else None),
        **fields,
    )
    db.add(note)
    db.flush()
    return note


def seed_testing_database():
    db = SessionLocal()
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    try:
        # This is a disposable local test database. Remove dependent rows first.
        db.query(SystemEvent).delete()
        db.query(ClinicalNote).delete()
        db.query(ScheduleException).delete()
        db.query(Appointment).delete()
        db.query(Doctor).delete()
        db.query(User).delete()
        db.commit()

        admin = make_user(
            "d3000000-0000-0000-0000-000000000001",
            "System Admin",
            "admin@medicalplatform.com",
            "Admin",
        )
        db.add(admin)

        for row in PATIENTS:
            user_id, name, email, age, weight, height, gender, allergies, chronic = row
            db.add(make_user(
                user_id, name, email, "Patient",
                age=age,
                weight=weight,
                height=height,
                gender=gender,
                allergies=allergies,
                chronic_illnesses=chronic,
            ))

        # Commit standalone users before adding doctor profiles. This avoids a
        # SQLite flush-order edge case with the shared UUID primary/foreign key.
        db.commit()

        for user_id, name, email, specialty, address, zip_code, rating in DOCTORS:
            db.add(make_user(user_id, name, email, "Doctor"))
        db.commit()

        for user_id, name, email, specialty, address, zip_code, rating in DOCTORS:
            db.add(Doctor(
                id=fixed_id(user_id),
                specialty=specialty,
                clinic_address=address,
                zip_code=zip_code,
                photo_url=f"https://images.example.com/{email.split('@')[0]}.jpg",
                rating=rating,
            ))

        db.commit()

        # Availability exception visible in the public scheduling flow.
        db.add(ScheduleException(
            id=uuid.uuid4(),
            doctor_id=fixed_id(DOCTORS[0][0]),
            start_time=today + timedelta(days=1, hours=11),
            end_time=today + timedelta(days=1, hours=13),
            description="Out of office: protected clinical administration block.",
        ))

        john = PATIENTS[0][0]
        jane = PATIENTS[1][0]
        priya = PATIENTS[2][0]
        twilio_patient = PATIENTS[3][0]
        alice = DOCTORS[0][0]
        bob = DOCTORS[1][0]
        charlie = DOCTORS[2][0]
        diana = DOCTORS[3][0]
        ethan = DOCTORS[4][0]
        farah = DOCTORS[5][0]
        george = DOCTORS[6][0]
        hannah = DOCTORS[7][0]
        twilio_doctor = DOCTORS[11][0]

        # John: rich history, one active draft, and an upcoming telehealth appointment.
        john_htn = add_appointment(db, alice, john, today - timedelta(days=8, hours=-10), "completed", "telehealth", "Hypertension follow-up and home blood pressure review")
        add_note(db, john_htn, status="approved", signed_days_ago=8,
                 raw_transcript="Doctor: How have your blood pressure readings been?\nPatient: Around 135/85 and I take Lisinopril every morning.",
                 subjective="Patient reports improved home blood pressure readings averaging 135/85 mmHg and daily adherence to Lisinopril 10mg.",
                 objective="Blood pressure 138/86 mmHg. Heart rate 74 bpm. Cardiovascular examination normal.",
                 assessment="Essential hypertension, improving but mildly above target.",
                 plan="Continue Lisinopril 10mg once daily. Keep a blood pressure log twice daily. Follow up in 4 weeks.",
                 patient_summary="Your blood pressure is improving. Continue Lisinopril 10mg daily and record readings twice a day.")

        john_uri = add_appointment(db, charlie, john, today - timedelta(days=3, hours=-11), "completed", "in_person", "Sore throat and cough")
        add_note(db, john_uri, status="approved", signed_days_ago=3,
                 raw_transcript="Doctor: When did the sore throat begin?\nPatient: Three days ago with a dry cough.",
                 subjective="Three-day history of sore throat, dry cough, runny nose, and subjective fever.",
                 objective="Mild pharyngeal erythema without exudate. Lungs clear. Oxygen saturation 99%.",
                 assessment="Acute viral upper respiratory infection.",
                 plan="Rest, fluids, warm salt-water gargles, and Ibuprofen 400mg as needed. Seek care for breathing difficulty.",
                 patient_summary="This appears to be a viral upper respiratory infection. Rest, hydrate, and monitor for worsening symptoms.")

        john_draft_appt = add_appointment(db, alice, john, today + timedelta(days=1, hours=10), "confirmed", "telehealth", "Follow-up consultation requiring doctor review")
        add_note(db, john_draft_appt, status="draft",
                 raw_transcript="Doctor: Tell me how the headaches have been since your last visit.\nPatient: They are less frequent but still occur in the morning.",
                 subjective="Patient reports intermittent morning headaches with reduced frequency.",
                 objective="Vitals to be reviewed during consultation.",
                 assessment="Headache symptoms under evaluation.",
                 plan="Review symptom diary and home blood pressure readings; determine follow-up plan.",
                 patient_summary="Your doctor is reviewing your recent headache symptoms and will finalize the care plan.")

        add_appointment(db, bob, john, today + timedelta(days=3, hours=11), "confirmed", "in_person", "Routine dental check-up")

        # Jane: upcoming visits across formats and a completed dermatology consultation.
        jane_skin = add_appointment(db, diana, jane, today - timedelta(days=5, hours=-9), "completed", "in_person", "Persistent skin irritation")
        add_note(db, jane_skin, status="approved", signed_days_ago=5,
                 raw_transcript="Doctor: When did the irritation start?\nPatient: About two weeks ago after changing soap.",
                 subjective="Patient reports two weeks of localized skin irritation after changing personal-care products.",
                 objective="Mild erythematous patch without drainage or open wound.",
                 assessment="Likely irritant contact dermatitis.",
                 plan="Stop the new soap, use fragrance-free moisturizer, and apply prescribed topical cream as directed.",
                 patient_summary="Avoid the new soap and follow the topical treatment instructions. Contact the office if the rash spreads.")
        add_appointment(db, ethan, jane, today + timedelta(days=1, hours=14), "confirmed", "in_person", "Knee pain after exercise")
        add_appointment(db, hannah, jane, today + timedelta(days=4, hours=15), "confirmed", "telehealth", "Stress and sleep consultation")

        # Priya: approved note with escalation flag for testing the companion safety state.
        priya_escalation = add_appointment(db, charlie, priya, today - timedelta(days=1, hours=-13), "completed", "telehealth", "Follow-up for migraine symptoms")
        add_note(db, priya_escalation, status="approved", escalation=True, signed_days_ago=1,
                 raw_transcript="Doctor: How are the migraines?\nPatient: The headache is now spreading and burning.",
                 subjective="Patient reports migraine history with recently worsening headache symptoms.",
                 objective="No acute findings documented in the approved note.",
                 assessment="Migraine follow-up requiring clinician review because of reported worsening symptoms.",
                 plan="Clinic staff to contact patient for follow-up assessment. Seek emergency care for severe or sudden symptoms.",
                 patient_summary="Your report has been marked for review by the clinic. Please wait for the office to contact you.")
        add_system_event = SystemEvent(
            id=uuid.uuid4(),
            appointment_id=priya_escalation.id,
            event_type="clinical_escalation",
            description="Care Companion escalation requested clinician review.",
        )
        db.add(add_system_event)
        add_appointment(db, george, priya, today + timedelta(days=2, hours=9), "confirmed", "telehealth", "Pediatric-style family medicine booking test")
        cancelled = add_appointment(db, farah, priya, today + timedelta(days=5, hours=13), "cancelled", "in_person", "Annual wellness consultation - cancelled test case")

        # Twilio-compatible fixed IDs support the conversational booking test path.
        add_appointment(db, twilio_doctor, twilio_patient, today + timedelta(days=2, hours=9), "confirmed", "in_person", "Annual physical booked through assistant")

        # Extra clean upcoming slots across several doctors make discovery testing useful.
        add_appointment(db, DOCTORS[8][0], john, today + timedelta(days=4, hours=9), "confirmed", "telehealth", "Breathing and sleep review")
        add_appointment(db, DOCTORS[9][0], jane, today + timedelta(days=6, hours=10), "confirmed", "in_person", "Routine vision examination")
        add_appointment(db, DOCTORS[10][0], priya, today + timedelta(days=7, hours=11), "confirmed", "telehealth", "Headache prevention consultation")

        db.commit()

        print("Testing database seeded successfully.")
        print(f"Doctors: {db.query(Doctor).count()}")
        print(f"Patients: {db.query(User).filter(User.role == 'Patient').count()}")
        print(f"Appointments: {db.query(Appointment).count()}")
        print(f"Clinical notes: {db.query(ClinicalNote).count()}")
        print("Password for all seeded accounts: password123")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_testing_database()
