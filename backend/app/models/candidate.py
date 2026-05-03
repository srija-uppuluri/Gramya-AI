from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, index=True)
    video_path = Column(String)  # MinIO object path
    status = Column(String, default="pending")  # pending, processing, completed, failed
    score = Column(Float, nullable=True)
    transcript = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    fraud_flags = Column(String, nullable=True)  # JSON or comma-separated string
    needs_manual_review = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
