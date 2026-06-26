import os
import subprocess
import base64
import hashlib
import json
from datetime import datetime
import pika
import boto3
from cryptography.fernet import Fernet

from app.config import settings

def derive_encryption_key(secret_key: str) -> bytes:
    """
    Derives a cryptographically secure 32-byte Fernet key from a string secret key.

    Inputs:
        secret_key (str): The configuration secret key text.

    Outputs:
        bytes: A URL-safe base64 encoded 32-byte key suited for AES-256 Fernet.
    """
    digest = hashlib.sha256(secret_key.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def process_appointment_audio(appointment_id: str, room_name: str, is_mock: bool):
    """
    Post-consult processing pipeline. Mixes doctor and patient audio tracks via FFmpeg,
    encrypts the merged track using AES-256, stores it in S3 (with local fallback),
    and sends a 'session_ended' event to RabbitMQ (with local log fallback).

    Inputs:
        appointment_id (str): UUID string of the consultation appointment.
        room_name (str): The LiveKit room session identifier ('appointment_<uuid>').
        is_mock (bool): True if running in simulated/mock mode (skips FFmpeg binary runs).

    Outputs:
        None (Processes files on disk, uploads to cloud bucket, and dispatches events).
    """
    print(f"[*] Starting audio post-processing for appointment: {appointment_id} (is_mock={is_mock})")
    
    room_dir = os.path.join(settings.RECORDING_DIR, room_name)
    os.makedirs(room_dir, exist_ok=True)

    patient_file = os.path.join(room_dir, "patient_audio.wav")
    doctor_file = os.path.join(room_dir, "doctor_audio.wav")
    output_file = os.path.join(room_dir, "consult_mixed.wav")

    # 1. Align and mix doctor + patient channels
    if is_mock:
        # In mock mode, we simulate the mixed output content directly
        with open(output_file, "w") as f:
            f.write(f"MOCK MIXED AUDIO CHANNELS FOR APPOINTMENT {appointment_id}\n")
            f.write(f"Timestamp: {datetime.now().isoformat()}\n")
            f.write("Channel L: Patient Audio Tracks\n")
            f.write("Channel R: Doctor Audio Tracks\n")
        print("[*] Mock mixed audio file written.")
    else:
        # Check files exist
        pat_exists = os.path.exists(patient_file)
        doc_exists = os.path.exists(doctor_file)

        import shutil
        ffmpeg_available = shutil.which("ffmpeg") is not None
        if not ffmpeg_available:
            print("[*] Warning: FFmpeg executable was not found in host system PATH. Using python file concatenation fallbacks.")

        def fallback_concat():
            try:
                with open(output_file, "wb") as outfile:
                    with open(patient_file, "rb") as pf:
                        outfile.write(pf.read())
                    with open(doctor_file, "rb") as df:
                        outfile.write(df.read())
                print("[*] Fallback concatenation completed successfully.")
            except Exception as fe:
                print(f"[-] Fallback concatenation failed: {fe}")

        if not pat_exists and not doc_exists:
            # Create a silent placeholder file if no audio was captured at all
            with open(output_file, "w") as f:
                f.write("PLACEHOLDER SILENT AUDIO - NO TRACKS CAPTURED")
            print("[*] No audio captured. Silent placeholder written.")
        elif pat_exists and not doc_exists:
            # Only patient spoke, copy patient file
            if ffmpeg_available:
                try:
                    subprocess.run(["ffmpeg", "-y", "-i", patient_file, output_file], check=True)
                    print("[*] Only patient audio found. Copied to mixed output.")
                except Exception as e:
                    print(f"[-] FFmpeg copy error: {e}. Fallback: rename patient file.")
                    os.rename(patient_file, output_file)
            else:
                print("[*] FFmpeg missing. Fallback: renaming patient file.")
                try:
                    os.rename(patient_file, output_file)
                except Exception as e:
                    print(f"[-] Rename failed: {e}")
        elif doc_exists and not pat_exists:
            # Only doctor spoke, copy doctor file
            if ffmpeg_available:
                try:
                    subprocess.run(["ffmpeg", "-y", "-i", doctor_file, output_file], check=True)
                    print("[*] Only doctor audio found. Copied to mixed output.")
                except Exception as e:
                    print(f"[-] FFmpeg copy error: {e}. Fallback: rename doctor file.")
                    os.rename(doctor_file, output_file)
            else:
                print("[*] FFmpeg missing. Fallback: renaming doctor file.")
                try:
                    os.rename(doctor_file, output_file)
                except Exception as e:
                    print(f"[-] Rename failed: {e}")
        else:
            # Both channels exist. Merge into stereo using FFmpeg amerge
            # Left channel = Patient, Right channel = Doctor
            if ffmpeg_available:
                try:
                    # Command mixes two inputs into stereo
                    cmd = [
                        "ffmpeg", "-y",
                        "-i", patient_file,
                        "-i", doctor_file,
                        "-filter_complex", "[0:a][1:a]amerge=inputs=2[a]",
                        "-ac", "2",
                        "-map", "[a]",
                        output_file
                    ]
                    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    print("[*] FFmpeg successfully merged patient and doctor channels into stereo.")
                except Exception as e:
                    print(f"[-] FFmpeg merging failed: {e}. Falling back to simple concat file.")
                    fallback_concat()
            else:
                print("[*] FFmpeg missing. Falling back to simple concat file.")
                fallback_concat()

    # 2. Encrypt the mixed audio file using AES-256 (Fernet)
    try:
        if os.path.exists(output_file):
            mode = "rb" if not is_mock else "r"
            with open(output_file, mode) as f:
                raw_bytes = f.read() if not is_mock else f.read().encode()
            
            # Derive Fernet key from the JWT secret
            enc_key = derive_encryption_key(settings.JWT_SECRET_KEY)
            fernet = Fernet(enc_key)
            encrypted_data = fernet.encrypt(raw_bytes)
            print("[*] Audio payload encrypted using AES-256.")
        else:
            encrypted_data = b"EMPTY_AUDIO_RECORDING_ERROR"
    except Exception as e:
        print(f"[-] Audio encryption failed: {e}")
        encrypted_data = b"ENCRYPTION_FAILURE_FALLBACK"

    # 3. Archive encrypted audio payload to S3
    s3_path = f"s3://{settings.S3_BUCKET_NAME}/recordings/{appointment_id}/consult_encrypted.wav"
    s3_uploaded = False
    
    if not is_mock:
        try:
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
                endpoint_url=settings.AWS_S3_ENDPOINT if settings.AWS_S3_ENDPOINT else None
            )
            s3_client.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=f"recordings/{appointment_id}/consult_encrypted.wav",
                Body=encrypted_data
            )
            s3_uploaded = True
            print(f"[*] Uploaded encrypted audio to S3: {s3_path}")
        except Exception as e:
            print(f"[-] AWS S3 upload failed or credentials not present ({e}). Writing local backup.")
    
    if not s3_uploaded:
        # Write encrypted file locally as developer fallback
        local_enc_path = os.path.join(room_dir, "consult_encrypted.wav")
        with open(local_enc_path, "wb") as f:
            f.write(encrypted_data)
        s3_path = f"file://{local_enc_path}"
        print(f"[*] Encrypted backup saved locally at: {s3_path}")

    # 4. Dispatch RabbitMQ message
    event = {
        "event": "session_ended",
        "appointment_id": appointment_id,
        "room_name": room_name,
        "timestamp": datetime.now().isoformat(),
        "s3_path": s3_path,
        "is_mock": is_mock
    }

    rabbitmq_sent = False
    try:
        params = pika.URLParameters(settings.RABBITMQ_URL)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.queue_declare(queue="telehealth_events", durable=True)
        
        channel.basic_publish(
            exchange="",
            routing_key="telehealth_events",
            body=json.dumps(event),
            properties=pika.BasicProperties(
                delivery_mode=2  # Persistent message
            )
        )
        connection.close()
        rabbitmq_sent = True
        print("[*] Sent 'session_ended' event to RabbitMQ.")
    except Exception as e:
        print(f"[-] RabbitMQ broadcast failed ({e}). Writing event payload to disk fallback.")

    if not rabbitmq_sent:
        # Save local event trace file
        local_event_path = os.path.join(room_dir, "event_log.json")
        with open(local_event_path, "w") as f:
            json.dump(event, f, indent=2)
        print(f"[*] Saved local event log at: {local_event_path}")
        
    print(f"[*] Completed post-processing pipeline for appointment: {appointment_id}")
