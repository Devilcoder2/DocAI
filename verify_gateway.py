import os
import sys
import time
import subprocess
import json
import jwt
import httpx

# Mute local stdout logs of the subprocess to inspect only audit outputs
print("=" * 60)
print("Medical AI Platform API Gateway Verification Script")
print("=" * 60)

# Load configuration parameters directly
JWT_SECRET_KEY = "dev_jwt_secret_key_change_me_in_production"
JWT_ALGORITHM = "HS256"
SERVER_URL = "http://127.0.0.1:8000"

print("Step 1: Check if Gateway server is already running...")
external_server = False
try:
    with httpx.Client(timeout=2.0) as client:
        res = client.get(f"{SERVER_URL}/health")
        if res.status_code == 200 and res.json().get("status") == "healthy":
            external_server = True
            print("  Pre-existing Gateway instance found at http://127.0.0.1:8000.")
except Exception:
    pass

process = None
if not external_server:
    print("Step 1b: Spawning uvicorn API Gateway server subprocess...")
    # Launch uvicorn server in a separate process
    env = os.environ.copy()
    env["PYTHONPATH"] = "gateway"  # Ensure it can resolve App from gateway directory

    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd="gateway",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=env
    )

    # Wait for server to bind and start accepting requests
    time.sleep(2.0)

    # Verify if server crashed on launch
    if process.poll() is not None:
        print("Error: Gateway server failed to start. Subprocess output:")
        print(process.stdout.read())
        sys.exit(1)

    print("Gateway server successfully launched. Ready for requests.")
else:
    print("Running tests against the pre-existing Gateway instance.")
print("-" * 60)

success = True

try:
    with httpx.Client(timeout=5.0) as client:
        # Test 1: Health check endpoint (Public)
        print("Test 1: GET /health (Unprotected Health Check)")
        res1 = client.get(f"{SERVER_URL}/health")
        print(f"  Response Status: {res1.status_code}")
        print(f"  Response Body: {res1.text}")
        if res1.status_code != 200 or res1.json().get("status") != "healthy":
            print("  FAIL: Health check failed.")
            success = False
        else:
            print("  PASS")
        print("-" * 40)

        # Test 2: Unprotected public test path
        print("Test 2: GET /api/v1/public/test (Unprotected Public Endpoint)")
        res2 = client.get(f"{SERVER_URL}/api/v1/public/test")
        print(f"  Response Status: {res2.status_code}")
        print(f"  Response Body: {res2.text}")
        if res2.status_code != 200 or "Guest" not in res2.text:
            print("  FAIL: Public route failed.")
            success = False
        else:
            print("  PASS")
        print("-" * 40)

        # Test 3: Protected endpoint without token
        print("Test 3: GET /api/v1/protected-test (Protected Endpoint - No Token)")
        res3 = client.get(f"{SERVER_URL}/api/v1/protected-test")
        print(f"  Response Status: {res3.status_code}")
        print(f"  Response Body: {res3.text}")
        if res3.status_code != 401:
            print("  FAIL: Expected 401 unauthorized status.")
            success = False
        else:
            print("  PASS")
        print("-" * 40)

        # Test 4: Protected endpoint with invalid token format
        print("Test 4: GET /api/v1/protected-test (Protected Endpoint - Invalid Token Format)")
        res4 = client.get(
            f"{SERVER_URL}/api/v1/protected-test",
            headers={"Authorization": "Bearer invalidtokenbodyexample"}
        )
        print(f"  Response Status: {res4.status_code}")
        print(f"  Response Body: {res4.text}")
        if res4.status_code != 401:
            print("  FAIL: Expected 401 unauthorized status for malformed token.")
            success = False
        else:
            print("  PASS")
        print("-" * 40)

        # Test 5: Protected endpoint with valid token
        print("Test 5: GET /api/v1/protected-test (Protected Endpoint - Valid Token)")
        
        # Construct valid mock token
        test_payload = {
            "user_id": "usr_9988",
            "role": "Doctor"
        }
        token = jwt.encode(test_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        res5 = client.get(
            f"{SERVER_URL}/api/v1/protected-test",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"  Response Status: {res5.status_code}")
        print(f"  Response Body: {res5.text}")
        if res5.status_code != 200 or res5.json().get("user_id") != "usr_9988" or res5.json().get("role") != "Doctor":
            print("  FAIL: Valid authenticated request rejected or incorrect role mapping.")
            success = False
        else:
            print("  PASS")
        print("-" * 40)

except Exception as e:
    print(f"Exception during request execution: {str(e)}")
    success = False

if process is not None:
    # Stop the gateway server subprocess
    print("Step 3: Terminating uvicorn subprocess...")
    process.terminate()
    process.wait()

    # Read the logged output and extract audit logs
    print("Step 4: Parsing stdout stream for audit logs...")
    output = process.stdout.read()
    lines = output.splitlines()

    audit_logs_found = []
    for line in lines:
        # Look for structured JSON output from audit log
        if line.strip().startswith("{") and line.strip().endswith("}"):
            try:
                log_data = json.loads(line)
                if "timestamp" in log_data and "ip_address" in log_data:
                    audit_logs_found.append(log_data)
            except json.JSONDecodeError:
                pass

    print(f"Found {len(audit_logs_found)} structured JSON audit logs in server outputs:")
    for log in audit_logs_found:
        print(f"  Audit Entry -> User: {log.get('user_id') or 'Guest'} ({log.get('role')}) | Path: {log.get('path')} | Status: {log.get('status_code')} | Duration: {log.get('duration_seconds')}s")

    # Verify we have audit entries matching our tests
    if not any(log.get('path') == "/api/v1/protected-test" and log.get('status_code') == 200 and log.get('user_id') == "usr_9988" for log in audit_logs_found):
        print("FAIL: Secure endpoint call was not logged in the structured audit stream.")
        success = False
    else:
        print("PASS: Verified structured log creation for protected endpoint.")
else:
    print("Step 3: Skipping subprocess termination (external server was utilized).")
    print("Step 4: Skipping stdout audit log check (inspect external task logs manually).")

print("=" * 60)
if success:
    print("VERIFICATION COMPLETED SUCCESSFULLY - ALL PASSED")
    sys.exit(0)
else:
    print("VERIFICATION FAILED")
    sys.exit(1)
print("=" * 60)
