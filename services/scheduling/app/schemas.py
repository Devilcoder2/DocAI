from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from uuid import UUID

class UserBase(BaseModel):
    """
    Base properties of a user.
    """
    name: str = Field(..., description="Full name of the user account.")
    email: str = Field(..., description="Unique email address for authentication.")
    role: str = Field(..., description="Role claim: Patient, Doctor, or Admin.")


class UserCreate(UserBase):
    """
    Input schema to create a new user profile.
    """
    pass


class UserUpdate(BaseModel):
    """
    Input schema to update an existing user profile.
    """
    name: Optional[str] = Field(None, description="Updated full name of the user.")
    email: Optional[str] = Field(None, description="Updated email address.")
    role: Optional[str] = Field(None, description="Updated role claim (Patient, Doctor, Admin).")


class UserOut(UserBase):
    """
    Response schema returning user properties with unique UUID.
    """
    id: UUID

    class Config:
        from_attributes = True


class DoctorBase(BaseModel):
    """
    Base properties of a doctor profile.
    """
    specialty: str = Field(..., description="Medical specialty (e.g. Cardiologist, Dentist).")
    clinic_address: str = Field(..., description="Street address of the physical clinic.")
    zip_code: str = Field(..., description="ZIP code where the clinic is located.")
    accepted_insurances: List[str] = Field(..., description="JSON-serializable list of accepted insurance carrier names.")
    photo_url: Optional[str] = Field(None, description="URL of the doctor's profile picture.")
    rating: float = Field(0.0, description="Average rating scored from verified reviews.")


class DoctorCreate(DoctorBase):
    """
    Input schema to link a doctor profile to an existing User.
    """
    id: UUID = Field(..., description="UUID of the corresponding User account.")


class DoctorUpdate(BaseModel):
    """
    Input schema to update an existing doctor profile.
    """
    specialty: Optional[str] = Field(None, description="Updated medical specialty.")
    clinic_address: Optional[str] = Field(None, description="Updated street address.")
    zip_code: Optional[str] = Field(None, description="Updated ZIP code.")
    accepted_insurances: Optional[List[str]] = Field(None, description="Updated list of accepted insurances.")
    photo_url: Optional[str] = Field(None, description="Updated profile photo URL.")
    rating: Optional[float] = Field(None, description="Updated rating.")


class DoctorOut(DoctorBase):
    """
    Doctor response schema nesting user info.
    """
    id: UUID
    user: UserOut

    class Config:
        from_attributes = True


class AppointmentCreate(BaseModel):
    """
    Input schema for reserving a calendar slot.
    """
    doctor_id: UUID = Field(..., description="UUID of the selected doctor.")
    appointment_time: datetime = Field(..., description="Date and time of the desired slot.")
    consult_type: str = Field(..., description="Format: in_person or telehealth.")
    reason_for_visit: str = Field(..., description="Free-text description of patient symptoms.")
    insurance_carrier: Optional[str] = Field(None, description="Name of the patient's insurance provider.")
    insurance_plan: Optional[str] = Field(None, description="Specific plan title.")
    insurance_policy_number: Optional[str] = Field(None, description="Member ID policy number.")


class ClinicalNoteBase(BaseModel):
    """
    Base properties of a clinical SOAP note.
    """
    appointment_id: UUID = Field(..., description="UUID of the associated consultation.")
    raw_transcript: Optional[str] = Field(None, description="Unstructured transcription dialogues.")
    subjective: Optional[str] = Field(None, description="SOAP Subjective section.")
    objective: Optional[str] = Field(None, description="SOAP Objective section.")
    assessment: Optional[str] = Field(None, description="SOAP Assessment section.")
    plan: Optional[str] = Field(None, description="SOAP Plan section.")
    patient_summary: Optional[str] = Field(None, description="Patient lay translation summary.")
    status: str = Field("draft", description="Document lock status (draft, approved).")


class ClinicalNoteCreate(ClinicalNoteBase):
    """
    Input schema to link a clinical note to an appointment.
    """
    pass


class ClinicalNoteUpdate(BaseModel):
    """
    Fields that can be updated on the clinical note.
    """
    raw_transcript: Optional[str] = Field(None, description="Updated transcript.")
    subjective: Optional[str] = Field(None, description="Updated Subjective text.")
    objective: Optional[str] = Field(None, description="Updated Objective text.")
    assessment: Optional[str] = Field(None, description="Updated Assessment text.")
    plan: Optional[str] = Field(None, description="Updated Plan text.")
    patient_summary: Optional[str] = Field(None, description="Updated layman summary.")
    status: Optional[str] = Field(None, description="Update status key.")


class ClinicalNoteOut(ClinicalNoteBase):
    """
    Response schema returning clinical note records.
    """
    id: UUID
    signed_at: Optional[datetime] = Field(None, description="Physician electronic signature timestamp.")

    class Config:
        from_attributes = True


class AppointmentOut(AppointmentCreate):
    """
    Response schema returning booking records.
    """
    id: UUID
    patient_id: UUID = Field(..., description="UUID of the patient booking the slot.")
    status: str = Field(..., description="Booking state: pending, confirmed, completed, cancelled.")
    duration_minutes: int = Field(30, description="Length of the appointment in minutes.")
    clinical_note: Optional[ClinicalNoteOut] = Field(None, description="Linked SOAP clinical note draft if present.")

    class Config:
        from_attributes = True


class ScheduleExceptionBase(BaseModel):
    """
    Properties for calendar blockages/vacations.
    """
    start_time: datetime = Field(..., description="Start of the unavailable interval.")
    end_time: datetime = Field(..., description="End of the unavailable interval.")
    description: Optional[str] = Field(None, description="Reason for the blockage.")


class ScheduleExceptionOut(ScheduleExceptionBase):
    """
    Response schema returning calendar blockages.
    """
    id: UUID
    doctor_id: UUID = Field(..., description="UUID of the doctor owning this exception.")

    class Config:
        from_attributes = True
