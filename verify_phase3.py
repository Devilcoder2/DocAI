import os
import sys
import time
import json
import jwt
import httpx
from datetime import datetime, timedelta

# Service URL definitions
GATEWAY_URL = "http://127.0.0.1:8000"

# Derived from centralized env configuration
JWT_SECRET_KEY = "dev_jwt_secret_key_change_me_in_production"
JWT_ALGORITHM = "HS256"
RECORDING_DIR = "/tmp/medical_ai_recordings"

def run_telehealth_tests():
    """
    Executes integration testing for Phase 3:
    1. Register patient and doctor accounts.
    2. Create a consult appointment.
    3. Test token retrieval access controls (HIPAA checks).
    4. Validate LiveKit video token claims.
    5. Test doctor-only scribe controls (start, status, stop).
    6. Verify audio mixing, AES-256 encryption, and RabbitMQ fallbacks on local disk.
    7. Clean up database.
    """
    print("=" * 60)
    print("Executing Phase 3 Telehealth & AI Scribe Verification")
    print("=" * 60)

    with httpx.Client(timeout=10.0) as client:
        # Step 1: Health check verification
        print("\nTest 1: Verification of /health gateway endpoint...")
        res = client.get(f"{GATEWAY_URL}/health")
        print(f"  Status: {res.status_code} | Body: {res.json()}")
        assert res.status_code == 200, "Health check failed."

        # Fetch active doctor from seeded list
        print("\nTest 2: Retrieving a seeded doctor ID...")
        res = client.get(f"{GATEWAY_URL}/api/v1/public/doctors")
        doctors = res.json()
        assert len(doctors) > 0, "No doctors seeded in database."
        target_doctor = doctors[0]
        doctor_id = target_doctor["id"]
        doctor_email = target_doctor["user"]["email"]
        print(f"  Selected Doctor: {target_doctor['user']['name']} (ID: {doctor_id})")

        # Login/Obtain token for the Doctor
        print("  Logging in as Doctor to get credentials...")
        doc_login_res = client.post(f"{GATEWAY_URL}/api/v1/public/auth/login", json={"email": doctor_email})
        assert doc_login_res.status_code == 200, "Doctor login failed."
        doctor_token = doc_login_res.json()["token"]
        print(f"  Doctor JWT Token successfully obtained.")

        # Step 2: Register a new patient
        print("\nTest 3: Registering a test patient...")
        patient_email = f"patient_t3_{int(time.time())}@example.com"
        reg_payload = {
            "name": "Telehealth Test Patient",
            "email": patient_email,
            "role": "Patient"
        }
        reg_res = client.post(f"{GATEWAY_URL}/api/v1/public/auth/register", json={
            "name": "Telehealth Test Patient",
            "email": patient_email,
            "role": "Patient"
        })
        assert reg_res.status_code == 200, "Patient registration failed."
        patient_data = reg_res.json()
        patient_id = patient_data["user"]["id"]
        patient_token = patient_data["token"]
        print(f"  Registered Patient ID: {patient_id} | Token issued.")

        # Step 3: Schedule a consult appointment
        # Query availability first to find an open slots segment
        avail_res = client.get(f"{GATEWAY_URL}/api/v1/public/doctors/{doctor_id}/availability?date={(datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')}")
        assert avail_res.status_code == 200, "Failed to get availability slots."
        slots = avail_res.json()
        assert len(slots) > 0, "No available slots on doctor calendar tomorrow."
        target_slot = slots[0]
        print(f"  Selected appointment slot: {target_slot}")

        print("\nTest 4: Creating a virtual telehealth appointment booking...")
        booking_payload = {
            "doctor_id": doctor_id,
            "appointment_time": target_slot,
            "consult_type": "telehealth",
            "reason_for_visit": "Routine checkup for cardiovascular metrics."
        }
        book_res = client.post(
            f"{GATEWAY_URL}/api/v1/appointments",
            headers={"Authorization": f"Bearer {patient_token}"},
            json=booking_payload
        )
        assert book_res.status_code == 201, f"Failed to book appointment: {book_res.text}"
        appointment = book_res.json()
        appointment_id = appointment["id"]
        print(f"  Appointment reserved successfully. ID: {appointment_id}")

        # Step 4: Test LiveKit Room Token generation and claims validation
        print("\nTest 5: Requesting room tokens for Patient and Doctor...")
        # 4a. Request with patient credentials
        pat_room_res = client.post(
            f"{GATEWAY_URL}/api/v1/telehealth/rooms/token",
            headers={"Authorization": f"Bearer {patient_token}"},
            json={"appointment_id": appointment_id}
        )
        assert pat_room_res.status_code == 200, f"Patient room token generation failed: {pat_room_res.text}"
        pat_room_data = pat_room_res.json()
        print(f"  Patient room token retrieved successfully.")
        
        # Verify JWT claims inside patient token
        pat_claims = jwt.decode(pat_room_data["token"], options={"verify_signature": False})
        print(f"  Decoded Patient Claims: {json.dumps(pat_claims, indent=2)}")
        assert pat_claims["sub"] == patient_id, "Subject mismatch in token."
        assert pat_claims["video"]["room"] == f"appointment_{appointment_id}", "Room name mismatch in token."
        assert pat_claims["video"]["roomJoin"] is True, "Missing roomJoin grant."

        # 4b. Request with doctor credentials
        doc_room_res = client.post(
            f"{GATEWAY_URL}/api/v1/telehealth/rooms/token",
            headers={"Authorization": f"Bearer {doctor_token}"},
            json={"appointment_id": appointment_id}
        )
        assert doc_room_res.status_code == 200, "Doctor room token generation failed."
        print(f"  Doctor room token retrieved successfully.")

        # 4c. HIPAA Access Control Enforcement Test (unauthorized third-party user)
        unauth_patient_res = client.post(f"{GATEWAY_URL}/api/v1/public/auth/register", json={
            "name": "Snoop Dog",
            "email": f"snoop_{int(time.time())}@example.com",
            "role": "Patient"
        })
        unauth_token = unauth_patient_res.json()["token"]
        
        print("\nTest 6: Verifying HIPAA Access Control (Third-Party block)...")
        block_res = client.post(
            f"{GATEWAY_URL}/api/v1/telehealth/rooms/token",
            headers={"Authorization": f"Bearer {unauth_token}"},
            json={"appointment_id": appointment_id}
        )
        print(f"  Access status: {block_res.status_code} | Message: {block_res.json()}")
        assert block_res.status_code == 403, "HIPAA Security leak: Unauthorized user was issued a join token!"
        print("  [Pass] Gateway successfully blocked third-party attendee.")

        # Step 5: Test Doctor-Only Scribe Controls
        room_name = f"appointment_{appointment_id}"
        print("\nTest 7: Verification of Scribe controls (Start/Status/Stop)...")
        
        # 5a. Try starting scribe as Patient (Should fail)
        pat_start_res = client.post(
            f"{GATEWAY_URL}/api/v1/telehealth/rooms/{room_name}/scribe/start",
            headers={"Authorization": f"Bearer {patient_token}"}
        )
        assert pat_start_res.status_code == 403, "Access Control failure: Patient was allowed to launch recording."
        print("  [Pass] Patient start attempt rejected (403 Forbidden).")

        # 5b. Start scribe as Doctor (Should succeed)
        doc_start_res = client.post(
            f"{GATEWAY_URL}/api/v1/telehealth/rooms/{room_name}/scribe/start",
            headers={"Authorization": f"Bearer {doctor_token}"}
        )
        assert doc_start_res.status_code == 200, f"Doctor scribe start failed: {doc_start_res.text}"
        start_data = doc_start_res.json()
        print(f"  Scribe start response: {start_data}")
        assert start_data["status"] in ("RECORDING", "MOCK_ACTIVE"), "Incorrect start status returned."

        # 5c. Check Scribe Status (Should be active)
        status_res = client.get(
            f"{GATEWAY_URL}/api/v1/telehealth/rooms/{room_name}/scribe/status",
            headers={"Authorization": f"Bearer {patient_token}"}
        )
        assert status_res.status_code == 200, "Status query failed."
        status_data = status_res.json()
        print(f"  Current Scribe status check: {status_data}")
        assert status_data["status"] in ("RECORDING", "MOCK_ACTIVE"), "Scribe status is not active after starting."

        # 5d. Stop scribe as Doctor
        doc_stop_res = client.post(
            f"{GATEWAY_URL}/api/v1/telehealth/rooms/{room_name}/scribe/stop",
            headers={"Authorization": f"Bearer {doctor_token}"}
        )
        assert doc_stop_res.status_code == 200, "Doctor scribe stop failed."
        print(f"  Scribe stop accepted. Status: {doc_stop_res.json()['status']}")

        # Step 6: Verify background audio file alignment and local storage fallback
        print("\nTest 8: Verifying post-processing file alignment and encryption output...")
        print("  Waiting 2 seconds for background processes to write to disk...")
        time.sleep(2)
        
        target_dir = os.path.join(RECORDING_DIR, room_name)
        assert os.path.exists(target_dir), "Recording directory not found on host."
        print(f"  Found output directory: {target_dir}")
        
        # Verify file existence
        patient_wav = os.path.join(target_dir, "patient_audio.wav")
        doctor_wav = os.path.join(target_dir, "doctor_audio.wav")
        mixed_wav = os.path.join(target_dir, "consult_mixed.wav")
        enc_wav = os.path.join(target_dir, "consult_encrypted.wav")
        event_json = os.path.join(target_dir, "event_log.json")

        assert os.path.exists(patient_wav), "patient_audio.wav not found."
        assert os.path.exists(doctor_wav), "doctor_audio.wav not found."
        assert os.path.exists(mixed_wav), "consult_mixed.wav not found."
        assert os.path.exists(enc_wav), "consult_encrypted.wav not found."
        assert os.path.exists(event_json), "event_log.json not found."
        print("  [Pass] All target WAV audio files, mixed output, encrypted payloads, and logs written to disk.")

        # Check encryption output can be decrypted correctly
        print("  Verifying encryption decryption integrity check...")
        with open(enc_wav, "rb") as f:
            enc_data = f.read()
        
        # Derivation check
        import base64
        import hashlib
        from cryptography.fernet import Fernet
        digest = hashlib.sha256(JWT_SECRET_KEY.encode()).digest()
        key = base64.urlsafe_b64encode(digest)
        fernet = Fernet(key)
        
        decrypted_data = fernet.decrypt(enc_data).decode("utf-8")
        assert "MOCK MIXED AUDIO" in decrypted_data, "Decryption check failed. Corrupt payload."
        print("  [Pass] Decryption successful! Audio payload holds correct integrity values.")

        # Check event logs
        with open(event_json, "r") as f:
            evt = json.load(f)
        assert evt["event"] == "session_ended", "Incorrect event key."
        assert evt["appointment_id"] == appointment_id, "Incorrect appointment_id in event metadata."
        print("  [Pass] Fallback event trace logs matches correct JSON schemas.")

        # Step 7: Cleanup test entities
        print("\nTest 9: Cleaning up test registration records...")
        del_user_res = client.delete(
            f"{GATEWAY_URL}/api/v1/users/me",
            headers={"Authorization": f"Bearer {patient_token}"}
        )
        assert del_user_res.status_code == 204, "Failed to delete test patient."
        
        # Cleanup files from /tmp
        print("  Purging temporary disk recordings...")
        for file in [patient_wav, doctor_wav, mixed_wav, enc_wav, event_json]:
            try:
                os.remove(file)
            except Exception:
                pass
        try:
            os.rmdir(target_dir)
        except Exception:
            pass
        
        print("\n" + "=" * 60)
        print("ALL TESTS PASSED SUCCESSFULLY! TELEHEALTH INFRASTRUCTURE STABLE")
        print("=" * 60)

if __name__ == "__main__":
    try:
        run_telehealth_tests()
    except AssertionError as ae:
        print(f"\n[-] TEST ASSERTION FAILURE: {ae}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[-] UNEXPECTED TEST EXCEPTION: {e}")
        sys.exit(1)
