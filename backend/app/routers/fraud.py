"""
fraud.py — Fraud Detection API Router
======================================
Endpoints:
  POST /api/v1/fraud/analyze-face        — analyze a webcam frame
  POST /api/v1/fraud/voice-analysis      — analyze audio chunk
  POST /api/v1/fraud/log-event           — log a client-side event
  POST /api/v1/fraud/fraud-check         — run full fraud check at end
  GET  /api/v1/fraud/report/{id}         — get full report (admin)
  GET  /api/v1/fraud/alerts              — list all flagged candidates (admin)
  PATCH /api/v1/fraud/report/{id}/review — mark as reviewed (admin)
"""

import json
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.fraud_models import FraudEvent, FraudReport, FaceEmbedding
from app.schemas.fraud_schemas import (
    FaceAnalysisRequest, FaceAnalysisResponse,
    VoiceAnalysisRequest, VoiceAnalysisResponse,
    FraudEventLog, FraudEventResponse,
    FraudCheckRequest, FraudReportResponse, FraudAlertSummary,
    ReviewUpdateRequest,
)
from app.services import fraud_service

router = APIRouter(prefix="/fraud", tags=["Fraud Detection"])
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────
#  1. Analyze a webcam frame for faces
# ─────────────────────────────────────────────────────────────────
@router.post("/analyze-face", response_model=FaceAnalysisResponse)
def analyze_face(payload: FaceAnalysisRequest, db: Session = Depends(get_db)):
    """Detect faces in a base64-encoded image frame."""
    result = fraud_service.analyze_face_frame(payload.image_b64)

    # Persist as event if fraud detected
    if result["fraud_detected"] and result["score_delta"] > 0:
        event_type = "multiple_faces" if result["face_count"] > 1 else "face_absent"
        _log_event_to_db(
            db=db,
            candidate_id=payload.candidate_id,
            session_id=payload.session_id,
            event_type=event_type,
            score_delta=result["score_delta"],
            timestamp_seconds=payload.timestamp_seconds,
            metadata={"face_count": result["face_count"]},
        )

    return FaceAnalysisResponse(**result)


# ─────────────────────────────────────────────────────────────────
#  2. Analyze audio for voice consistency
# ─────────────────────────────────────────────────────────────────
@router.post("/voice-analysis", response_model=VoiceAnalysisResponse)
def voice_analysis(payload: VoiceAnalysisRequest, db: Session = Depends(get_db)):
    """Analyze an audio chunk for voice consistency using MFCC."""
    result = fraud_service.analyze_voice_segment(
        payload.audio_b64, payload.candidate_id
    )

    if result["fraud_detected"]:
        _log_event_to_db(
            db=db,
            candidate_id=payload.candidate_id,
            session_id=payload.session_id,
            event_type="voice_mismatch",
            score_delta=result["score_delta"],
            timestamp_seconds=payload.timestamp_seconds,
            metadata={"voice_match_score": result["voice_match_score"]},
        )

    return VoiceAnalysisResponse(**result)


# ─────────────────────────────────────────────────────────────────
#  3. Log a client-side fraud event
# ─────────────────────────────────────────────────────────────────
@router.post("/log-event", response_model=FraudEventResponse)
def log_fraud_event(payload: FraudEventLog, db: Session = Depends(get_db)):
    """Log a client-detected event (tab switch, fullscreen exit, liveness fail, etc.)."""
    # Use default score from table if not provided
    score = payload.score_delta or fraud_service.SCORE_TABLE.get(payload.event_type, 5)

    event = _log_event_to_db(
        db=db,
        candidate_id=payload.candidate_id,
        session_id=payload.session_id,
        event_type=payload.event_type,
        score_delta=score,
        timestamp_seconds=payload.timestamp_seconds,
        metadata=payload.metadata,
    )
    return FraudEventResponse(
        id=event.id,
        candidate_id=event.candidate_id,
        event_type=event.event_type,
        score_delta=event.score_delta,
        timestamp_seconds=event.timestamp_seconds,
        created_at=event.created_at,
    )


# ─────────────────────────────────────────────────────────────────
#  4. Full fraud check — run at interview end
# ─────────────────────────────────────────────────────────────────
@router.post("/fraud-check", response_model=FraudReportResponse)
def full_fraud_check(payload: FraudCheckRequest, db: Session = Depends(get_db)):
    """Compile all events, run duplicate check, compute final fraud score."""

    # Persist any remaining inline events
    for ev in payload.events:
        _log_event_to_db(
            db=db,
            candidate_id=payload.candidate_id,
            session_id=payload.session_id,
            event_type=ev.event_type,
            score_delta=ev.score_delta or fraud_service.SCORE_TABLE.get(ev.event_type, 5),
            timestamp_seconds=ev.timestamp_seconds,
            metadata=ev.metadata,
        )

    # Fetch all events from DB for this candidate
    db_events = (
        db.query(FraudEvent)
        .filter(FraudEvent.candidate_id == payload.candidate_id)
        .all()
    )
    events_list = [
        {
            "event_type": e.event_type,
            "score_delta": e.score_delta,
            "timestamp_seconds": e.timestamp_seconds,
            "detail": e.metadata_json or "",
        }
        for e in db_events
    ]

    # Duplicate face check
    duplicate_result = None
    if payload.face_image_b64:
        # Load existing embeddings from DB
        stored = {
            row.candidate_id: json.loads(row.embedding_json)
            for row in db.query(FaceEmbedding).all()
        }
        duplicate_result = fraud_service.check_duplicate_face(
            payload.face_image_b64, payload.candidate_id, stored
        )
        # Store the new embedding
        existing_emb = (
            db.query(FaceEmbedding)
            .filter(FaceEmbedding.candidate_id == payload.candidate_id)
            .first()
        )
        new_emb_json = json.dumps(stored.get(payload.candidate_id, []))
        if existing_emb:
            existing_emb.embedding_json = new_emb_json
        else:
            db.add(FaceEmbedding(
                candidate_id=payload.candidate_id,
                embedding_json=new_emb_json,
            ))

        if duplicate_result.get("is_duplicate"):
            _log_event_to_db(
                db=db,
                candidate_id=payload.candidate_id,
                session_id=payload.session_id,
                event_type="duplicate_face",
                score_delta=duplicate_result["score_delta"],
                timestamp_seconds=None,
                metadata={"matched": duplicate_result.get("matched_candidate_id")},
            )
            events_list.append({
                "event_type": "duplicate_face",
                "score_delta": duplicate_result["score_delta"],
                "timestamp_seconds": None,
                "detail": duplicate_result.get("message", ""),
            })

    # Generate summary
    summary = fraud_service.generate_fraud_summary(
        candidate_id=payload.candidate_id,
        events=events_list,
        liveness_verified=payload.liveness_verified,
        voice_match_score=payload.voice_match_score,
        duplicate_result=duplicate_result,
    )

    # Upsert FraudReport
    report = (
        db.query(FraudReport)
        .filter(FraudReport.candidate_id == payload.candidate_id)
        .first()
    )
    if report:
        report.total_score = summary["total_score"]
        report.risk_tier = summary["risk_tier"]
        report.event_count = summary["event_count"]
        report.events_json = json.dumps(summary["timeline"])
        report.liveness_verified = summary["liveness_verified"]
        report.voice_match_score = summary["voice_match_score"]
        report.duplicate_suspected = summary["duplicate_suspected"]
    else:
        report = FraudReport(
            candidate_id=payload.candidate_id,
            total_score=summary["total_score"],
            risk_tier=summary["risk_tier"],
            event_count=summary["event_count"],
            events_json=json.dumps(summary["timeline"]),
            liveness_verified=summary["liveness_verified"],
            voice_match_score=summary["voice_match_score"],
            duplicate_suspected=summary["duplicate_suspected"],
        )
        db.add(report)

    db.commit()
    db.refresh(report)

    return FraudReportResponse(
        candidate_id=report.candidate_id,
        total_score=report.total_score,
        risk_tier=report.risk_tier,
        event_count=report.event_count,
        events=summary["timeline"],
        liveness_verified=report.liveness_verified,
        voice_match_score=report.voice_match_score,
        duplicate_suspected=report.duplicate_suspected,
        reviewed=report.reviewed,
        reviewer_notes=report.reviewer_notes,
        created_at=report.created_at,
    )


# ─────────────────────────────────────────────────────────────────
#  5. Get report for a single candidate (Admin)
# ─────────────────────────────────────────────────────────────────
@router.get("/report/{candidate_id}", response_model=FraudReportResponse)
def get_fraud_report(candidate_id: str, db: Session = Depends(get_db)):
    """Retrieve the full fraud report for a candidate."""
    report = (
        db.query(FraudReport)
        .filter(FraudReport.candidate_id == candidate_id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="No fraud report found for this candidate")

    events = json.loads(report.events_json) if report.events_json else []
    return FraudReportResponse(
        candidate_id=report.candidate_id,
        total_score=report.total_score,
        risk_tier=report.risk_tier,
        event_count=report.event_count,
        events=events,
        liveness_verified=report.liveness_verified,
        voice_match_score=report.voice_match_score,
        duplicate_suspected=report.duplicate_suspected,
        reviewed=report.reviewed,
        reviewer_notes=report.reviewer_notes,
        created_at=report.created_at,
    )


# ─────────────────────────────────────────────────────────────────
#  6. List all fraud alerts (Admin dashboard)
# ─────────────────────────────────────────────────────────────────
@router.get("/alerts", response_model=List[FraudAlertSummary])
def get_fraud_alerts(
    risk_tier: Optional[str] = Query(None, description="Filter: safe | review | high_risk"),
    reviewed: Optional[bool] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    """List all candidates with fraud reports, optionally filtered."""
    query = db.query(FraudReport)
    if risk_tier:
        query = query.filter(FraudReport.risk_tier == risk_tier)
    if reviewed is not None:
        query = query.filter(FraudReport.reviewed == reviewed)

    reports = query.order_by(FraudReport.total_score.desc()).limit(limit).all()
    return [
        FraudAlertSummary(
            candidate_id=r.candidate_id,
            total_score=r.total_score,
            risk_tier=r.risk_tier,
            event_count=r.event_count,
            duplicate_suspected=r.duplicate_suspected,
            reviewed=r.reviewed,
            created_at=r.created_at,
        )
        for r in reports
    ]


# ─────────────────────────────────────────────────────────────────
#  7. Mark report as reviewed (Admin action)
# ─────────────────────────────────────────────────────────────────
@router.patch("/report/{candidate_id}/review")
def review_report(
    candidate_id: str,
    payload: ReviewUpdateRequest,
    db: Session = Depends(get_db),
):
    """Admin marks a fraud report as reviewed with optional notes."""
    report = (
        db.query(FraudReport)
        .filter(FraudReport.candidate_id == candidate_id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.reviewed = payload.reviewed
    report.reviewer_notes = payload.reviewer_notes
    db.commit()
    return {"message": "Report updated", "candidate_id": candidate_id, "reviewed": payload.reviewed}


# ─────────────────────────────────────────────────────────────────
#  Helper
# ─────────────────────────────────────────────────────────────────
def _log_event_to_db(
    db: Session,
    candidate_id: str,
    session_id: Optional[str],
    event_type: str,
    score_delta: int,
    timestamp_seconds: Optional[float],
    metadata: Optional[dict],
) -> FraudEvent:
    event = FraudEvent(
        candidate_id=candidate_id,
        session_id=session_id,
        event_type=event_type,
        score_delta=score_delta,
        timestamp_seconds=timestamp_seconds,
        metadata_json=json.dumps(metadata) if metadata else None,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
