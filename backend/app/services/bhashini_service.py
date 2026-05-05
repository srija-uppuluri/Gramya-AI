"""
bhashini_service.py
--------------------
Integration with Bhashini ULCA API for:
  - Speech-to-Text (STT) in Kannada
  - Text-to-Speech (TTS) in Kannada

Falls back gracefully when BHASHINI_API_KEY is not set / API is unavailable.
All HTTP calls are synchronous (using `requests`) for simplicity;
swap to `httpx` for async if needed.
"""

import base64
import logging
from typing import Optional
import requests

from app.core.config import settings

log = logging.getLogger(__name__)

# ── Bhashini ULCA endpoints ───────────────────────────────────────────────────
BHASHINI_BASE = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"

# Bhashini pipeline configs (Kannada = "kn")
STT_CONFIG = {
    "pipelineTasks": [
        {
            "taskType": "asr",
            "config": {
                "language": {"sourceLanguage": "kn"},
                "serviceId": "",  # populated at runtime from auth
                "audioFormat": "wav",
                "samplingRate": 16000,
            },
        }
    ]
}

TTS_CONFIG = {
    "pipelineTasks": [
        {
            "taskType": "tts",
            "config": {
                "language": {"sourceLanguage": "kn"},
                "serviceId": "",
                "gender": "female",
                "samplingRate": 8000,
            },
        }
    ]
}


def _has_valid_key() -> bool:
    key = getattr(settings, "BHASHINI_API_KEY", "")
    return bool(key) and key != "your_bhashini_api_key"


# ── STT ───────────────────────────────────────────────────────────────────────

def transcribe_kannada(audio_bytes: bytes, audio_format: str = "wav") -> str:
    """
    Transcribe Kannada audio bytes → text using Bhashini ASR.
    Falls back to a demo transcript if API key is missing or call fails.
    """
    if not _has_valid_key():
        log.warning("Bhashini API key not set — returning mock transcript.")
        return _mock_transcript()

    try:
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        payload = {
            "pipelineTasks": STT_CONFIG["pipelineTasks"],
            "inputData": {
                "audio": [{"audioContent": audio_b64}]
            },
        }

        headers = {
            "Authorization": settings.BHASHINI_API_KEY,
            "Content-Type": "application/json",
        }

        resp = requests.post(BHASHINI_BASE, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        # Navigate Bhashini response structure
        source_text = (
            data.get("pipelineResponse", [{}])[0]
               .get("output", [{}])[0]
               .get("source", "")
        )
        return source_text or _mock_transcript()

    except Exception as exc:
        log.error(f"Bhashini STT error: {exc}")
        return _mock_transcript()


def _mock_transcript() -> str:
    """Return a plausible Kannada transcript for demo/dev mode."""
    return "ನನಗೆ ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಕೆಲಸ ಬೇಕು"  # "I want an electrician job"


# ── TTS ───────────────────────────────────────────────────────────────────────

def synthesize_kannada(text: str) -> Optional[str]:
    """
    Convert Kannada text → audio using Bhashini TTS.
    Returns base64-encoded WAV audio string, or None on failure.
    """
    if not _has_valid_key():
        log.warning("Bhashini API key not set — TTS unavailable.")
        return None

    try:
        payload = {
            "pipelineTasks": TTS_CONFIG["pipelineTasks"],
            "inputData": {
                "input": [{"source": text}]
            },
        }

        headers = {
            "Authorization": settings.BHASHINI_API_KEY,
            "Content-Type": "application/json",
        }

        resp = requests.post(BHASHINI_BASE, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        audio_content = (
            data.get("pipelineResponse", [{}])[0]
               .get("audio", [{}])[0]
               .get("audioContent", None)
        )
        return audio_content  # base64 WAV

    except Exception as exc:
        log.error(f"Bhashini TTS error: {exc}")
        return None


# ── Utility: build response text in Kannada ───────────────────────────────────

def build_kannada_response(job_count: int, top_job_title: str) -> str:
    """
    Build a simple Kannada TTS script summarising job results.
    """
    return (
        f"ನಿಮಗಾಗಿ {job_count} ಕೆಲಸಗಳು ಕಂಡುಬಂದಿವೆ. "
        f"ಅತ್ಯುತ್ತಮ ಹೊಂದಾಣಿಕೆ: {top_job_title}. "
        f"ದಯವಿಟ್ಟು ಅರ್ಜಿ ಸಲ್ಲಿಸಲು 'ಅರ್ಜಿ ಸಲ್ಲಿಸಿ' ಬಟನ್ ಒತ್ತಿರಿ."
    )
