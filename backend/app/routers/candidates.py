from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.candidate import Candidate, Assessment
from app.schemas.assessment import AssessmentResult, CandidateResponse

router = APIRouter()

@router.get("/results/{candidate_id}", response_model=List[AssessmentResult])
def get_results(candidate_id: int, db: Session = Depends(get_db)):
    """
    Get all assessment results for a specific candidate.
    """
    assessments = db.query(Assessment).filter(Assessment.candidate_id == candidate_id).all()
    if not assessments:
        raise HTTPException(status_code=404, detail="No assessments found for this candidate")
    return assessments

@router.get("/candidates")
def get_candidates(
    score_gte: Optional[float] = Query(None, description="Filter by minimum score"),
    status: Optional[str] = Query(None, description="Filter by assessment status"),
    db: Session = Depends(get_db)
):
    """
    Filter candidates by score and status.
    """
    query = db.query(Candidate, Assessment).join(Assessment, Candidate.id == Assessment.candidate_id)
    
    if score_gte is not None:
        query = query.filter(Assessment.score >= score_gte)
    if status is not None:
        query = query.filter(Assessment.status == status)
        
    results = query.all()
    
    response = []
    for cand, assm in results:
        response.append({
            "candidate_id": cand.id,
            "name": cand.name,
            "email": cand.email,
            "assessment_id": assm.id,
            "status": assm.status,
            "score": assm.score,
            "fraud_flags": assm.fraud_flags
        })
        
    return response
