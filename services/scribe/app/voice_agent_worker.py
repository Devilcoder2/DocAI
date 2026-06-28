import os
import asyncio
import logging
from dotenv import load_dotenv

# Search for env paths
env_path = ".env"
if not os.path.exists(env_path):
    if os.path.exists("../.env"):
        env_path = "../.env"
    elif os.path.exists("../../.env"):
        env_path = "../../.env"
load_dotenv(env_path)

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("voice-agent-worker")

try:
    from livekit.agents import JobContext, WorkerOptions, cli, llm
    from livekit.agents.voice_assistant import VoiceAssistant
    from livekit.plugins import openai, deepgram, elevenlabs
    LIVEKIT_AVAILABLE = True
except ImportError:
    LIVEKIT_AVAILABLE = False
    logger.warning("[!] LiveKit Agent dependencies are not fully compiled/imported. Running in simulated fallback mode.")

async def entrypoint(ctx: "JobContext"):
    logger.info(f"Connecting voice assistant agent to room: {ctx.room.name}")
    
    # HIPAA context / configuration checks
    openai_key = os.getenv("OPENAI_API_KEY")
    deepgram_key = os.getenv("DEEPGRAM_API_KEY")
    
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            "You are a friendly, conversational clinical voice booking assistant for the HealthCenter. "
            "Your job is to help patients search for doctors and book slots. "
            "Triage Guardrail: Check the user queries for red-flag symptoms. If they mention symptoms like "
            "chest pain, shortness of breath, heart attack, severe bleeding, or sudden paralysis, immediately "
            "warn them to call 911 or go to the nearest emergency room, and then refuse to book. "
            "Out-of-Scope: Politely refuse to answer queries unrelated to clinic bookings, doctor catalogs, or schedules."
        ),
    )
    
    stt = deepgram.STT()
    llm_engine = openai.LLM(model="gpt-4o-mini")
    tts = openai.TTS()
    
    assistant = VoiceAssistant(
        stt=stt,
        llm=llm_engine,
        tts=tts,
        chat_ctx=initial_ctx,
    )
    
    # Start the assistant inside the LiveKit WebRTC room
    assistant.start(ctx.room)
    
    await assistant.say("Hello! I am your AI care assistant. How can I help you today?", allow_interruptions=True)

if __name__ == "__main__":
    if LIVEKIT_AVAILABLE:
        cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
    else:
        print("[*] LiveKit dependencies not active. Worker cannot start.")
