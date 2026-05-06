from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class FraudEvent(Base):
    """Individual fraud event logged during an interview session."""
    __tablename__ = "fraud_events"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(String, index=True, nullable=False)
    session_id = Column(String, index=True, nullable=True)
    event_type = Column(String, nullable=False)   # e.g. "multiple_faces", "tab_switch"
    score_delta = Column(Integer, default=0)       # fraud points added
    timestamp_seconds = Column(Float, nullable=True)  # seconds into interview
    metadata_json = Column(Text, nullable=True)    # extra detail as JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FraudReport(Base):
    """Aggregated fraud report created at interview end."""
    __tablename__ = "fraud_reports"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(String, unique=True, index=True, nullable=False)
    total_score = Column(Integer, default=0)
    risk_tier = Column(String, default="safe")         # "safe", "review", "high_risk"
    event_count = Column(Integer, default=0)
    events_json = Column(Text, nullable=True)          # full event list as JSON
    liveness_verified = Column(Boolean, default=False)
    voice_match_score = Column(Float, nullable=True)
    duplicate_suspected = Column(Boolean, default=False)
    reviewed = Column(Boolean, default=False)
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class FaceEmbedding(Base):
    """Stored face embeddings for duplicate detection."""
    __tablename__ = "face_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(String, unique=True, index=True, nullable=False)
    embedding_json = Column(Text, nullable=False)   # JSON-serialized float list
    created_at = Column(DateTime(timezone=True), server_default=func.now())
