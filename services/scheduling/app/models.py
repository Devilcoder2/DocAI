import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON, Index, text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    """
    User account model.
    Stores login name, unique email index, and system role (Patient, Doctor, Admin).
    """
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)  # Patient, Doctor, Admin
    
    # Relationships
    doctor_profile = relationship("Doctor", uselist=False, back_populates="user", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")


class Doctor(Base):
    """
    Healthcare provider profile model.
    Contains specialty, address, zip code filters, and links to base user tables.
    """
    __tablename__ = "doctors"
    
    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    specialty = Column(String, index=True, nullable=False)
    clinic_address = Column(String, nullable=False)
    zip_code = Column(String, index=True, nullable=False)
    photo_url = Column(String, nullable=True)
    rating = Column(Float, default=0.0)
    
    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")
    exceptions = relationship("ScheduleException", back_populates="doctor", cascade="all, delete-orphan")


class Appointment(Base):
    """
    Consultation booking model.
    Stores timestamps and checkout reasons.
    """
    __tablename__ = "appointments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    appointment_time = Column(DateTime, index=True, nullable=False)
    duration_minutes = Column(Integer, default=30)
    status = Column(String, default="confirmed")  # pending, confirmed, completed, cancelled
    consult_type = Column(String, nullable=False)  # in_person, telehealth
    reason_for_visit = Column(Text, nullable=False)
    
    # Relationships
    doctor = relationship("Doctor", back_populates="appointments")
    patient = relationship("User", back_populates="appointments")
    clinical_note = relationship("ClinicalNote", uselist=False, back_populates="appointment", cascade="all, delete-orphan")


class ScheduleException(Base):
    """
    Doctor availability calendar exception model.
    Overrides normal daily base hours for vacations or breaks.
    """
    __tablename__ = "schedule_exceptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    description = Column(Text, nullable=True)
    
    # Relationships
    doctor = relationship("Doctor", back_populates="exceptions")


class ClinicalNote(Base):
    """
    Clinical Note model.
    Holds raw conversational transcripts and structured SOAP note blocks.
    
    Database Columns:
        id (UUID): Primary key.
        appointment_id (UUID): Associated appointment link.
        raw_transcript (Text): Chronological conversational transcript.
        subjective (Text): Clinical SOAP Subjective section.
        objective (Text): Clinical SOAP Objective section.
        assessment (Text): Clinical SOAP Assessment section.
        plan (Text): Clinical SOAP Plan section.
        patient_summary (Text): Patient-friendly lay summary.
        status (String): Note state ('draft' or 'approved').
        signed_at (DateTime): Timestamp of clinician sign-off.
    """
    __tablename__ = "clinical_notes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    raw_transcript = Column(Text, nullable=True)
    subjective = Column(Text, nullable=True)
    objective = Column(Text, nullable=True)
    assessment = Column(Text, nullable=True)
    plan = Column(Text, nullable=True)
    patient_summary = Column(Text, nullable=True)
    status = Column(String, default="draft")  # draft, approved
    signed_at = Column(DateTime, nullable=True)
    requires_escalation = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    appointment = relationship("Appointment", back_populates="clinical_note")


class SystemEvent(Base):
    """
    SystemEvent model.
    Stores audited system activities, including safety triggers and clinical escalations.
    """
    __tablename__ = "system_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), nullable=True)
    event_type = Column(String, nullable=False)  # e.g., clinical_escalation
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    appointment = relationship("Appointment")


# PostgreSQL Partial Unique Index
# This index enforces a constraint at the database tier ensuring no two active
# (non-cancelled) bookings can exist concurrently for the same doctor at the same slot.
Index(
    'uq_active_appointment',
    Appointment.doctor_id,
    Appointment.appointment_time,
    unique=True,
    postgresql_where=text("status != 'cancelled'")
)
