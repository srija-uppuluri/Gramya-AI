"""
smart_jobs.py
--------------
FastAPI router for the AI Smart Job Assistant:

  POST /api/v1/voice-job-suggestions      — audio or text → ranked jobs + TTS
  GET  /api/v1/nearby-jobs                — GPS coords → nearby jobs with distance
  GET  /api/v1/skill-gap/{job_id}         — candidate skills vs job requirements
  GET  /api/v1/ai-suggested-jobs          — AI ranked + optional category filter
"""

import io
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, Form, Query, HTTPException
from pydantic import BaseModel

from app.services.job_service import (
    JOB_CATALOG,
    CATEGORY_KEYWORDS,
    rank_jobs_by_skills,
    extract_job_intent,
    get_skill_gap,
    haversine_km,
    filter_by_category,
)
from app.services.bhashini_service import (
    transcribe_kannada,
    synthesize_kannada,
    build_kannada_response,
)

router = APIRouter(tags=["Smart Jobs"])



# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────

class JobOut(BaseModel):
    id: int
    title: str
    type: str
    location: str
    lat: float
    lng: float
    salary: str
    description: str
    tags: List[str]
    openings: int
    match_score: int
    distance_km: Optional[float]
    missing_skills: List[str]
    skill_gap_suggestion: str

    class Config:
        from_attributes = True


class VoiceJobResponse(BaseModel):
    transcript: str
    detected_skills: List[str]
    jobs: List[JobOut]
    tts_audio_base64: Optional[str]   # Bhashini TTS WAV in base64
    kannada_response_text: str


class NearbyJobsResponse(BaseModel):
    jobs: List[JobOut]
    total: int


class SkillGapResponse(BaseModel):
    job_id: int
    job_title: str
    candidate_skills: List[str]
    required_skills: List[str]
    missing_skills: List[str]
    suggestion: str
    match_score: int


# ─────────────────────────────────────────────────────────────────────────────
# 1. POST /voice-job-suggestions
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/voice-job-suggestions", response_model=VoiceJobResponse)
async def voice_job_suggestions(
    audio: Optional[UploadFile] = File(None, description="WAV/MP3 audio file (optional)"),
    text_input: Optional[str] = Form(None, description="Spoken text already transcribed by browser"),
    user_lat: Optional[float] = Form(None),
    user_lng: Optional[float] = Form(None),
    interview_score: float = Form(7.0),
):
    """
    Accept either an audio file OR a pre-transcribed text string.
    Returns ranked job suggestions, Bhashini TTS audio, and Kannada summary.
    """
    # Step 1 — Transcription
    if text_input:
        transcript = text_input
    elif audio is not None:
        audio_bytes = await audio.read()
        transcript = transcribe_kannada(audio_bytes)
    else:
        raise HTTPException(status_code=422, detail="Provide either 'audio' file or 'text_input' field.")

    # Step 2 — Intent extraction + job ranking
    detected_skills, ranked_jobs = extract_job_intent(transcript)

    # Re-rank with distance if GPS provided
    if user_lat is not None and user_lng is not None:
        ranked_jobs = rank_jobs_by_skills(
            detected_skills,
            jobs=JOB_CATALOG,
            user_lat=user_lat,
            user_lng=user_lng,
            interview_score=interview_score,
        )

    # Top 6
    top_jobs = ranked_jobs[:6]

    # Step 3 — Bhashini TTS response
    top_title = top_jobs[0]["title"] if top_jobs else "No matching job"
    kannada_text = build_kannada_response(len(top_jobs), top_title)
    tts_audio = synthesize_kannada(kannada_text)

    return VoiceJobResponse(
        transcript=transcript,
        detected_skills=detected_skills,
        jobs=[JobOut(**j) for j in top_jobs],
        tts_audio_base64=tts_audio,
        kannada_response_text=kannada_text,
    )


# ─────────────────────────────────────────────────────────────────────────────
# 2. GET /nearby-jobs
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/nearby-jobs", response_model=NearbyJobsResponse)
def nearby_jobs(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    radius_km: float = Query(500.0, description="Search radius in km"),
    job_type: Optional[str] = Query(None, description="'government' or 'private'"),
    min_match: Optional[int] = Query(None, description="Minimum match score (0-100)"),
    user_skills: Optional[str] = Query(None, description="Comma-separated user skills"),
    interview_score: float = Query(7.0),
):
    """
    Return jobs within radius_km of the user's GPS location,
    sorted by distance, optionally filtered by type and match score.
    """
    skills = [s.strip() for s in user_skills.split(",")] if user_skills else ["general"]

    ranked = rank_jobs_by_skills(
        skills,
        jobs=JOB_CATALOG,
        user_lat=lat,
        user_lng=lng,
        interview_score=interview_score,
    )

    # Filter by radius
    result = []
    for job in ranked:
        dist = haversine_km(lat, lng, job["lat"], job["lng"])
        job["distance_km"] = round(dist, 1)
        if dist <= radius_km:
            if job_type and job["type"] != job_type:
                continue
            if min_match and job["match_score"] < min_match:
                continue
            result.append(JobOut(**job))

    return NearbyJobsResponse(jobs=result, total=len(result))


# ─────────────────────────────────────────────────────────────────────────────
# 3. GET /skill-gap/{job_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/skill-gap/{job_id}", response_model=SkillGapResponse)
def skill_gap_analysis(
    job_id: int,
    candidate_skills: str = Query(..., description="Comma-separated candidate skills"),
    interview_score: float = Query(7.0),
):
    """
    Compare candidate skills against the target job's required skills.
    Returns missing skills and an actionable improvement suggestion.
    """
    job = next((j for j in JOB_CATALOG if j["id"] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")

    skills = [s.strip() for s in candidate_skills.split(",") if s.strip()]
    gap = get_skill_gap(skills, job["required_skills"])

    # Rough match score (skill overlap %)
    required_set = set(job["required_skills"])
    user_set = set(s.lower() for s in skills)
    overlap = len(required_set & user_set)
    match_pct = round((overlap / len(required_set)) * 100) if required_set else 100

    return SkillGapResponse(
        job_id=job_id,
        job_title=job["title"],
        candidate_skills=skills,
        required_skills=job["required_skills"],
        missing_skills=gap["missing"],
        suggestion=gap["suggestion"],
        match_score=match_pct,
    )


# ─────────────────────────────────────────────────────────────────────────────
# 4. GET /ai-suggested-jobs  (category filter + AI ranking)
# ─────────────────────────────────────────────────────────────────────────────

class SuggestedJobOut(BaseModel):
    id: int
    title: str
    type: str
    category: str
    location: str
    salary: str
    tags: List[str]
    openings: int
    match_score: int
    ai_reason: str
    missing_skills: List[str]
    skill_gap_suggestion: str

    class Config:
        from_attributes = True


class SuggestedJobsResponse(BaseModel):
    category: Optional[str]
    total: int
    jobs: List[SuggestedJobOut]
    available_categories: List[str]


@router.get("/ai-suggested-jobs", response_model=SuggestedJobsResponse)
def ai_suggested_jobs(
    category: Optional[str] = Query(None, description="Category slug: electrician | plumber | driver | …"),
    candidate_skills: Optional[str] = Query("general,communication", description="Comma-separated skills"),
    interview_score: float = Query(7.0, description="Interview score 0-10"),
    job_type: Optional[str] = Query(None, description="'government' or 'private'"),
    limit: int = Query(12, description="Max jobs to return"),
):
    """
    AI-powered job suggestions with optional category filtering.
    Steps:
      1. Filter by category (if provided)
      2. Filter by job_type (if provided)
      3. Apply AI ranking (sentence-transformers)
      4. Return top `limit` jobs with match_score and skill gap
    """
    skills = [s.strip() for s in (candidate_skills or "general").split(",") if s.strip()]

    # Step 1: Category filter
    pool = filter_by_category(JOB_CATALOG, category) if category else list(JOB_CATALOG)

    # Step 2: Job type filter
    if job_type:
        pool = [j for j in pool if j["type"] == job_type.lower()]

    if not pool:
        return SuggestedJobsResponse(
            category=category,
            total=0,
            jobs=[],
            available_categories=list(CATEGORY_KEYWORDS.keys()),
        )

    # Step 3: AI ranking
    ranked = rank_jobs_by_skills(skills, jobs=pool, interview_score=interview_score)

    # Step 4: Build response — fill in ai_reason from catalog if not present
    result = []
    for job in ranked[:limit]:
        ai_reason = job.get("ai_reason") or f"Matched skills: {', '.join(job['required_skills'][:3])}"
        result.append(SuggestedJobOut(
            id=job["id"],
            title=job["title"],
            type=job["type"],
            category=job.get("category", "general"),
            location=job["location"],
            salary=job["salary"],
            tags=job["tags"],
            openings=job["openings"],
            match_score=job["match_score"],
            ai_reason=ai_reason,
            missing_skills=job.get("missing_skills", []),
            skill_gap_suggestion=job.get("skill_gap_suggestion", ""),
        ))

    return SuggestedJobsResponse(
        category=category,
        total=len(result),
        jobs=result,
        available_categories=list(CATEGORY_KEYWORDS.keys()),
    )


# ─────────────────────────────────────────────────────────────────────────────
# 5. GET /categories  — list all available categories with job counts
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/categories")
def get_categories():
    """Return all job categories with count and icon."""
    ICONS = {
        "electrician": "🔌", "plumber": "🚰", "driver": "🚗",
        "teaching": "📚", "healthcare": "🏥", "farming": "🌾",
        "mechanic": "🔧", "computer": "💻", "childcare": "👶",
        "administration": "🏛️",
    }
    cats = {}
    for job in JOB_CATALOG:
        c = job.get("category", "other")
        cats[c] = cats.get(c, 0) + 1

    return [
        {"slug": cat, "label": cat.title(), "icon": ICONS.get(cat, "💼"), "count": count}
        for cat, count in sorted(cats.items(), key=lambda x: -x[1])
    ]

