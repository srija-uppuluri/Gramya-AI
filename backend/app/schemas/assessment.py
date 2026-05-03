from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProcessVideoRequest(BaseModel):
    video_filename: str  # The filename returned from upload
    candidate_id: int

class ProcessVideoResponse(BaseModel):
    task_id: str
    message: str

class AssessmentResult(BaseModel):
    id: int
    candidate_id: int
    status: str
    score: Optional[float] = None
    transcript: Optional[str] = None
    confidence: Optional[float] = None
    fraud_flags: Optional[str] = None
    needs_manual_review: bool

    class Config:
        from_attributes = True

class CandidateResponse(BaseModel):
    id: int
    name: str
    email: str
    
    class Config:
        from_attributes = True
