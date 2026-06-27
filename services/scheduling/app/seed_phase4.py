import sys
import os
import uuid
from datetime import datetime, timedelta

# Add app parent directory to sys.path to run directly from cmd line
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from passlib.context import CryptContext
from app.database import SessionLocal
from app.models import User, Doctor, Appointment, ClinicalNote

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_phase4_data() -> None:
    """
    Seeds the local database with 5 mock appointments and associated clinical notes:
    - 3 clinical note drafts (Hypertension, Sore Throat, Back Pain).
    - 1 appointment with NO clinical note.
    - 1 appointment with an APPROVED/LOCKED clinical note.

    Inputs:
        None

    Outputs:
        None (Writes records directly to the database).
    """
    db = SessionLocal()
    try:
        print("Starting Phase 4 database seeder...")

        # 1. Fetch or create doctor
        doctor_user = db.query(User).filter(User.email == "alice.heart@medical.com").first()
        if not doctor_user:
            print("Doctor 'alice.heart@medical.com' not found. Creating...")
            doctor_user = User(
                name="Dr. Alice Heart",
                email="alice.heart@medical.com",
                role="Doctor",
                password_hash=pwd_context.hash("password123")
            )
            db.add(doctor_user)
            db.commit()
            db.refresh(doctor_user)

        doctor = db.query(Doctor).filter(Doctor.id == doctor_user.id).first()
        if not doctor:
            print("Doctor profile card not found. Creating...")
            doctor = Doctor(
                id=doctor_user.id,
                specialty="Cardiologist",
                clinic_address="123 Cardiac Ave, Suite 100",
                zip_code="90210",
                photo_url="https://images.example.com/alice.jpg",
                rating=4.9
            )
            db.add(doctor)
            db.commit()

        # 2. Fetch or create patient
        patient_user = db.query(User).filter(User.email == "john.doe@email.com").first()
        if not patient_user:
            print("Patient 'john.doe@email.com' not found. Creating...")
            patient_user = User(
                name="John Doe",
                email="john.doe@email.com",
                role="Patient",
                password_hash=pwd_context.hash("password123")
            )
            db.add(patient_user)
            db.commit()
            db.refresh(patient_user)

        # Seed specific doctor for Twilio booking bot (11111111-1111-1111-1111-11111111111a)
        twilio_doc_id = uuid.UUID("11111111-1111-1111-1111-11111111111a")
        twilio_doc_user = db.query(User).filter(User.id == twilio_doc_id).first()
        if not twilio_doc_user:
            print("Creating Twilio specialist...")
            twilio_doc_user = User(
                id=twilio_doc_id,
                name="Dr. Twilio Specialist",
                email="twilio.doc@medical.com",
                role="Doctor",
                password_hash=pwd_context.hash("password123")
            )
            db.add(twilio_doc_user)
            db.commit()
            
        twilio_doc = db.query(Doctor).filter(Doctor.id == twilio_doc_id).first()
        if not twilio_doc:
            print("Creating Twilio doctor profile...")
            twilio_doc = Doctor(
                id=twilio_doc_id,
                specialty="General Practitioner",
                clinic_address="456 Webhook Ave",
                zip_code="90210",
                photo_url="https://images.example.com/twilio.jpg",
                rating=4.8
            )
            db.add(twilio_doc)
            db.commit()

        # Seed specific patient for Twilio booking bot (22222222-2222-2222-2222-22222222222b)
        twilio_pat_id = uuid.UUID("22222222-2222-2222-2222-22222222222b")
        twilio_pat_user = db.query(User).filter(User.id == twilio_pat_id).first()
        if not twilio_pat_user:
            print("Creating Twilio patient user...")
            twilio_pat_user = User(
                id=twilio_pat_id,
                name="Twilio Patient",
                email="twilio.patient@email.com",
                role="Patient",
                password_hash=pwd_context.hash("password123")
            )
            db.add(twilio_pat_user)
            db.commit()

        # 3. Clear existing appointments and clinical notes to prevent constraint violations
        print("Clearing historical clinical notes & appointments...")
        db.query(ClinicalNote).delete()
        db.query(Appointment).delete()
        db.commit()

        # Define dates relative to today
        today = datetime.now().date()
        
        # 4. Insert Appointments & Notes
        print("Inserting mock appointments and notes...")

        # Appt 1: Hypertension (Draft Note)
        appt1_time = datetime.combine(today, datetime.min.time().replace(hour=10, minute=0))
        appt1 = Appointment(
            doctor_id=doctor.id,
            patient_id=patient_user.id,
            appointment_time=appt1_time,
            duration_minutes=30,
            status="confirmed",
            consult_type="telehealth",
            reason_for_visit="Chronic hypertension check and blood pressure log review"
        )
        db.add(appt1)
        db.commit()
        db.refresh(appt1)

        note1 = ClinicalNote(
            appointment_id=appt1.id,
            raw_transcript=(
                "Doctor: Hello John, let's review your blood pressure numbers today.\n"
                "Patient: Hello Doctor, I've been taking Lisinopril 10mg every morning. It has been around 135/85 at home.\n"
                "Doctor: That's a good trend. Let's make sure you're checking it twice daily."
            ),
            subjective="Patient presents for follow-up of essential hypertension. Reports daily adherence to Lisinopril 10mg. Home readings average 135/85 mmHg.",
            objective="Clinic Blood Pressure: 138/86 mmHg. Heart rate 74 bpm. Heart sounds normal S1/S2.",
            assessment="Essential Hypertension - Mildly elevated, showing moderate control on Lisinopril 10mg daily. Contributory morning headache reported.",
            plan="1. Continue Lisinopril 10mg orally daily.\n2. Keep home blood pressure log twice daily.\n3. Return to clinic in 4 weeks.",
            patient_summary="Your blood pressure is showing improvement at 138/86 today. Continue taking your Lisinopril pill daily and write down your home BP readings twice a day for our follow-up in 4 weeks.",
            status="draft"
        )
        db.add(note1)

        # Appt 2: Sore Throat (Draft Note)
        appt2_time = datetime.combine(today, datetime.min.time().replace(hour=11, minute=30))
        appt2 = Appointment(
            doctor_id=doctor.id,
            patient_id=patient_user.id,
            appointment_time=appt2_time,
            duration_minutes=30,
            status="confirmed",
            consult_type="telehealth",
            reason_for_visit="Severe sore throat and wet cough with fever"
        )
        db.add(appt2)
        db.commit()
        db.refresh(appt2)

        note2 = ClinicalNote(
            appointment_id=appt2.id,
            raw_transcript=(
                "Doctor: How long have you had this sore throat?\n"
                "Patient: It started 3 days ago, and I had a fever of 100.5 F last night.\n"
                "Doctor: Let me examine your pharynx. It looks red, but there are no white exudates. Rapid strep is negative."
            ),
            subjective="Patient presents with acute pharyngitis and cough for 3 days. Reports subjective fever relieved by ibuprofen.",
            objective="Posterior pharynx is erythematous. Tonsillar exudate is absent. Lungs are clear to auscultation bilaterally.",
            assessment="Acute Viral Upper Respiratory Infection (URI) - Negative rapid streptococcal antigen test.",
            plan="1. Warm salt water gargles and throat lozenges as needed.\n2. Continue Ibuprofen 400mg every 6 hours as needed.\n3. COVID/Flu PCR swab results pending.",
            patient_summary="You have a viral cold and sore throat. The strep test was negative, so antibiotics are not needed. Rest, drink fluids, and use Ibuprofen for throat soreness.",
            status="draft"
        )
        db.add(note2)

        # Appt 3: Back Pain (Draft Note)
        appt3_time = datetime.combine(today, datetime.min.time().replace(hour=14, minute=0))
        appt3 = Appointment(
            doctor_id=doctor.id,
            patient_id=patient_user.id,
            appointment_time=appt3_time,
            duration_minutes=30,
            status="confirmed",
            consult_type="in_person",
            reason_for_visit="Persistent lower back pain after lifting boxes"
        )
        db.add(appt3)
        db.commit()
        db.refresh(appt3)

        note3 = ClinicalNote(
            appointment_id=appt3.id,
            raw_transcript=(
                "Doctor: Where exactly is the pain in your back?\n"
                "Patient: Right in the lower middle part. It hurts more when I bend forward.\n"
                "Doctor: I'll test your reflexes and straight-leg raise. Reflexes are normal. Straight-leg raise is negative for radiating pain."
            ),
            subjective="Patient reports acute lower back pain starting 2 days ago after lifting heavy boxes. Pain is dull, localized to lumbar region, aggravated by flexion.",
            objective="Normal deep tendon reflexes. Straight-leg raise test negative bilaterally. Paraspinal muscle tenderness present.",
            assessment="Acute lumbar muscle strain. No clinical evidence of radiculopathy.",
            plan="1. Avoid heavy lifting and intense exertion for 1 week.\n2. Local heat/ice therapy.\n3. OTC Naproxen 220mg twice daily with food as needed.",
            patient_summary="You have a pulled muscle in your lower back from lifting. Avoid heavy lifting and use heat or ice. You can take Naproxen (Aleve) for pain.",
            status="draft"
        )
        db.add(note3)

        # Appt 4: No Note / Scheduled (No Note)
        appt4_time = datetime.combine(today, datetime.min.time().replace(hour=15, minute=30))
        appt4 = Appointment(
            doctor_id=doctor.id,
            patient_id=patient_user.id,
            appointment_time=appt4_time,
            duration_minutes=30,
            status="confirmed",
            consult_type="telehealth",
            reason_for_visit="Routine physical wellness checkup"
        )
        db.add(appt4)

        # Appt 5: Completed (Approved Note)
        appt5_time = datetime.combine(today, datetime.min.time().replace(hour=16, minute=30))
        appt5 = Appointment(
            doctor_id=doctor.id,
            patient_id=patient_user.id,
            appointment_time=appt5_time,
            duration_minutes=30,
            status="completed",
            consult_type="telehealth",
            reason_for_visit="Follow-up on cholesterol medication and diet"
        )
        db.add(appt5)
        db.commit()
        db.refresh(appt5)

        note5 = ClinicalNote(
            appointment_id=appt5.id,
            raw_transcript=(
                "Doctor: Your lipid panel looks excellent. Total cholesterol is down to 180.\n"
                "Patient: Great! The Atorvastatin must be working, and I've been eating more oatmeal.\n"
                "Doctor: Wonderful. Let's keep you on the same dose."
            ),
            subjective="Patient here for cholesterol management. Reports good tolerance to Atorvastatin 10mg. Follows low-cholesterol diet.",
            objective="Fast lipid panel: Total 180 mg/dL, LDL 98 mg/dL, HDL 52 mg/dL. Vitals normal.",
            assessment="Hyperlipidemia - Well controlled on low-dose statin therapy.",
            plan="1. Continue Atorvastatin 10mg daily.\n2. Maintain heart-healthy diet.\n3. Repeat lipid panel in 6 months.",
            patient_summary="Your cholesterol levels look great and are down to 180. Continue your daily Atorvastatin medication and healthy diet. We will check it again in 6 months.",
            status="approved",
            signed_at=datetime.now() - timedelta(minutes=30)
        )
        db.add(note5)

        db.commit()
        print("Phase 4 seeding completed successfully!")
        print(f" seeded doctor user ID: {doctor.id}")
        print(f" seeded patient user ID: {patient_user.id}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding Phase 4 data: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_phase4_data()
