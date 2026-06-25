from datetime import date, datetime, time, timedelta
from typing import List, Optional
from uuid import UUID
from fastapi import FastAPI, Depends, HTTPException, Query, Header, status
from sqlalchemy import cast, String
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models import User, Doctor, Appointment, ScheduleException
from app.schemas import DoctorOut, AppointmentOut, AppointmentCreate, ScheduleExceptionOut

app = FastAPI(
    title="Scheduling & Booking Microservice",
    description="Microservice managing doctor directories, calendars, and reservations.",
    version="1.0.0"
)

def get_available_slots(target_date: date, doctor_id: UUID, db: Session) -> List[datetime]:
    """
    Core calendar logic that calculates free slots for a doctor on a target date.
    Extracts base hours (9:00 AM - 5:00 PM), checks existing appointments,
    subtracts exceptions, and prunes slots in the past.

    Inputs:
        target_date (date): The calendar day to inspect.
        doctor_id (UUID): The doctor whose calendar is being checked.
        db (Session): Active database session.

    Outputs:
        List[datetime]: Available 30-minute interval slots.
    """
    # Define start and end of doctor base hours (9:00 to 17:00) on the target date
    start_dt = datetime.combine(target_date, time(9, 0))
    end_dt = datetime.combine(target_date, time(17, 0))
    
    # Query non-cancelled appointments for this doctor on the date
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status != "cancelled",
        Appointment.appointment_time >= start_dt,
        Appointment.appointment_time < end_dt
    ).all()
    booked_times = {a.appointment_time for a in appointments}

    # Query schedule exceptions (leaves/meetings) overlapping this date
    exceptions = db.query(ScheduleException).filter(
        ScheduleException.doctor_id == doctor_id,
        ScheduleException.start_time < end_dt,
        ScheduleException.end_time > start_dt
    ).all()

    available_slots = []
    current_slot = start_dt
    now = datetime.now()  # Compare with local timezone-naive server clock
    
    while current_slot < end_dt:
        # 1. Prune slots that are in the past
        if current_slot > now:
            # 2. Check if the slot is already booked
            if current_slot not in booked_times:
                # 3. Check if the slot falls inside a doctor exception block
                is_exception = False
                for ex in exceptions:
                    if ex.start_time <= current_slot < ex.end_time:
                        is_exception = True
                        break
                
                if not is_exception:
                    available_slots.append(current_slot)
                    
        # Slots are offered in 30-minute intervals
        current_slot += timedelta(minutes=30)
        
    return available_slots


@app.get("/doctors", response_model=List[DoctorOut])
def list_doctors(
    specialty: Optional[str] = Query(None, description="Filter doctors by medical specialty (contains)."),
    zip_code: Optional[str] = Query(None, description="Filter doctors by exact ZIP code match."),
    insurance_carrier: Optional[str] = Query(None, description="Filter doctors by accepted insurance carrier name."),
    db: Session = Depends(get_db)
) -> List[DoctorOut]:
    """
    Searches the doctor directory based on filters.

    Inputs:
        specialty (str, optional): Specialty filter query parameter.
        zip_code (str, optional): Zip code filter query parameter.
        insurance_carrier (str, optional): Insurance carrier name query parameter.
        db (Session): Database session context.

    Outputs:
        List[DoctorOut]: Serialized list of matching doctor profiles.
    """
    query = db.query(Doctor).join(User)
    
    if specialty:
        query = query.filter(Doctor.specialty.ilike(f"%{specialty}%"))
    if zip_code:
        query = query.filter(Doctor.zip_code == zip_code)
    if insurance_carrier:
        # Check if the carrier is contained in the accepted_insurances JSON list
        # Using a raw string comparison in SQLite/Postgres for portability
        query = query.filter(cast(Doctor.accepted_insurances, String).ilike(f"%{insurance_carrier}%"))

    return query.all()


@app.get("/doctors/{id}/availability", response_model=List[datetime])
def get_availability(
    id: UUID,
    date_val: date = Query(..., alias="date", description="The date to check availability (YYYY-MM-DD)."),
    db: Session = Depends(get_db)
) -> List[datetime]:
    """
    Fetches the availability grid list for a specific doctor.

    Inputs:
        id (UUID): Doctor ID path parameter.
        date_val (date): Target calendar date query parameter.
        db (Session): Database session context.

    Outputs:
        List[datetime]: Open datetimes.
    """
    doctor = db.query(Doctor).filter(Doctor.id == id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found.")
        
    return get_available_slots(date_val, id, db)


@app.post("/appointments", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate,
    x_user_id: str = Header(..., alias="X-User-Id", description="Authenticated Patient UUID forwarded by Gateway."),
    db: Session = Depends(get_db)
) -> AppointmentOut:
    """
    Creates a new calendar reservation for the authenticated patient.
    Performs concurrency double-booking validations.

    Inputs:
        payload (AppointmentCreate): Booking details (time, consult type, symptoms).
        x_user_id (str): User ID of the patient making the booking.
        db (Session): Database session context.

    Outputs:
        AppointmentOut: Created appointment database record.
    """
    try:
        patient_uuid = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid X-User-Id header format.")

    # 1. Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == payload.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found.")

    # 2. Verify that slot time falls on 30-minute intervals
    if payload.appointment_time.minute % 30 != 0 or payload.appointment_time.second != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Appointments must reside on 30-minute interval boundaries."
        )

    # 3. Check availability dynamically
    target_date = payload.appointment_time.date()
    available_slots = get_available_slots(target_date, payload.doctor_id, db)
    
    if payload.appointment_time not in available_slots:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The requested appointment slot is not available or has already passed."
        )

    # 4. Insert appointment record
    new_appointment = Appointment(
        doctor_id=payload.doctor_id,
        patient_id=patient_uuid,
        appointment_time=payload.appointment_time,
        duration_minutes=30,
        status="confirmed",
        consult_type=payload.consult_type,
        reason_for_visit=payload.reason_for_visit,
        insurance_carrier=payload.insurance_carrier,
        insurance_plan=payload.insurance_plan,
        insurance_policy_number=payload.insurance_policy_number
    )

    db.add(new_appointment)
    try:
        db.commit()
        db.refresh(new_appointment)
        return new_appointment
    except IntegrityError:
        db.rollback()
        # Catches race conditions triggered if another request slipped through
        # and violated the uq_active_appointment unique index constraint.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Slot allocation race condition: The selected time has just been reserved by another patient."
        )


@app.get("/appointments/{id}", response_model=AppointmentOut)
def get_appointment(id: UUID, db: Session = Depends(get_db)) -> AppointmentOut:
    """
    Fetches details of a specific appointment.

    Inputs:
        id (UUID): Appointment ID path parameter.
        db (Session): Database session context.

    Outputs:
        AppointmentOut: Appointment detail payload.
    """
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment record not found.")
    return appointment
