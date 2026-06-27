import httpx
import sys
from datetime import datetime, timedelta

# Gateway service connection URL
GATEWAY_URL = "http://127.0.0.1:8000"

def run_integration_tests():
    """
    Executes automated integration verification testing Gateway routing, Auth simulation,
    Profile CRUD operations, and slot bookings.
    """
    print("=" * 60)
    print("Executing Phase 2 Sub-Phase 2.2 Gateway & Microservice Verification")
    print("=" * 60)

    with httpx.Client(timeout=10.0) as client:
        # 1. Health check verification
        print("\nTest 1: Verification of /health endpoint...")
        res = client.get(f"{GATEWAY_URL}/health")
        print(f"  Status: {res.status_code} | Body: {res.json()}")
        assert res.status_code == 200, "Health check failed."

        # 2. Public Provider Discovery Search
        print("\nTest 2: GET /api/v1/public/doctors (Public Search)...")
        res = client.get(f"{GATEWAY_URL}/api/v1/public/doctors")
        print(f"  Status: {res.status_code}")
        doctors = res.json()
        print(f"  Found {len(doctors)} doctors in the directory.")
        assert res.status_code == 200, "Doctors list lookup failed."
        assert len(doctors) > 0, "No seeded doctors found. Run seed script first."
        target_doctor = doctors[0]
        doctor_id = target_doctor["id"]
        print(f"  Selected Doctor: {target_doctor['user']['name']} (ID: {doctor_id})")

        # 3. Public Doctor Availability check
        print("\nTest 3: GET /api/v1/public/doctors/{id}/availability...")
        today_date = datetime.now().strftime("%Y-%m-%d")
        res = client.get(f"{GATEWAY_URL}/api/v1/public/doctors/{doctor_id}/availability?date={today_date}")
        print(f"  Status: {res.status_code}")
        slots = res.json()
        print(f"  Found {len(slots)} available slots for date {today_date}.")
        assert res.status_code == 200, "Availability check failed."

        # 4. Simulation Guest Patient Registration
        print("\nTest 4: POST /api/v1/public/auth/register (Guest Registration)...")
        test_email = f"test_pat_{int(datetime.now().timestamp())}@example.com"
        reg_payload = {
            "name": "Integration Test Patient",
            "email": test_email,
            "role": "Patient"
        }
        res = client.post(f"{GATEWAY_URL}/api/v1/public/auth/register", json=reg_payload)
        print(f"  Status: {res.status_code}")
        reg_data = res.json()
        assert res.status_code == 200, "Registration failed."
        token = reg_data["token"]
        patient = reg_data["user"]
        patient_id = patient["id"]
        print(f"  Registered User: {patient['name']} | ID: {patient_id}")
        print(f"  Issued JWT Token: {token[:20]}...{token[-20:]}")

        # 5. Simulation Patient Login
        print("\nTest 5: POST /api/v1/public/auth/login (User Login Verification)...")
        login_payload = { "email": test_email }
        res = client.post(f"{GATEWAY_URL}/api/v1/public/auth/login", json=login_payload)
        print(f"  Status: {res.status_code}")
        login_data = res.json()
        assert res.status_code == 200, "Login failed."
        assert login_data["token"] is not None, "Failed to issue token."
        
        # Configure request headers with Bearer token
        headers = { "Authorization": f"Bearer {token}" }

        # 6. Protected User Profile Read (GET /users/me)
        print("\nTest 6: GET /api/v1/users/me (Read User Profile)...")
        res = client.get(f"{GATEWAY_URL}/api/v1/users/me", headers=headers)
        print(f"  Status: {res.status_code} | Body: {res.json()}")
        assert res.status_code == 200, "Failed to retrieve self profile."
        assert res.json()["email"].lower() == test_email.lower(), "Incorrect email returned."

        # 7. Protected User Profile Update (PUT /users/me)
        print("\nTest 7: PUT /api/v1/users/me (Update User Profile)...")
        res = client.put(f"{GATEWAY_URL}/api/v1/users/me", headers=headers, json={"name": "Updated Test Patient"})
        print(f"  Status: {res.status_code} | Body: {res.json()}")
        assert res.status_code == 200, "Failed to update profile."
        assert res.json()["name"] == "Updated Test Patient", "Updated name did not persist."

        # 8. Fetch detailed doctor public profile
        print("\nTest 8: GET /api/v1/public/doctors/{id} (Public Doctor Profile Lookup)...")
        res = client.get(f"{GATEWAY_URL}/api/v1/public/doctors/{doctor_id}")
        print(f"  Status: {res.status_code} | Doctor: {res.json()['user']['name']} ({res.json()['specialty']})")
        assert res.status_code == 200, "Doctor profile fetch failed."

        # 9. Appointment Booking Checkout
        if len(slots) == 0:
            print("\nSkipping booking verification: No slots remaining on doctor schedule today.")
            return

        booking_slot = slots[0]
        print(f"\nTest 9: POST /api/v1/appointments (Booking Appointment slot: {booking_slot})...")
        booking_payload = {
            "doctor_id": doctor_id,
            "appointment_time": booking_slot,
            "consult_type": "telehealth",
            "reason_for_visit": "Marketplace Integration Verification."
        }
        res = client.post(f"{GATEWAY_URL}/api/v1/appointments", headers=headers, json=booking_payload)
        print(f"  Status: {res.status_code}")
        booking = res.json()
        assert res.status_code == 201, f"Booking appointment failed: {res.text}"
        appt_id = booking["id"]
        print(f"  Created Appointment ID: {appt_id}")

        # 10. Concurrency double-booking blocking check
        print("\nTest 10: POST /api/v1/appointments (Double-Booking Conflict)...")
        # Try to book the same slot time using a different token/user or same user (which should fail)
        res_conflict = client.post(f"{GATEWAY_URL}/api/v1/appointments", headers=headers, json=booking_payload)
        print(f"  Status: {res_conflict.status_code} | Body: {res_conflict.json()}")
        # Check if index index constraint blocked booking
        assert res_conflict.status_code == 409, "Double booking was not blocked by database unique index."
        print("  PASS: Double booking successfully blocked with conflict error (409).")

        # 11. Profile deletion (DELETE /users/me) - Cleanup
        print("\nTest 11: DELETE /api/v1/users/me (Delete Patient Account / Cleanup)...")
        res = client.delete(f"{GATEWAY_URL}/api/v1/users/me", headers=headers)
        print(f"  Status: {res.status_code}")
        assert res.status_code == 204 or res.status_code == 200, "Account cleanup failed."
        print("  PASS: Cleaned up test user record.")

        # Double check user deletion cascaded or blocks authentication
        res_check = client.get(f"{GATEWAY_URL}/api/v1/users/me", headers=headers)
        print(f"  Verify account query post-deletion Status: {res_check.status_code}")
        assert res_check.status_code == 404, "User account was not completely deleted."

        print("\n" + "=" * 60)
        print("VERIFICATION COMPLETED SUCCESSFULLY - ALL TESTS PASSED")
        print("=" * 60)

if __name__ == "__main__":
    try:
        run_integration_tests()
    except AssertionError as ae:
        print(f"\nTEST FAIL: {str(ae)}")
        sys.exit(1)
    except Exception as e:
        print(f"\nUNEXPECTED ERROR: {str(e)}")
        sys.exit(1)
