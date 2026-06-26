# Use the official Microsoft Playwright Python base image which pre-installs Chromium,
# WebKit, Firefox browser binaries, and all required system dependencies.
FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

WORKDIR /app

# Install FFmpeg for post-recording audio format conversion (WebM -> WAV)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies. We use the playwright version bundled in the image.
# We also make sure playwright is ready (browser binaries are pre-installed in this image,
# but we run playwright install to verify the environment matches if needed).
RUN pip install --no-cache-dir playwright==1.44.0

COPY bot.py .

# Define execution entrypoint
CMD ["python", "bot.py"]
