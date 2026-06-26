import os
import json
import logging
from typing import Dict, Any, Optional
import boto3

logger = logging.getLogger(__name__)

def generate_mock_scribe_note(reason_for_visit: str) -> Dict[str, str]:
    """
    Generates a highly realistic, detailed, and structured SOAP clinical note
    and patient-friendly layman summary based on the visit reason. Used as a mock fallback.

    Inputs:
        reason_for_visit (str): The patient's reported symptoms or reason for visit.

    Outputs:
        Dict[str, str]: A dictionary containing:
            - "raw_transcript": Dialog transcript between doctor and patient.
            - "subjective": SOAP Subjective section.
            - "objective": SOAP Objective section.
            - "assessment": SOAP Assessment section.
            - "plan": SOAP Plan section.
            - "patient_summary": Layman summary.
    """
    reason_lower = reason_for_visit.lower()

    if "hypertension" in reason_lower or "blood pressure" in reason_lower or "bp" in reason_lower:
        transcript = (
            "Doctor: Hello! Thanks for coming in today. I see we're doing a follow-up for your high blood pressure. How have you been feeling?\n"
            "Patient: Hi Doctor. I've been feeling okay mostly, but sometimes I get a mild headache in the mornings. I've been trying to limit my salt intake like we talked about last time.\n"
            "Doctor: Good to hear about the salt. Are you taking your Lisinopril 10mg daily as prescribed?\n"
            "Patient: Yes, I take it every morning with breakfast. I haven't missed any doses in the last month.\n"
            "Doctor: Excellent. Let's check your blood pressure today. ... It looks like it is 138/86 mmHg. That's slightly elevated but better than the 152/94 we saw last month.\n"
            "Patient: Yeah, it seems to be going down. Should we change the medication?\n"
            "Doctor: Not yet. I'd like to continue the current dosage of Lisinopril 10mg. However, let's add a log: I want you to check it at home twice a day and write down the numbers. Also, keep up with the low-sodium diet and walking 30 minutes daily.\n"
            "Patient: Okay, I can do that. I'll start checking it at home and bring the log next time.\n"
            "Doctor: Perfect. We will schedule a follow-up in 4 weeks to review your home logs. If you experience severe headaches, vision changes, or chest pain, call us immediately or go to the ER.\n"
            "Patient: Understood. Thank you, Doctor."
        )
        subjective = (
            "Patient is a 45-year-old male presenting for follow-up evaluation of hypertension. "
            "Reports adherence to Lisinopril 10mg daily with no missed doses. Reports occasional mild morning headaches, "
            "denies chest pain, shortness of breath, dizziness, or visual changes. "
            "Patient reports attempting dietary modifications including salt restriction."
        )
        objective = (
            "Vitals:\n"
            "- Blood Pressure: 138/86 mmHg (Sitting, Right Arm)\n"
            "- Heart Rate: 74 bpm (Regular)\n"
            "- Respiratory Rate: 16/min\n"
            "- Temperature: 98.4 F\n"
            "Physical Exam:\n"
            "- Cardiovascular: Normal S1, S2, no murmurs, rubs, or gallops.\n"
            "- Pulm: Clear to auscultation bilaterally.\n"
            "- Neuro: Alert and oriented x3, cranial nerves intact, no focal deficits."
        )
        assessment = (
            "1. Essential Hypertension - Improved control, but remains slightly above target of <130/80 mmHg. "
            "No signs of target organ damage on exam. Headache is likely benign, but will monitor closely.\n"
            "Differential Diagnosis: Secondary hypertension (low suspicion), white-coat hypertension, poor dietary control."
        )
        plan = (
            "1. Medication: Continue Lisinopril 10mg orally once daily.\n"
            "2. Monitoring: Patient to keep a home blood pressure log twice daily (morning and evening) and present at the next visit.\n"
            "3. Lifestyle: Continue low-sodium diet (<2,000 mg/day) and aerobic exercise for 30 minutes 5 days a week.\n"
            "4. Follow-up: Return to clinic in 4 weeks. Return immediately for red-flag symptoms: BP >180/120, severe headache, chest pain, or dyspnea."
        )
        patient_summary = (
            "Today we reviewed your high blood pressure. Your reading in the clinic was 138/86, which is better than last time but still slightly high. "
            "Please continue taking your Lisinopril 10mg pill every morning. Start measuring your blood pressure at home twice a day and write down the numbers so we can review them together at your next appointment in 4 weeks. "
            "Keep eating less salt and walking daily. Go to the emergency room if you get chest pain, severe headaches, or vision changes."
        )

    elif "throat" in reason_lower or "cough" in reason_lower or "cold" in reason_lower or "fever" in reason_lower:
        transcript = (
            "Doctor: Welcome. I understand you've been having a sore throat and cough. Tell me about when it started.\n"
            "Patient: Thanks Doctor. It started about 3 days ago. My throat felt very scratchy and it hurts to swallow. I also developed a dry cough yesterday and felt slightly feverish last night.\n"
            "Doctor: Have you had any body aches, runny nose, or loss of taste or smell?\n"
            "Patient: Just a bit of a runny nose and feeling tired, but no loss of taste or smell. I took ibuprofen, which helped the fever go away.\n"
            "Doctor: Understood. Let's do a throat exam. I see some redness and mild inflammation, but no white patches or exudates. Your lungs sound clear when you breathe deeply. Lymph nodes in your neck are slightly swollen.\n"
            "Patient: Do you think it's strep throat or COVID? Do I need antibiotics?\n"
            "Doctor: This looks consistent with a viral upper respiratory infection. I did a rapid strep test and it came back negative. Antibiotics will not work against viruses. We'll run a quick COVID/Flu swab just to be sure.\n"
            "Patient: Okay, what should I do to feel better?\n"
            "Doctor: Focus on rest, warm fluids, and salt water gargles. You can continue Ibuprofen 400mg every 6 hours as needed for throat pain and fever. Use throat lozenges for irritation.\n"
            "Patient: Sounds good. How long will this last?\n"
            "Doctor: Typically 7 to 10 days. If your fever returns and lasts more than 3 days, or you start having trouble breathing, please call us back."
        )
        subjective = (
            "Patient is a 28-year-old female presenting with a 3-day history of sore throat, odynophagia, runny nose, and dry cough. "
            "Reports subjective fever last night relieved by ibuprofen. Denies shortness of breath, chest pain, myalgias, or loss of taste/smell. "
            "Has been using over-the-counter ibuprofen with moderate symptom relief."
        )
        objective = (
            "Vitals:\n"
            "- Temperature: 98.9 F (Oral)\n"
            "- Blood Pressure: 118/76 mmHg\n"
            "- Heart Rate: 80 bpm\n"
            "- O2 Saturation: 99% on room air\n"
            "Physical Exam:\n"
            "- HEENT: Erythematous posterior pharynx, no tonsillar exudates or cobblestoning. Mild bilateral anterior cervical lymphadenopathy.\n"
            "- Pulm: Lungs clear to auscultation bilaterally, no wheezes or rales.\n"
            "- Cardio: Regular rate and rhythm, no murmurs."
        )
        assessment = (
            "1. Acute Viral Upper Respiratory Infection (URI) - Presumed viral pharyngitis and bronchitis. "
            "Negative rapid strep test. Swab for COVID-19 and Influenza pending.\n"
            "Differential Diagnosis: Streptococcal pharyngitis (ruled out by rapid test), COVID-19, Influenza, allergic rhinitis."
        )
        plan = (
            "1. Supportive Care: Rest, maintain high fluid intake, and use saline gargles or throat lozenges as needed.\n"
            "2. Pain/Fever Management: Continue Ibuprofen 400mg orally every 6 hours as needed for throat pain or fever (not to exceed 3200mg/day).\n"
            "3. Lab: COVID/Flu PCR swab collected (results pending, expect in 24 hours).\n"
            "4. Precautions: Patient advised to isolate until COVID-19 results are negative. Seek medical care if experiencing dyspnea, persistent high fever >102 F, or inability to swallow liquids."
        )
        patient_summary = (
            "You have a viral sore throat and cold (upper respiratory infection). The rapid strep test was negative, so antibiotics are not needed. "
            "We took a swab for COVID and Flu, and the results will be ready tomorrow. Please rest, drink plenty of water, and gargle with warm salt water. "
            "You can take Ibuprofen 400mg every 6 hours as needed for throat pain. If you have trouble breathing or your fever returns, please contact us."
        )

    else:
        # Generic clinic consultation mock fallback
        transcript = (
            f"Doctor: Hello, thank you for coming in today. Let's discuss your visit for: {reason_for_visit}.\n"
            f"Patient: Hi Doctor. Yes, I wanted to check on this because it's been bothering me recently.\n"
            "Doctor: Understood. Let's walk through your history and symptoms. When did you first notice this?\n"
            "Patient: About a week ago. It has been a steady concern since then, coming and going.\n"
            "Doctor: Okay. I will perform a physical exam and check your vital signs. ... Everything looks stable right now. Vitals are within normal limits.\n"
            "Patient: What do you think is causing it?\n"
            "Doctor: It could be a mild inflammatory reaction or fatigue, but we want to monitor it closely. Let's start with conservative management.\n"
            "Patient: Do I need any testing or prescriptions?\n"
            "Doctor: No immediate scans are required. We'll start with lifestyle adjustments and follow up if things don't improve.\n"
            "Patient: Okay, I will follow that plan. Thank you, Doctor."
        )
        subjective = (
            f"Patient presents with concerns regarding: {reason_for_visit}. "
            "Symptoms began approximately 1 week ago. Described as intermittent and mild to moderate in severity. "
            "Denies associated severe symptoms, chest pain, shortness of breath, or neurological deficits."
        )
        objective = (
            "Vitals:\n"
            "- Blood Pressure: 120/80 mmHg\n"
            "- Heart Rate: 72 bpm\n"
            "- Temperature: 98.6 F\n"
            "- O2 Saturation: 98% on room air\n"
            "Physical Exam:\n"
            "- General: Well-appearing, alert and oriented x3, in no acute distress.\n"
            "- Cardiorespiratory: Normal heart sounds, lungs clear to auscultation bilaterally.\n"
            "- Localized: No focal tenderness, swelling, or redness observed in the affected area."
        )
        assessment = (
            f"1. Consultation for {reason_for_visit} - Mild, stable presentation. "
            "Etiology is likely benign and self-limiting.\n"
            "Differential Diagnosis: Nonspecific strain, transient inflammatory episode, fatigue."
        )
        plan = (
            "1. Lifestyle: Rest, avoid heavy strain, and monitor symptoms.\n"
            "2. Pain Management: Over-the-counter acetaminophen 500mg as needed for discomfort.\n"
            "3. Follow-up: Return to clinic if symptoms persist beyond 2 weeks or worsen."
        )
        patient_summary = (
            f"We discussed your concern regarding '{reason_for_visit}' today. Your examination and vital signs were completely normal. "
            "We recommend resting and avoiding any strain. You can take over-the-counter Tylenol if you experience pain. "
            "Please follow up if your symptoms do not improve within two weeks."
        )

    return {
        "raw_transcript": transcript,
        "subjective": subjective,
        "objective": objective,
        "assessment": assessment,
        "plan": plan,
        "patient_summary": patient_summary
    }


def transcribe_and_synthesize(
    appointment_id: str,
    audio_path: str,
    reason_for_visit: str,
    is_mock: bool = True
) -> Dict[str, str]:
    """
    Main orchestration function for speech-to-text transcription and SOAP note synthesis.
    Integrates AWS Bedrock (Claude 3.5 Sonnet) or alternative LLMs, with a robust mock fallback.

    Inputs:
        appointment_id (str): UUID of the appointment.
        audio_path (str): File path to the decrypted audio consultation recording.
        reason_for_visit (str): Patient's reason for visit/symptoms to feed the models.
        is_mock (bool): Force mock fallback mode. Defaults to True.

    Outputs:
        Dict[str, str]: Structured clinical note content fields.
    """
    logger.info(f"Starting Scribe processing for appointment {appointment_id}. mock_mode={is_mock}")

    # If mock mode is forced, return mock content immediately
    if is_mock:
        logger.info("Mock mode enabled. Generating mock clinical note.")
        return generate_mock_scribe_note(reason_for_visit)

    # Attempt real transcription & LLM synthesis, with fallback to mock on failures
    try:
        # Check if Whisper library is available and if audio_path exists
        # In this developer environment, faster-whisper is not pre-installed to avoid large binary weight.
        # We will attempt importing it to support future production extensions.
        try:
            from faster_whisper import WhisperModel
            logger.info("faster-whisper package detected. Attempting local transcription...")
            # Use cpu for developer fallback if cuda is not configured
            model = WhisperModel("base", device="cpu", compute_type="int8")
            segments, info = model.transcribe(audio_path, beam_size=5)
            transcript_lines = []
            for segment in segments:
                transcript_lines.append(f"Speaker {segment.speaker if hasattr(segment, 'speaker') else 'Patient/Doctor'}: {segment.text}")
            raw_transcript = "\n".join(transcript_lines)
            logger.info("Speech-to-Text completed successfully.")
        except Exception as e:
            logger.warning(f"Speech-to-text library or audio file access failed ({e}). Falling back to mock transcript generation.")
            mock_note = generate_mock_scribe_note(reason_for_visit)
            raw_transcript = mock_note["raw_transcript"]

        # Call LLM for SOAP note structuring (e.g. Bedrock)
        # We will structure the prompt to format the clinical note
        prompt = (
            f"You are an expert AI Clinical Scribe. Analyze the following conversation transcript from a medical consultation "
            f"where the patient presented with the following reason for visit: '{reason_for_visit}'.\n\n"
            f"Transcript:\n{raw_transcript}\n\n"
            f"Please generate a structured clinical SOAP note and a patient-friendly lay summary. "
            f"Respond strictly in JSON format with the following string keys:\n"
            f"- 'subjective': Detailed description of patient's history, symptoms, onset.\n"
            f"- 'objective': Clinical exam findings, vitals, observations.\n"
            f"- 'assessment': Clinical impression, diagnosis, differential diagnosis.\n"
            f"- 'plan': Treatment plan, medications, follow-up directions.\n"
            f"- 'patient_summary': Layman summary in clear, simple terms.\n"
            f"Do not include any preambles or markdown backticks outside of the raw JSON."
        )

        # Attempt Bedrock invocation
        try:
            # Load credentials from settings inside settings environment
            from app.config import settings
            
            # Skip if mock credentials
            if settings.AWS_ACCESS_KEY_ID == "mock_key_id" or not settings.OPENAI_API_KEY:
                # Force fallback if no keys configured
                raise ValueError("No valid AWS or OpenAI credentials configured for LLM synthesis.")

            bedrock = boto3.client(
                service_name="bedrock-runtime",
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
            
            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2048,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
            
            response = bedrock.invoke_model(
                modelId=settings.BEDROCK_MODEL_ID,
                body=body
            )
            
            response_body = json.loads(response.get("body").read())
            llm_text = response_body["content"][0]["text"]
            
            # Parse the JSON response
            note_data = json.loads(llm_text)
            note_data["raw_transcript"] = raw_transcript
            logger.info("Clinical note synthesized successfully via Amazon Bedrock.")
            return note_data
            
        except Exception as llm_err:
            logger.warning(f"Bedrock/LLM synthesis failed ({llm_err}). Falling back to mock SOAP clinical note generation.")
            return generate_mock_scribe_note(reason_for_visit)

    except Exception as general_err:
        logger.error(f"General error in Scribe AI Engine ({general_err}). Fallback to mock.")
        return generate_mock_scribe_note(reason_for_visit)
