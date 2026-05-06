from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ─────────────────────────────────────────────
#  Request Schemas
# ─────────────────────────────────────────────

class FaceAnalysisRequest(BaseModel):
    candidate_id: str
    session_id: Optional[str] = None
    image_b64: str = Field(..., description="Base64-encoded JPEG/PNG frame")
    timestamp_seconds: Optional[float] = None


class VoiceAnalysisRequest(BaseModel):
    candidate_id: str
    session_id: Optional[str] = None
    audio_b64: str = Field(..., description="Base64-encoded audio chunk (wav/webm)")
    timestamp_seconds: Optional[float] = None


class FraudEventLog(BaseModel):
    candidate_id: str
    session_id: Optional[str] = None
    event_type: str = Field(..., description=(
        "One of: tab_switch, fullscreen_exit, face_absent, "
        "multiple_faces, liveness_failed, voice_mismatch, duplicate_face"
    ))
    score_delta: int = Field(default=0, ge=0)
    timestamp_seconds: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


class FraudCheckRequest(BaseModel):
    candidate_id: str
    session_id: Optional[str] = None
    events: List[FraudEventLog] = []
    face_image_b64: Optional[str] = None   # final frame for duplicate check
    liveness_verified: bool = False
    voice_match_score: Optional[float] = None


class ReviewUpdateRequest(BaseModel):
    reviewed: bool = True
    reviewer_notes: Optional[str] = None


# ─────────────────────────────────────────────
#  Response Schemas
# ─────────────────────────────────────────────

class FaceAnalysisResponse(BaseModel):
    face_count: int
    fraud_detected: bool
    score_delta: int
    message: str


class VoiceAnalysisResponse(BaseModel):
    voice_match_score: float        # 0.0 – 1.0
    fraud_detected: bool
    score_delta: int
    message: str


class FraudEventResponse(BaseModel):
    id: int
    candidate_id: str
    event_type: str
    score_delta: int
    timestamp_seconds: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class FraudReportResponse(BaseModel):
    candidate_id: str
    total_score: int
    risk_tier: str                  # safe | review | high_risk
    event_count: int
    events: List[Dict[str, Any]]
    liveness_verified: bool
    voice_match_score: Optional[float]
    duplicate_suspected: bool
    reviewed: bool
    reviewer_notes: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class FraudAlertSummary(BaseModel):
    candidate_id: str
    total_score: int
    risk_tier: str
    event_count: int
    duplicate_suspected: bool
    reviewed: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
