# Voice agent runtime

The real-time LiveKit Agents dependency installed by this project requires Python 3.10 or newer. The existing local `venv` uses Python 3.9, so it can run the HTTP booking conversation but cannot start the real-time worker.

Use Python 3.12 (available on this machine) to create the production voice-worker environment, install `services/scribe/requirements.txt`, and set these values outside version control:

```text
VOICE_AGENT_ENABLED=true
OPENAI_API_KEY=...
DEEPGRAM_API_KEY=...
LIVEKIT_URL=ws://localhost:7980
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

Without managed provider credentials, the portal continues to offer typed booking help and a clearly labelled browser voice-typing fallback. It does not simulate a booking or invent an answer.
