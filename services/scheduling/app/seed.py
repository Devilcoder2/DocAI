import sys
import os
from datetime import datetime, timedelta

# Add app parent directory to sys.path to run directly from cmd line
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, Base, engine
from app.models import User, Doctor, Appointment, ScheduleException

def seed_database() -> None:
    """
    Clears tables and inserts mock administrative, patient, and doctor records.
    Provides local dataset profiles for developer validation runs.

    Inputs:
        None

    Outputs:
        None (Writes directly to the relational database).
    """
    db = SessionLocal()
    try:
        print("Clearing historical tables...")
        # Order of deletion is critical to satisfy foreign key cascades
        db.query(ScheduleException).delete()
        db.query(Appointment).delete()
        db.query(Doctor).delete()
        db.query(User).delete()
        db.commit()

        print("Seeding Users...")
        # 1. Admin account
        admin = User(name="System Admin", email="admin@medicalplatform.com", role="Admin")
        # 2. Patients accounts
        p1 = User(name="John Doe", email="john.doe@email.com", role="Patient")
        p2 = User(name="Jane Smith", email="jane.smith@email.com", role="Patient")
        # 3. Doctor users
        doc_u1 = User(name="Dr. Alice Heart", email="alice.heart@medical.com", role="Doctor")
        doc_u2 = User(name="Dr. Bob Tooth", email="bob.tooth@medical.com", role="Doctor")
        doc_u3 = User(name="Dr. Charlie General", email="charlie.general@medical.com", role="Doctor")

        db.add_all([admin, p1, p2, doc_u1, doc_u2, doc_u3])
        db.commit()

        # Refresh objects to bind generated UUID values
        db.refresh(doc_u1)
        db.refresh(doc_u2)
        db.refresh(doc_u3)

        print("Seeding Doctor Profiles...")
        # Specialty: Cardiologist
        d1 = Doctor(
            id=doc_u1.id,
            specialty="Cardiologist",
            clinic_address="123 Cardiac Ave, Suite 100",
            zip_code="90210",
            photo_url="https://images.example.com/alice.jpg",
            rating=4.9
        )
        # Specialty: Dentist
        d2 = Doctor(
            id=doc_u2.id,
            specialty="Dentist",
            clinic_address="456 Dental Way",
            zip_code="10001",
            photo_url="https://images.example.com/bob.jpg",
            rating=4.7
        )
        # Specialty: General Practitioner
        d3 = Doctor(
            id=doc_u3.id,
            specialty="General Practitioner",
            clinic_address="789 Care Blvd",
            zip_code="90210",
            photo_url="https://images.example.com/charlie.jpg",
            rating=4.8
        )

        db.add_all([d1, d2, d3])
        db.commit()

        print("Seeding Schedule Exceptions for Dr. Alice Heart...")
        # Create exception block (e.g., Dr. Heart is out for a dentist visit on June 26)
        # We target tomorrow's calendar date dynamically to test availability pruning
        tomorrow = datetime.now().date() + timedelta(days=1)
        block_start = datetime.combine(tomorrow, datetime.min.time().replace(hour=11, minute=0))
        block_end = datetime.combine(tomorrow, datetime.min.time().replace(hour=13, minute=0))
        
        ex = ScheduleException(
            doctor_id=d1.id,
            start_time=block_start,
            end_time=block_end,
            description="Out of office: Lunch & Personal appointment."
        )
        db.add(ex)
        db.commit()

        print("Database seeded successfully!")
        print("-" * 60)
        print(f"Patient 1 (John Doe) UUID: {p1.id}")
        print(f"Patient 2 (Jane Smith) UUID: {p2.id}")
        print(f"Doctor 1 (Dr. Heart) UUID: {d1.id} (Specialty: Cardiologist, Zip: 90210)")
        print(f"Doctor 2 (Dr. Tooth) UUID: {d2.id} (Specialty: Dentist, Zip: 10001)")
        print(f"Doctor 3 (Dr. General) UUID: {d3.id} (Specialty: General GP, Zip: 90210)")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
