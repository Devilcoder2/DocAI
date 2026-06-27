import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
from app.database import SessionLocal
from app.models import Appointment, User, Doctor

logger = logging.getLogger("notifier")

def send_appointment_emails(appointment_id: str):
    """
    Looks up booking meta, formatting confirmation mail alerts to Patient & Doctor.
    Executed inside background threads to prevent web endpoint latency blockages.
    """
    import uuid
    db = SessionLocal()
    try:
        # Fetch appointment details
        app_uuid = uuid.UUID(appointment_id) if isinstance(appointment_id, str) else appointment_id
        appointment = db.query(Appointment).filter(Appointment.id == app_uuid).first()
        if not appointment:
            logger.error(f"Appointment {appointment_id} not found for email dispatch.")
            return

        patient = db.query(User).filter(User.id == appointment.patient_id).first()
        doctor_profile = db.query(Doctor).filter(Doctor.id == appointment.doctor_id).first()
        if not doctor_profile:
            logger.error(f"Doctor profile not found for appointment {appointment_id}.")
            return
        
        doctor_user = db.query(User).filter(User.id == doctor_profile.user_id).first()
        if not patient or not doctor_user:
            logger.error(f"Patient or doctor user account missing for appointment {appointment_id}.")
            return

        # Render Patient Email
        patient_subject = f"Appointment Confirmed - {doctor_user.name}"
        patient_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; padding: 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; bg-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #14b8a6; border-bottom: 2px solid #334155; padding-bottom: 10px;">Consultation Confirmed</h2>
                <p>Dear {patient.name},</p>
                <p>Your appointment has been successfully scheduled and confirmed.</p>
                <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Provider:</strong> {doctor_user.name} ({doctor_profile.specialty})</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> {appointment.appointment_time}</p>
                    <p style="margin: 5px 0;"><strong>Duration:</strong> {appointment.duration_minutes} minutes</p>
                    <p style="margin: 5px 0;"><strong>Format:</strong> {appointment.consult_type.replace('_', ' ').title()}</p>
                    <p style="margin: 5px 0;"><strong>Reason:</strong> {appointment.reason_for_visit}</p>
                </div>
        """
        if appointment.consult_type == "telehealth":
            patient_html += f"""
                <p style="margin: 20px 0 10px 0;"><strong>Virtual Consultation Room Link:</strong></p>
                <p><a href="http://localhost:3000/appointments/{appointment.id}/room" style="background-color: #14b8a6; color: #0f172a; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Join Telehealth Consultation</a></p>
            """
        patient_html += """
                <hr style="border: none; border-top: 1px solid #334155; margin: 25px 0;"/>
                <p style="font-size: 11px; color: #64748b;">Medical AI Protected Session. This message holds confidential clinical details protected under HIPAA safeguards.</p>
            </div>
        </body>
        </html>
        """

        # Render Doctor Email
        doctor_subject = f"New Consultation Confirmed - {patient.name}"
        doctor_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; padding: 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; bg-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #6366f1; border-bottom: 2px solid #334155; padding-bottom: 10px;">New Consultation Booked</h2>
                <p>Dear {doctor_user.name},</p>
                <p>A new consultation has been booked and scheduled with you.</p>
                <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Patient:</strong> {patient.name}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> {patient.email}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> {appointment.appointment_time}</p>
                    <p style="margin: 5px 0;"><strong>Reason:</strong> {appointment.reason_for_visit}</p>
                </div>
                
                <h3 style="color: #cbd5e1; margin-top: 25px;">Patient Medical Vitals & Profile</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
                    <tr style="border-bottom: 1px solid #334155;">
                        <td style="padding: 6px 0; color: #94a3b8;">Age</td>
                        <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">{patient.age if patient.age is not None else '--'} yrs</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #334155;">
                        <td style="padding: 6px 0; color: #94a3b8;">Gender</td>
                        <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">{patient.gender or '--'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #334155;">
                        <td style="padding: 6px 0; color: #94a3b8;">Weight</td>
                        <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">{patient.weight if patient.weight is not None else '--'} kg</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #334155;">
                        <td style="padding: 6px 0; color: #94a3b8;">Height</td>
                        <td style="padding: 6px 0; font-weight: bold; color: #f8fafc;">{patient.height if patient.height is not None else '--'} cm</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #334155;">
                        <td style="padding: 6px 0; color: #94a3b8;">Allergies</td>
                        <td style="padding: 6px 0; font-weight: bold; color: #f43f5e;">{patient.allergies or 'None reported'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #334155;">
                        <td style="padding: 6px 0; color: #94a3b8;">Chronic Conditions</td>
                        <td style="padding: 6px 0; font-weight: bold; color: #fbbf24;">{patient.chronic_illnesses or 'None reported'}</td>
                    </tr>
                </table>
                
                <p style="margin: 25px 0 10px 0;"><strong>Clinical Workspace & Scribe Control:</strong></p>
                <p><a href="http://localhost:3000/doctor/appointments/{appointment.id}/scribe" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Open EHR Scribe Panel</a></p>
                
                <hr style="border: none; border-top: 1px solid #334155; margin: 25px 0;"/>
                <p style="font-size: 11px; color: #64748b;">Medical AI Protected Session. This message holds confidential clinical details protected under HIPAA safeguards.</p>
            </div>
        </body>
        </html>
        """

        # Dispatch emails
        _dispatch_email(patient.email, patient_subject, patient_html)
        _dispatch_email(doctor_user.email, doctor_subject, doctor_html)

    except Exception as e:
        logger.exception(f"Unexpected error in send_appointment_emails: {e}")
    finally:
        db.close()

def _dispatch_email(recipient_email: str, subject: str, html_content: str):
    # If no SMTP configured, log/mock the print and exit gracefully (no crash)
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info(f"[MOCK EMAIL DISPATCH] To: {recipient_email} | Subject: {subject}")
        # Print to console so developers can verify email dispatch details locally
        print(f"\n============================================================\n[MOCK EMAIL DISPATCH]\nTo: {recipient_email}\nSubject: {subject}\nBody: {html_content}\n============================================================\n", flush=True)
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = recipient_email

        msg.attach(MIMEText(html_content, "html"))

        # Connect to SMTP
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        server.ehlo()
        # Start TLS if port is 587
        if settings.SMTP_PORT == 587:
            server.starttls()
            server.ehlo()
        
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, recipient_email, msg.as_string())
        server.quit()
        logger.info(f"Successfully sent email to {recipient_email}")
    except Exception as e:
        logger.error(f"Failed to dispatch email to {recipient_email} via SMTP: {e}")
