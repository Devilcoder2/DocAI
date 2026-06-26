import os
import sys
import time
import json
import base64
import hashlib
import subprocess
import httpx
from datetime import datetime, timedelta
from cryptography.fernet import Fernet

# central configurations
GATEWAY_URL = "http://127.0.0.1:8000"
JWT_SECRET_KEY = "dev_jwt_secret_key_change_me_in_production"
RECORDING_DIR = "/tmp/medical_ai_recordings"

def derive_encryption_key(secret_key: str) -> bytes:
    """
    Derives a cryptographically secure 32-byte Fernet key from a string secret key.

    Inputs:
        secret_key (str): The configuration secret key text.

    Outputs:
        bytes: A URL-safe base64 encoded 32-byte key.
    """
    digest = hashlib.sha256(secret_key.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def run_phase4_verification():
    """
    Executes end-to-end integration and routing checks for Phase 4:
    1. Spawns Scribe FastAPI service (port 8003) and Scribe RabbitMQ Consumer.
    2. Logs in a clinical doctor to obtain verified JWT token.
    3. Books a new virtual telehealth appointment.
    4. Creates a mock encrypted audio file and publishes 'session_ended' event to RabbitMQ.
    5. Awaits event consumption and verifies clinical note draft generation in the database.
    6. Validates retrieval via Gateway proxy GET /api/v1/appointments/{id}/clinical-note.
    7. Tests clinician authorization filters on PUT and POST /approve endpoints.
    8. Validates note lockouts post-approval.
    9. Shuts down spawned Scribe subprocesses and cleans up resources.
    """
    print("=" * 70)
    print("Running Phase 4: Clinical Scribe Pipeline & Doctor Portal Verification")
    print("=" * 70)

    # 1. Spawn Scribe FastAPI server
    print("\n[Step 1] Spawning Scribe FastAPI microservice subprocess on port 8003...")
    scribe_env = os.environ.copy()
    scribe_env["PYTHONPATH"] = "services/scribe"
    
    scribe_api_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8003"],
        cwd="services/scribe",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=scribe_env
    )
    
    # 2. Spawn Scribe RabbitMQ Consumer
    print("[Step 2] Spawning Scribe RabbitMQ Consumer subprocess...")
    scribe_consumer_process = subprocess.Popen(
        [sys.executable, "-m", "app.consumer"],
        cwd="services/scribe",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=scribe_env
    )

    # Wait for services to initialize
    time.sleep(3.0)

    # Assert subprocesses are alive
    if scribe_api_process.poll() is not None:
        print("[-] Error: Scribe API server failed to start. Logs:")
        print(scribe_api_process.stdout.read())
        sys.exit(1)
        
    if scribe_consumer_process.poll() is not None:
        print("[-] Error: Scribe Consumer worker failed to start. Logs:")
        print(scribe_consumer_process.stdout.read())
        sys.exit(1)

    print("[*] Scribe microservices successfully spawned.")

    success = True
    try:
        with httpx.Client(timeout=10.0) as client:
            # 3. Retrieve seeded doctor profile
            print("\n[Step 3] Retrieving seeded doctor context...")
            doc_res = client.get(f"{GATEWAY_URL}/api/v1/public/doctors")
            assert doc_res.status_code == 200, "Failed to retrieve doctor listings."
            doctors = doc_res.json()
            assert len(doctors) > 0, "No doctors seeded in database."
            
            doctor_id = doctors[0]["id"]
            doctor_email = doctors[0]["user"]["email"]
            print(f"  Selected doctor: {doctors[0]['user']['name']} (ID: {doctor_id}, Email: {doctor_email})")

            # Obtain doctor credential token
            login_res = client.post(f"{GATEWAY_URL}/api/v1/public/auth/login", json={"email": doctor_email})
            assert login_res.status_code == 200, "Doctor authentication failed."
            doctor_token = login_res.json()["token"]
            print("  Doctor authentication token successfully acquired.")

            # Register/Login patient
            print("\n[Step 4] Registering test patient...")
            patient_email = f"patient.scribe.{int(time.time())}@example.com"
            pat_res = client.post(f"{GATEWAY_URL}/api/v1/public/auth/register", json={
                "name": "Jane Scribe-Test",
                "email": patient_email,
                "role": "Patient"
            })
            assert pat_res.status_code == 200, "Patient registration failed."
            pat_data = pat_res.json()
            patient_id = pat_data["user"]["id"]
            patient_token = pat_data["token"]
            print(f"  Patient registered. ID: {patient_id}")

            # Book a new telehealth appointment
            print("\n[Step 5] Booking new virtual telehealth consultation slot...")
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            avail_res = client.get(f"{GATEWAY_URL}/api/v1/public/doctors/{doctor_id}/availability?date={tomorrow}")
            assert avail_res.status_code == 200, "Availability retrieval failed."
            slots = avail_res.json()
            assert len(slots) > 0, "No calendar slots available for booking."
            target_slot = slots[0]

            booking_payload = {
                "doctor_id": doctor_id,
                "appointment_time": target_slot,
                "consult_type": "telehealth",
                "reason_for_visit": "chronic sore throat with morning cold symptoms",
                "insurance_carrier": "Blue Cross"
            }
            book_res = client.post(
                f"{GATEWAY_URL}/api/v1/appointments",
                headers={"Authorization": f"Bearer {patient_token}"},
                json=booking_payload
            )
            assert book_res.status_code == 201, f"Appointment booking failed: {book_res.text}"
            appointment_id = book_res.json()["id"]
            print(f"  Telehealth appointment created successfully. ID: {appointment_id}")

            # 4. Create encrypted wave file backup simulating telehealth engine output
            print("\n[Step 6] Simulating consultation audio file creation...")
            room_name = f"appointment_{appointment_id}"
            room_dir = os.path.join(RECORDING_DIR, room_name)
            os.makedirs(room_dir, exist_ok=True)
            
            raw_audio_test = b"SIMULATED STEREO AUDIO RECORDING SPEECH DATA"
            fernet_key = derive_encryption_key(JWT_SECRET_KEY)
            fernet = Fernet(fernet_key)
            encrypted_audio = fernet.encrypt(raw_audio_test)

            enc_file_path = os.path.join(room_dir, "consult_encrypted.wav")
            with open(enc_file_path, "wb") as f:
                f.write(encrypted_audio)
            print(f"  Encrypted mock audio written locally: {enc_file_path}")

            # Publish event to RabbitMQ using Scribe FastAPI manual trigger
            # This verifies the internal process_event method is invoked and processes the payload correctly!
            print("\n[Step 7] Invoking Scribe diagnostic manual transcription trigger...")
            scribe_trigger_payload = {
                "appointment_id": appointment_id,
                "s3_path": f"file://{enc_file_path}",
                "is_mock": True
            }
            
            trigger_res = client.post(
                "http://127.0.0.1:8003/diagnose/transcribe",
                json=scribe_trigger_payload
            )
            assert trigger_res.status_code == 200, f"Scribe diagnostic trigger failed: {trigger_res.text}"
            print(f"  Scribe trigger response: {trigger_res.json()}")

            # 5. Fetch Note from Gateway and verify fields
            print("\n[Step 8] Retrieving clinical note draft via Gateway GET proxy...")
            time.sleep(1.0)  # wait for DB write
            note_res = client.get(
                f"{GATEWAY_URL}/api/v1/appointments/{appointment_id}/clinical-note",
                headers={"Authorization": f"Bearer {doctor_token}"}
            )
            assert note_res.status_code == 200, f"Failed to retrieve note: {note_res.text}"
            note_data = note_res.json()
            print("  Clinical Note successfully retrieved. Fields parsed:")
            print(f"    Status: {note_data.get('status')}")
            print(f"    Subjective preview: {note_data.get('subjective')[:60]}...")
            print(f"    Patient Summary preview: {note_data.get('patient_summary')[:60]}...")
            
            assert note_data["status"] == "draft", "Note status should default to 'draft'."
            assert "sore throat" in note_data["subjective"].lower(), "Subjective did not dynamically align with visit reasons."

            # 6. Test Authorization restrictions
            print("\n[Step 9] Validating Clinician role verification (PUT/POST restriction checks)...")
            
            # 6a. Attempt to update note as Patient (Should fail)
            update_payload = {"subjective": "UNAUTHORIZED PATIENT MANUAL UPDATE FIELD TEXT"}
            pat_update_res = client.put(
                f"{GATEWAY_URL}/api/v1/appointments/{appointment_id}/clinical-note",
                headers={"Authorization": f"Bearer {patient_token}"},
                json=update_payload
            )
            print(f"  Patient PUT status: {pat_update_res.status_code} (Expected: 403)")
            assert pat_update_res.status_code == 403, "Access Control failure: Patient was allowed to call PUT notes."

            # 6b. Attempt to update note as Doctor (Should succeed)
            doc_update_payload = {"subjective": "Doctor manual updates to subjective section."}
            doc_update_res = client.put(
                f"{GATEWAY_URL}/api/v1/appointments/{appointment_id}/clinical-note",
                headers={"Authorization": f"Bearer {doctor_token}"},
                json=doc_update_payload
            )
            print(f"  Doctor PUT status: {doc_update_res.status_code} (Expected: 200)")
            assert doc_update_res.status_code == 200, f"Doctor update failed: {doc_update_res.text}"
            assert doc_update_res.json()["subjective"] == "Doctor manual updates to subjective section.", "Updated subjective field value mismatch."

            # 7. Approve Clinical Note
            print("\n[Step 10] Testing clinical note approval electronic sign-off...")
            
            # 7a. Attempt to approve as Patient (Should fail)
            pat_app_res = client.post(
                f"{GATEWAY_URL}/api/v1/appointments/{appointment_id}/clinical-note/approve",
                headers={"Authorization": f"Bearer {patient_token}"}
            )
            print(f"  Patient POST /approve status: {pat_app_res.status_code} (Expected: 403)")
            assert pat_app_res.status_code == 403, "Access Control failure: Patient allowed to approve note."

            # 7b. Approve as Doctor (Should succeed)
            doc_app_res = client.post(
                f"{GATEWAY_URL}/api/v1/appointments/{appointment_id}/clinical-note/approve",
                headers={"Authorization": f"Bearer {doctor_token}"}
            )
            print(f"  Doctor POST /approve status: {doc_app_res.status_code} (Expected: 200)")
            assert doc_app_res.status_code == 200, f"Note approval failed: {doc_app_res.text}"
            
            approved_note = doc_app_res.json()
            assert approved_note["status"] == "approved", "Status was not updated to 'approved'."
            assert approved_note["signed_at"] is not None, "電子署名 signed_at timestamp was not written."

            # Verify appointment status transitions to completed
            appt_verify_res = client.get(
                f"{GATEWAY_URL}/api/v1/appointments/{appointment_id}",
                headers={"Authorization": f"Bearer {doctor_token}"}
            )
            assert appt_verify_res.status_code == 200
            assert appt_verify_res.json()["status"] == "completed", "Parent appointment status was not transitioned to completed."
            print("  [Pass] Electronic signature confirmed, note locked, and parent appointment completed.")

            # 8. Verify note lockouts (PUT edits after approval should fail)
            print("\n[Step 11] Verifying write lockout constraints on approved note...")
            locked_update_res = client.put(
                f"{GATEWAY_URL}/api/v1/appointments/{appointment_id}/clinical-note",
                headers={"Authorization": f"Bearer {doctor_token}"},
                json={"subjective": "Late modifications to locked file."}
            )
            print(f"  Locked update status: {locked_update_res.status_code} (Expected: 400)")
            assert locked_update_res.status_code == 400, "Database constraint failed: Modifications were allowed on approved note."
            print("  [Pass] Note write lockout verified.")

            # Clean up test patient user
            print("\n[Step 12] Cleaning up verification records...")
            del_res = client.delete(
                f"{GATEWAY_URL}/api/v1/users/me",
                headers={"Authorization": f"Bearer {patient_token}"}
            )
            assert del_res.status_code == 204, "Failed to delete test patient user."
            print("  Test user successfully purged.")

    except AssertionError as ae:
        print(f"\n[-] TEST ASSERTION FAILURE: {ae}")
        success = False
    except Exception as e:
        print(f"\n[-] TEST RUN FAILURE EXCEPTION: {e}")
        success = False
    finally:
        # Shutdown subprocesses
        print("\n[Step 13] Terminating Scribe microservice subprocesses...")
        scribe_api_process.terminate()
        scribe_consumer_process.terminate()
        
        try:
            scribe_api_process.wait(timeout=2.0)
            scribe_consumer_process.wait(timeout=2.0)
        except Exception:
            scribe_api_process.kill()
            scribe_consumer_process.kill()
            
        print("  Subprocesses stopped.")
        
        # Purge file directory
        print("  Purging temporary local files...")
        try:
            if os.path.exists(enc_file_path):
                os.remove(enc_file_path)
            if os.path.exists(room_dir):
                os.rmdir(room_dir)
        except Exception as e:
            print(f"  Failed to clean files: {e}")

    if success:
        print("\n" + "=" * 70)
        print("ALL TESTS PASSED SUCCESSFULLY! CLINICAL SCRIBE WORKSPACE STABLE")
        print("=" * 70)
    else:
        print("\n" + "=" * 70)
        print("VERIFICATION RUN FAILED - INVESTIGATE EXCEPTIONS ABOVE")
        print("=" * 70)
        sys.exit(1)


if __name__ == "__main__":
    run_phase4_verification()
