"""
fraud_service.py — Core Fraud Analysis Engine
==============================================
Handles:
  - Face detection (OpenCV Haar cascade)
  - Voice analysis (Librosa MFCC — graceful fallback if unavailable)
  - Duplicate face detection (mock embeddings; swap in face_recognition on Linux)
  - Fraud score computation & risk tier assignment
  - Fraud report generation
"""

import base64
import json
import logging
import math
import os
import random
import tempfile
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
#  Optional imports — degrade gracefully when heavy libs are absent
# ──────────────────────────────────────────────────────────────────────────────
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("OpenCV not available — face detection will be mocked.")

try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    logger.warning("Librosa not available — voice analysis will be mocked.")

try:
    import soundfile as sf
    SOUNDFILE_AVAILABLE = True
except ImportError:
    SOUNDFILE_AVAILABLE = False


# ──────────────────────────────────────────────────────────────────────────────
#  Fraud Score Constants
# ──────────────────────────────────────────────────────────────────────────────
SCORE_TABLE: Dict[str, int] = {
    "multiple_faces":   40,
    "face_absent":      20,
    "voice_mismatch":   30,
    "tab_switch":       15,
    "duplicate_face":   50,
    "liveness_failed":  25,
    "fullscreen_exit":  10,
    "background_noise": 10,
}

RISK_TIERS = [
    (0,  30, "safe"),
    (31, 60, "review"),
    (61, 999, "high_risk"),
]

VOICE_CONSISTENCY_THRESHOLD = 0.75  # below this → mismatch


def get_risk_tier(score: int) -> str:
    for lo, hi, tier in RISK_TIERS:
        if lo <= score <= hi:
            return tier
    return "high_risk"


# ──────────────────────────────────────────────────────────────────────────────
#  Face Detection
# ──────────────────────────────────────────────────────────────────────────────

def analyze_face_frame(image_b64: str) -> Dict[str, Any]:
    """
    Decode a base64 image and detect faces using OpenCV Haar cascade.
    Returns face count, fraud flag, and score delta.
    """
    if not CV2_AVAILABLE:
        # Mock: randomly simulate a clean frame most of the time
        face_count = random.choices([0, 1, 2], weights=[5, 85, 10])[0]
    else:
        try:
            img_bytes = base64.b64decode(image_b64)
            nparr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                return _face_result(0, False, 0, "Could not decode image")

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            face_cascade = cv2.CascadeClassifier(cascade_path)
            faces = face_cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60)
            )
            face_count = len(faces)
        except Exception as exc:
            logger.error("Face analysis error: %s", exc)
            return _face_result(0, False, 0, f"Error: {exc}")

    if face_count == 0:
        return _face_result(0, True, SCORE_TABLE["face_absent"], "No face detected in frame")
    elif face_count > 1:
        return _face_result(face_count, True, SCORE_TABLE["multiple_faces"],
                            f"{face_count} faces detected — possible impersonation")
    return _face_result(1, False, 0, "Face verified — OK")


def _face_result(count: int, fraud: bool, delta: int, msg: str) -> Dict[str, Any]:
    return {
        "face_count": count,
        "fraud_detected": fraud,
        "score_delta": delta,
        "message": msg,
    }


# ──────────────────────────────────────────────────────────────────────────────
#  Voice Analysis
# ──────────────────────────────────────────────────────────────────────────────

# In-memory reference MFCCs per candidate session (reset on server restart)
_voice_reference: Dict[str, np.ndarray] = {}


def analyze_voice_segment(audio_b64: str, candidate_id: str) -> Dict[str, Any]:
    """
    Decode audio, extract MFCC features, compare with stored reference.
    First segment becomes the reference; subsequent segments are compared.
    """
    if not LIBROSA_AVAILABLE:
        # Mock — return high match most of the time
        score = round(random.uniform(0.70, 0.99), 3)
        fraud = score < VOICE_CONSISTENCY_THRESHOLD
        return _voice_result(score, fraud,
                             SCORE_TABLE["voice_mismatch"] if fraud else 0,
                             "Mocked voice analysis")

    try:
        audio_bytes = base64.b64decode(audio_b64)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        y, sr = librosa.load(tmp_path, sr=None, mono=True)
        os.unlink(tmp_path)

        if len(y) < sr * 0.5:  # less than 0.5 s — too short
            return _voice_result(1.0, False, 0, "Audio segment too short — skipped")

        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
        mean_mfcc = np.mean(mfcc, axis=1)  # shape (20,)

        if candidate_id not in _voice_reference:
            _voice_reference[candidate_id] = mean_mfcc
            return _voice_result(1.0, False, 0, "Voice reference established")

        ref = _voice_reference[candidate_id]
        # Cosine similarity
        dot = float(np.dot(mean_mfcc, ref))
        norm = float(np.linalg.norm(mean_mfcc) * np.linalg.norm(ref))
        score = max(0.0, dot / norm) if norm > 0 else 0.0
        score = round(score, 3)

        fraud = score < VOICE_CONSISTENCY_THRESHOLD
        delta = SCORE_TABLE["voice_mismatch"] if fraud else 0
        msg = ("Voice mismatch detected — possible impersonation"
               if fraud else f"Voice consistent (score {score})")
        return _voice_result(score, fraud, delta, msg)

    except Exception as exc:
        logger.error("Voice analysis error: %s", exc)
        return _voice_result(1.0, False, 0, f"Analysis error — skipped: {exc}")


def _voice_result(score: float, fraud: bool, delta: int, msg: str) -> Dict[str, Any]:
    return {
        "voice_match_score": score,
        "fraud_detected": fraud,
        "score_delta": delta,
        "message": msg,
    }


# ──────────────────────────────────────────────────────────────────────────────
#  Duplicate Face Detection (mock embeddings — swap for face_recognition on Linux)
# ──────────────────────────────────────────────────────────────────────────────

_face_db: Dict[str, List[float]] = {}  # candidate_id → embedding


def _mock_embedding(image_b64: str) -> List[float]:
    """Generate a deterministic pseudo-embedding from image hash."""
    data = base64.b64decode(image_b64 + "==")[:128]  # first 128 bytes
    seed = int.from_bytes(data[:4], "big") if len(data) >= 4 else 42
    rng = np.random.RandomState(seed)
    vec = rng.randn(128).tolist()
    norm = math.sqrt(sum(v**2 for v in vec)) or 1.0
    return [v / norm for v in vec]


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x**2 for x in a))
    nb = math.sqrt(sum(x**2 for x in b))
    return dot / (na * nb) if na * nb > 0 else 0.0


def check_duplicate_face(
    image_b64: str,
    candidate_id: str,
    db_embeddings: Optional[Dict[str, List[float]]] = None,
) -> Dict[str, Any]:
    """
    Compare candidate face embedding against stored embeddings.
    Returns duplicate flag and the most similar candidate (if any).
    """
    DUPLICATE_THRESHOLD = 0.92

    embedding = _mock_embedding(image_b64)
    store = db_embeddings if db_embeddings is not None else _face_db

    # Store for future comparisons
    store[candidate_id] = embedding

    best_match: Optional[str] = None
    best_score = 0.0
    for cid, emb in store.items():
        if cid == candidate_id:
            continue
        sim = _cosine_similarity(embedding, emb)
        if sim > best_score:
            best_score = sim
            best_match = cid

    is_duplicate = best_score >= DUPLICATE_THRESHOLD
    return {
        "is_duplicate": is_duplicate,
        "matched_candidate_id": best_match if is_duplicate else None,
        "similarity_score": round(best_score, 4),
        "score_delta": SCORE_TABLE["duplicate_face"] if is_duplicate else 0,
        "message": (
            f"Duplicate suspected — matches {best_match} ({best_score:.0%})"
            if is_duplicate else "No duplicate found"
        ),
    }


# ──────────────────────────────────────────────────────────────────────────────
#  Fraud Score Engine
# ──────────────────────────────────────────────────────────────────────────────

def compute_fraud_score(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregate a list of fraud events into a total score and risk tier.
    Each event dict must have: event_type, score_delta, timestamp_seconds (opt).
    """
    total = sum(e.get("score_delta", 0) for e in events)
    # Cap at 100 for display clarity
    display_score = min(total, 100)
    tier = get_risk_tier(total)

    breakdown: Dict[str, int] = {}
    for e in events:
        et = e.get("event_type", "unknown")
        breakdown[et] = breakdown.get(et, 0) + e.get("score_delta", 0)

    return {
        "total_score": total,
        "display_score": display_score,
        "risk_tier": tier,
        "event_count": len(events),
        "breakdown": breakdown,
    }


def generate_fraud_summary(
    candidate_id: str,
    events: List[Dict[str, Any]],
    liveness_verified: bool,
    voice_match_score: Optional[float],
    duplicate_result: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Build a complete fraud report dict ready to persist or return as JSON."""
    score_info = compute_fraud_score(events)

    # Add duplicate score if needed
    if duplicate_result and duplicate_result.get("is_duplicate"):
        score_info["total_score"] += SCORE_TABLE["duplicate_face"]
        score_info["risk_tier"] = get_risk_tier(score_info["total_score"])

    # Human-readable timeline
    timeline = []
    for e in sorted(events, key=lambda x: x.get("timestamp_seconds") or 0):
        ts = e.get("timestamp_seconds")
        minutes = int(ts // 60) if ts else 0
        seconds = int(ts % 60) if ts else 0
        timeline.append({
            "time": f"{minutes:02d}:{seconds:02d}" if ts is not None else "N/A",
            "event": e.get("event_type", "unknown"),
            "delta": e.get("score_delta", 0),
            "detail": e.get("detail", ""),
        })

    return {
        "candidate_id": candidate_id,
        "total_score": score_info["total_score"],
        "risk_tier": score_info["risk_tier"],
        "event_count": score_info["event_count"],
        "breakdown": score_info["breakdown"],
        "timeline": timeline,
        "liveness_verified": liveness_verified,
        "voice_match_score": voice_match_score,
        "duplicate_suspected": bool(duplicate_result and duplicate_result.get("is_duplicate")),
    }
