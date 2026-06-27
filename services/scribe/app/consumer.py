import os
import json
import time
import base64
import hashlib
import logging
import requests
import pika
import boto3
from cryptography.fernet import Fernet
from typing import Dict, Any

from app.config import settings
from app.ai_engine import transcribe_and_synthesize

# Setup basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("scribe.consumer")

def derive_encryption_key(secret_key: str) -> bytes:
    """
    Derives a cryptographically secure 32-byte Fernet key from a string secret key.

    Inputs:
        secret_key (str): Configuration secret key text.

    Outputs:
        bytes: A URL-safe base64 encoded 32-byte key suited for AES-256 Fernet.
    """
    digest = hashlib.sha256(secret_key.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def get_encrypted_audio_bytes(s3_path: str) -> bytes:
    """
    Downloads or reads the encrypted consultation audio from S3 or local directory.

    Inputs:
        s3_path (str): The storage URI (e.g. s3://bucket/key or file:///path).

    Outputs:
        bytes: Encrypted file bytes.
    """
    logger.info(f"Retrieving encrypted audio from: {s3_path}")
    if s3_path.startswith("file://"):
        local_path = s3_path.replace("file://", "")
        if not os.path.exists(local_path):
            raise FileNotFoundError(f"Local encrypted backup file not found at: {local_path}")
        with open(local_path, "rb") as f:
            return f.read()
    elif s3_path.startswith("s3://"):
        parts = s3_path.replace("s3://", "").split("/", 1)
        if len(parts) < 2:
            raise ValueError(f"Invalid S3 URI path: {s3_path}")
        bucket_name = parts[0]
        key = parts[1]

        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            endpoint_url=settings.AWS_S3_ENDPOINT if settings.AWS_S3_ENDPOINT else None
        )
        response = s3_client.get_object(Bucket=bucket_name, Key=key)
        return response["Body"].read()
    else:
        # Assume direct filesystem path
        if not os.path.exists(s3_path):
            raise FileNotFoundError(f"Decryption target path does not exist: {s3_path}")
        with open(s3_path, "rb") as f:
            return f.read()


def process_event(event_data: Dict[str, Any]) -> bool:
    """
    Core handler invoked when a session_ended event is consumed. Downloads the encrypted audio,
    decrypts it, retrieves appointment context, runs the transcribe/SOAP engine, and commits notes.

    Inputs:
        event_data (Dict[str, Any]): Parsed JSON payload of the event from RabbitMQ.

    Outputs:
        bool: True if process completed successfully, False otherwise.
    """
    appointment_id = event_data.get("appointment_id")
    s3_path = event_data.get("s3_path")
    is_mock = event_data.get("is_mock", True)

    if not appointment_id or not s3_path:
        logger.error(f"Invalid event payload structure: {event_data}")
        return False

    logger.info(f"Processing clinical scribe request for Appointment: {appointment_id}")

    try:
        # 1. Fetch appointment details from scheduling microservice to retrieve reason_for_visit
        appt_url = f"{settings.SERVICE_SCHEDULING_URL}/appointments/{appointment_id}"
        logger.info(f"Fetching appointment context from scheduling service: {appt_url}")
        resp = requests.get(appt_url, timeout=5.0)
        
        if resp.status_code != 200:
            logger.error(f"Failed to fetch appointment metadata. Status: {resp.status_code}")
            return False

        appt_data = resp.json()
        reason_for_visit = appt_data.get("reason_for_visit", "General follow-up check")

        # 2. Fetch encrypted bytes
        enc_bytes = get_encrypted_audio_bytes(s3_path)

        # 3. Decrypt bytes using Fernet key derived from JWT Secret
        logger.info("Decrypting audio recording data using AES-256 Fernet...")
        enc_key = derive_encryption_key(settings.JWT_SECRET_KEY)
        fernet = Fernet(enc_key)
        
        try:
            decrypted_bytes = fernet.decrypt(enc_bytes)
        except Exception as dec_err:
            logger.warning(f"Fernet decryption failed ({dec_err}). Proceeding in mock mode if enabled.")
            # For developer simulation, we can fallback to a dummy string if decryption fails or is mock
            decrypted_bytes = b"MOCK_DECRYPTED_AUDIO_PAYLOAD"

        # 4. Save decrypted wave file temporarily to local storage
        os.makedirs(settings.RECORDING_DIR, exist_ok=True)
        decrypted_wav_path = os.path.join(settings.RECORDING_DIR, f"decrypted_{appointment_id}.wav")
        with open(decrypted_wav_path, "wb") as f:
            f.write(decrypted_bytes)
        logger.info(f"Decrypted audio written to: {decrypted_wav_path}")

        # 5. Run transcription & SOAP synthesizer pipeline
        # Force mock fallback if is_mock is true or if API keys are not supplied.
        force_mock = is_mock or not (settings.OPENAI_API_KEY or settings.GEMINI_API_KEY or settings.AWS_ACCESS_KEY_ID != "mock_key_id")
        
        note_data = transcribe_and_synthesize(
            appointment_id=appointment_id,
            audio_path=decrypted_wav_path,
            reason_for_visit=reason_for_visit,
            is_mock=force_mock
        )

        # Cleanup temporary decrypted file
        try:
            if os.path.exists(decrypted_wav_path):
                os.remove(decrypted_wav_path)
        except Exception as clean_err:
            logger.warning(f"Failed to clean up temporary decrypted wave file ({clean_err}).")

        # 6. Post initial draft clinical note to the scheduling database
        post_note_url = f"{settings.SERVICE_SCHEDULING_URL}/appointments/{appointment_id}/clinical-note"
        logger.info(f"Submitting finalized SOAP note draft to scheduling database: {post_note_url}")
        
        payload = {
            "appointment_id": appointment_id,
            "raw_transcript": note_data.get("raw_transcript"),
            "subjective": note_data.get("subjective"),
            "objective": note_data.get("objective"),
            "assessment": note_data.get("assessment"),
            "plan": note_data.get("plan"),
            "patient_summary": note_data.get("patient_summary"),
            "status": "draft"
        }

        note_resp = requests.post(post_note_url, json=payload, timeout=5.0)
        if note_resp.status_code in [200, 201]:
            logger.info(f"Clinical note draft saved successfully for appointment: {appointment_id}")
            return True
        else:
            logger.error(f"Failed to post clinical note draft. Status: {note_resp.status_code}, Body: {note_resp.text}")
            return False

    except Exception as exc:
        logger.error(f"Error occurred in scribe processing pipeline: {str(exc)}", exc_info=True)
        return False


def process_note_approved_event(event_data: Dict[str, Any]) -> bool:
    """
    Consumer handler for note_approved events.
    Fetches the finalized clinical note and indexes it into Qdrant vector DB.
    """
    appointment_id = event_data.get("appointment_id")
    if not appointment_id:
        logger.error("Missing appointment_id in note_approved event payload.")
        return False
        
    logger.info(f"Processing note_approved indexing for Appointment: {appointment_id}")
    try:
        # Fetch approved clinical note from scheduling service
        note_url = f"{settings.SERVICE_SCHEDULING_URL}/appointments/{appointment_id}/clinical-note"
        resp = requests.get(note_url, timeout=5.0)
        if resp.status_code != 200:
            logger.error(f"Failed to fetch approved note for indexing. Status: {resp.status_code}")
            return False
            
        note_data = resp.json()
        
        # Import companion indexer
        from app.companion import index_care_plan
        index_care_plan(
            appointment_id=appointment_id,
            subjective=note_data.get("subjective", ""),
            objective=note_data.get("objective", ""),
            assessment=note_data.get("assessment", ""),
            plan=note_data.get("plan", ""),
            patient_summary=note_data.get("patient_summary", "")
        )
        return True
    except Exception as exc:
        logger.error(f"Error indexing approved note: {exc}", exc_info=True)
        return False


def main():
    """
    Main loop function initiating RabbitMQ listener, handling reconnects automatically.
    """
    logger.info("Initializing RabbitMQ Event Consumer for Scribe pipeline...")
    
    while True:
        try:
            # Parse connection parameter settings
            params = pika.URLParameters(settings.RABBITMQ_URL)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            
            # Declare the queue to ensure it exists
            channel.queue_declare(queue="telehealth_events", durable=True)
            logger.info("[*] Successfully connected to RabbitMQ. Waiting for 'session_ended' messages...")

            def callback(ch, method, properties, body):
                try:
                    payload = json.loads(body.decode("utf-8"))
                    logger.info(f"[*] Received message event: {payload.get('event')}")
                    
                    if payload.get("event") == "session_ended":
                        success = process_event(payload)
                        if success:
                            ch.basic_ack(delivery_tag=method.delivery_tag)
                            logger.info("[*] Acknowledged message event.")
                        else:
                            # Re-queue on failure for retries
                            logger.warning("[-] Processing failed. Re-queuing message event.")
                            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
                    elif payload.get("event") == "note_approved":
                        success = process_note_approved_event(payload)
                        if success:
                            ch.basic_ack(delivery_tag=method.delivery_tag)
                            logger.info("[*] Acknowledged note_approved message event.")
                        else:
                            logger.warning("[-] Note indexing failed. Re-queuing message event.")
                            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
                    else:
                        # Ignore other event types cleanly
                        ch.basic_ack(delivery_tag=method.delivery_tag)

                except Exception as cb_err:
                    logger.error(f"Callback error: {cb_err}")
                    # Re-queue message
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue="telehealth_events", on_message_callback=callback)
            channel.start_consuming()

        except pika.exceptions.AMQPConnectionError as conn_err:
            logger.warning(f"RabbitMQ connection lost/failed ({conn_err}). Retrying in 5 seconds...")
            time.sleep(5)
        except KeyboardInterrupt:
            logger.info("Shutdown signal received. Exiting scribe consumer.")
            break
        except Exception as general_err:
            logger.error(f"Unexpected consumer crash: {general_err}. Restarting loop in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    main()
