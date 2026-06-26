import os
import sys
import time
import base64
import subprocess
from playwright.sync_api import sync_playwright

# Parse environment configuration
LIVEKIT_URL = os.environ.get("LIVEKIT_URL", "ws://localhost:7880")
LIVEKIT_TOKEN = os.environ.get("LIVEKIT_TOKEN", "")
ROOM_NAME = os.environ.get("ROOM_NAME", "unknown_room")
RECORDING_DIR = os.environ.get("RECORDING_DIR", "/tmp/recording")

if not LIVEKIT_TOKEN:
    print("[-] Error: LIVEKIT_TOKEN is required to run the recording bot.")
    sys.exit(1)

# Ensure the output directory for this room exists
room_output_dir = os.path.join(RECORDING_DIR, ROOM_NAME)
os.makedirs(room_output_dir, exist_ok=True)

# Keep track of active audio files we are writing to
# Structure: { identity: file_handle }
active_files = {}

def write_audio_chunk(identity: str, base64_data: str):
    """
    Playwright exposed binding called from browser JS whenever a new WebM audio chunk is captured.
    Decodes base64 chunk and appends it to a raw participant file.

    Inputs:
        identity (str): The unique participant UUID.
        base64_data (str): The base64 encoded audio track chunk bytes.

    Outputs:
        None (appends data to disk).
    """
    try:
        data = base64.b64decode(base64_data)
        
        # If file not opened yet, open it
        if identity not in active_files:
            file_path = os.path.join(room_output_dir, f"{identity}_raw.webm")
            active_files[identity] = open(file_path, "wb")
            print(f"[+] Started capturing raw audio stream for participant: {identity}")
            
        active_files[identity].write(data)
        active_files[identity].flush()
    except Exception as e:
        print(f"[-] Error writing audio chunk for {identity}: {e}")


# Bundle a simple HTML template inline that loads the LiveKit-Client JS library from CDN
# and sets up the audio capture loops. This avoids external file management inside Docker.
HTML_HELPER_CONTENT = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>LiveKit Audio Scribe Bot</title>
    <!-- Load LiveKit client SDK from public CDN -->
    <script src="https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js"></script>
</head>
<body>
    <h3>LiveKit Telehealth Scribe</h3>
    <div id="status">Idle</div>

    <script>
        async function runRecording(lkUrl, lkToken, roomName) {
            const statusDiv = document.getElementById("status");
            statusDiv.innerText = "Connecting to " + roomName;

            const room = new LiveKitClient.Room({
                publishDefaults: { audio: false, video: false }
            });

            // Handle incoming audio tracks
            room.on(LiveKitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
                if (track.kind === LiveKitClient.Track.Kind.Audio) {
                    statusDiv.innerText = "Recording track of " + participant.identity;
                    console.log("Subscribed to audio track:", track.sid, "from", participant.identity);

                    // Route track into Web Audio destination to capture raw stream data
                    const mediaStream = new MediaStream([track.mediaStreamTrack]);
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const source = audioContext.createMediaStreamSource(mediaStream);
                    const destination = audioContext.createMediaStreamDestination();
                    source.connect(destination);

                    // Record track data in 1-second chunks
                    const mediaRecorder = new MediaRecorder(destination.stream, { mimeType: 'audio/webm' });
                    
                    mediaRecorder.ondataavailable = async (event) => {
                        if (event.data && event.data.size > 0) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                const base64String = reader.result.split(',')[1];
                                // Send to Python backend via exposed binding
                                window.onAudioChunkReceived(participant.identity, base64String);
                            };
                            reader.readAsDataURL(event.data);
                        }
                    };

                    mediaRecorder.start(1000); // Trigger dataavailable event every 1000ms
                    track.mediaRecorder = mediaRecorder;
                }
            });

            try {
                await room.connect(lkUrl, lkToken);
                statusDiv.innerText = "Connected and Listening in room: " + roomName;
                console.log("Successfully connected to room:", roomName);
            } catch (err) {
                statusDiv.innerText = "Connection Error: " + err.message;
                console.error("Connection failed:", err);
            }
        }
        
        window.runRecording = runRecording;
    </script>
</body>
</html>
"""

def main():
    """
    Main orchestrator booting Playwright browser, injecting LiveKit parameters,
    listening to streams, and converting raw outputs to WAV on exit.

    Inputs:
        None (reads environment variables).

    Outputs:
        None (saves WAV tracks to output folder).
    """
    print(f"[*] Booting Playwright recording bot for room: {ROOM_NAME}")
    print(f"[*] Connecting to: {LIVEKIT_URL}")

    with sync_playwright() as p:
        # Launch headless Chromium. Allow flags for Docker sandbox isolation
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--use-fake-ui-for-media-stream"
            ]
        )
        
        page = browser.new_page()
        
        # Expose python handler to browser context
        page.expose_binding("onAudioChunkReceived", lambda source, identity, base64_data: write_audio_chunk(identity, base64_data))
        
        # Load the HTML script interface
        page.set_content(HTML_HELPER_CONTENT)
        
        # Trigger the recording javascript function
        page.evaluate(
            f"window.runRecording('{LIVEKIT_URL}', '{LIVEKIT_TOKEN}', '{ROOM_NAME}')"
        )
        
        print("[*] Scribe Bot connected to SFU channel. Recording active...")

        # Keep running until container is stopped or process is terminated
        try:
            while True:
                time.sleep(1)
        except (KeyboardInterrupt, SystemExit):
            print("[*] Stop signal received. Closing recording resources...")
        finally:
            # Close active raw files
            for identity, f in active_files.items():
                try:
                    f.close()
                except Exception:
                    pass
            browser.close()
            
            # Post-Process: Convert raw WebM files to WAV format using FFmpeg inside container
            print("[*] Converting captured audio tracks from WebM to PCM WAV format...")
            for identity in list(active_files.keys()):
                raw_path = os.path.join(room_output_dir, f"{identity}_raw.webm")
                wav_path = os.path.join(room_output_dir, f"{identity}_audio.wav")
                
                if os.path.exists(raw_path):
                    try:
                        # Extract audio stream directly to standard 16kHz PCM WAV for transcription pipelines
                        subprocess.run([
                            "ffmpeg", "-y",
                            "-i", raw_path,
                            "-vn",
                            "-acodec", "pcm_s16le",
                            "-ar", "16000",
                            "-ac", "1",
                            wav_path
                        ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                        print(f"[+] Converted {identity} track to WAV: {wav_path}")
                        
                        # Remove the raw webm file to conserve space
                        os.remove(raw_path)
                    except Exception as e:
                        print(f"[-] FFmpeg conversion failed for {identity}: {e}")

            print("[*] Scribe Bot execution finished.")

if __name__ == "__main__":
    main()
