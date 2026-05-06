"""
job_service.py
--------------
Core business logic for the Smart Job Assistant module:
  - Job catalog (seeded, no DB required)
  - Semantic ranking via sentence-transformers
  - Haversine distance calculation
  - Kannada / English intent extraction (keyword heuristics)
  - Skill-gap analysis
"""

import math
from typing import List, Dict, Any, Tuple

# ── Lazy-load model to avoid slow cold start on import ───────────────────────
_model = None

def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


# ─────────────────────────────────────────────────────────────────────────────
# JOB CATALOG  (10 rural-India–focused jobs with geo coords)
# ─────────────────────────────────────────────────────────────────────────────

JOB_CATALOG: List[Dict[str, Any]] = [
    # ── Teaching ──────────────────────────────────────────────────────────────
    {
        "id": 1, "title": "Government School Teacher", "type": "government",
        "category": "teaching",
        "required_skills": ["teaching", "communication", "hindi", "education", "patience"],
        "location": "Varanasi, UP", "lat": 25.3176, "lng": 82.9739,
        "salary": "₹28,000–₹35,000/mo", "description": "Teach primary school students in government-run schools.",
        "tags": ["Teaching", "Hindi", "Government"], "openings": 15, "top_match": True,
        "ai_reason": "Strong communication & education match from interview.",
    },
    # ── Electrician ───────────────────────────────────────────────────────────
    {
        "id": 2, "title": "Electrician / Wiring Technician", "type": "private",
        "category": "electrician",
        "required_skills": ["electrical", "wiring", "circuit", "tools", "safety"],
        "location": "Bengaluru Rural, KA", "lat": 13.0012, "lng": 77.5667,
        "salary": "₹18,000–₹25,000/mo", "description": "Install and maintain electrical wiring in residential & commercial sites.",
        "tags": ["Electrical", "Wiring", "Private"], "openings": 8, "top_match": False,
        "ai_reason": "Electrical aptitude and tool knowledge detected.",
    },
    {
        "id": 11, "title": "Electrician Helper", "type": "private",
        "category": "electrician",
        "required_skills": ["electrical", "wiring", "tools", "safety", "helper"],
        "location": "Mysuru, KA", "lat": 12.2958, "lng": 76.6394,
        "salary": "₹10,000–₹14,000/mo", "description": "Assist senior electricians on residential and commercial projects.",
        "tags": ["Electrical", "Helper", "Private"], "openings": 20, "top_match": False,
        "ai_reason": "Entry-level electrical role matching your tools experience.",
    },
    {
        "id": 12, "title": "Electrical Maintenance Worker", "type": "government",
        "category": "electrician",
        "required_skills": ["electrical", "maintenance", "circuit", "safety", "panel"],
        "location": "Pune, MH", "lat": 18.5204, "lng": 73.8567,
        "salary": "₹16,000–₹22,000/mo", "description": "Maintain electrical systems in government buildings and infrastructure.",
        "tags": ["Electrical", "Maintenance", "Government"], "openings": 12, "top_match": False,
        "ai_reason": "Maintenance + electrical skills are a strong match.",
    },
    {
        "id": 13, "title": "Solar Panel Electrician", "type": "private",
        "category": "electrician",
        "required_skills": ["solar", "electrical", "wiring", "installation", "safety"],
        "location": "Jodhpur, RJ", "lat": 26.2389, "lng": 73.0243,
        "salary": "₹15,000–₹21,000/mo", "description": "Install and wire rooftop solar panels under PM Surya Ghar scheme.",
        "tags": ["Solar", "Electrical", "Private"], "openings": 35, "top_match": False,
        "ai_reason": "Combines electrical and solar installation skills.",
    },
    # ── Plumber ───────────────────────────────────────────────────────────────
    {
        "id": 14, "title": "Plumber (Residential)", "type": "private",
        "category": "plumber",
        "required_skills": ["plumbing", "pipe fitting", "tools", "leak repair", "water supply"],
        "location": "Bengaluru, KA", "lat": 12.9716, "lng": 77.5946,
        "salary": "₹14,000–₹22,000/mo", "description": "Install and repair water supply pipes in homes and apartments.",
        "tags": ["Plumbing", "Residential", "Private"], "openings": 18, "top_match": False,
        "ai_reason": "Pipe fitting and leak repair skills matched your profile.",
    },
    {
        "id": 15, "title": "Plumber Helper / Apprentice", "type": "private",
        "category": "plumber",
        "required_skills": ["plumbing", "tools", "helper", "pipe fitting", "physical fitness"],
        "location": "Nashik, MH", "lat": 19.9975, "lng": 73.7898,
        "salary": "₹8,000–₹12,000/mo", "description": "Assist senior plumber on residential and commercial plumbing projects.",
        "tags": ["Plumbing", "Helper", "Private"], "openings": 25, "top_match": False,
        "ai_reason": "Great entry-level role for someone with basic plumbing exposure.",
    },
    {
        "id": 16, "title": "Municipal Plumber", "type": "government",
        "category": "plumber",
        "required_skills": ["plumbing", "sewage", "water supply", "maintenance", "tools"],
        "location": "Raipur, CG", "lat": 21.2514, "lng": 81.6296,
        "salary": "₹18,000–₹26,000/mo", "description": "Maintain municipal water supply and sewage systems under local body.",
        "tags": ["Plumbing", "Government", "Municipal"], "openings": 10, "top_match": False,
        "ai_reason": "Government plumbing role — stable income with benefits.",
    },
    {
        "id": 17, "title": "Pipeline Repair Technician", "type": "private",
        "category": "plumber",
        "required_skills": ["plumbing", "pipeline", "repair", "tools", "water supply"],
        "location": "Hubli, KA", "lat": 15.3647, "lng": 75.1240,
        "salary": "₹13,000–₹19,000/mo", "description": "Diagnose and repair pipeline issues for a construction company.",
        "tags": ["Plumbing", "Pipeline", "Repair"], "openings": 8, "top_match": False,
        "ai_reason": "Pipeline repair needs match your tools and repair skills.",
    },
    # ── Driver ────────────────────────────────────────────────────────────────
    {
        "id": 18, "title": "Light Motor Vehicle Driver", "type": "private",
        "category": "driver",
        "required_skills": ["driving", "lmv license", "traffic rules", "navigation", "vehicle maintenance"],
        "location": "Bengaluru, KA", "lat": 12.9716, "lng": 77.5946,
        "salary": "₹14,000–₹20,000/mo", "description": "Drive company vehicles for employee transport and deliveries.",
        "tags": ["Driving", "LMV", "Private"], "openings": 30, "top_match": False,
        "ai_reason": "LMV license and navigation skills matched this role.",
    },
    {
        "id": 19, "title": "Ambulance Driver", "type": "government",
        "category": "driver",
        "required_skills": ["driving", "lmv license", "first aid", "navigation", "calm under pressure"],
        "location": "Raipur, CG", "lat": 21.2514, "lng": 81.6296,
        "salary": "₹16,000–₹22,000/mo", "description": "Drive 108 emergency ambulance under state health department.",
        "tags": ["Driving", "Government", "Healthcare"], "openings": 15, "top_match": False,
        "ai_reason": "Combines driving + first aid — government job with stability.",
    },
    {
        "id": 20, "title": "School Bus Driver", "type": "government",
        "category": "driver",
        "required_skills": ["driving", "hmv license", "traffic rules", "child safety", "navigation"],
        "location": "Varanasi, UP", "lat": 25.3176, "lng": 82.9739,
        "salary": "₹12,000–₹18,000/mo", "description": "Drive school buses safely to transport children under municipal board.",
        "tags": ["Driving", "Government", "School"], "openings": 12, "top_match": False,
        "ai_reason": "HMV license and safe driving skills are a great match.",
    },
    {
        "id": 21, "title": "Delivery / Logistics Driver", "type": "private",
        "category": "driver",
        "required_skills": ["driving", "lmv license", "delivery", "navigation", "time management"],
        "location": "Pune, MH", "lat": 18.5204, "lng": 73.8567,
        "salary": "₹12,000–₹18,000/mo", "description": "Deliver goods and packages for an e-commerce logistics company.",
        "tags": ["Driving", "Delivery", "Private"], "openings": 50, "top_match": False,
        "ai_reason": "High demand role — delivery driving matches your license.",
    },
    # ── Other ─────────────────────────────────────────────────────────────────
    {
        "id": 3, "title": "ASHA Health Worker", "type": "government",
        "category": "healthcare",
        "required_skills": ["healthcare", "community", "awareness", "communication", "first aid"],
        "location": "Raipur, CG", "lat": 21.2514, "lng": 81.6296,
        "salary": "₹15,000–₹20,000/mo", "description": "Promote health awareness and access to government health schemes.",
        "tags": ["Healthcare", "Community", "Government"], "openings": 22, "top_match": False,
        "ai_reason": "Community engagement & communication skills match.",
    },
    {
        "id": 4, "title": "Dairy Farm Supervisor", "type": "government",
        "category": "farming",
        "required_skills": ["farming", "livestock", "dairy", "management", "animal care"],
        "location": "Mehsana, GJ", "lat": 23.5880, "lng": 72.3693,
        "salary": "₹18,000–₹22,000/mo", "description": "Oversee dairy operations, milk collection, and quality checks.",
        "tags": ["Farming", "Livestock", "Dairy"], "openings": 5, "top_match": False,
        "ai_reason": "Rural farming background aligns with dairy supervision.",
    },
    {
        "id": 6, "title": "Gram Panchayat Secretary", "type": "government",
        "category": "administration",
        "required_skills": ["administration", "record keeping", "leadership", "government", "computer"],
        "location": "Nashik, MH", "lat": 19.9975, "lng": 73.7898,
        "salary": "₹22,000–₹30,000/mo", "description": "Maintain panchayat records and coordinate governance activities.",
        "tags": ["Administration", "Government", "Leadership"], "openings": 4, "top_match": False,
        "ai_reason": "Administrative aptitude and leadership score matched.",
    },
    {
        "id": 7, "title": "Computer Operator (CSC)", "type": "government",
        "category": "computer",
        "required_skills": ["computer", "typing", "data entry", "internet", "ms office"],
        "location": "Mysuru, KA", "lat": 12.2958, "lng": 76.6394,
        "salary": "₹12,000–₹16,000/mo", "description": "Operate Common Service Centre for digital government services.",
        "tags": ["Computer", "Data Entry", "Government"], "openings": 12, "top_match": False,
        "ai_reason": "Computer & typing skills from your form profile.",
    },
    {
        "id": 9, "title": "Anganwadi Worker", "type": "government",
        "category": "childcare",
        "required_skills": ["childcare", "nutrition", "community", "communication", "teaching"],
        "location": "Hubli, KA", "lat": 15.3647, "lng": 75.1240,
        "salary": "₹10,000–₹14,000/mo", "description": "Care for children under 6, provide nutrition counselling.",
        "tags": ["Childcare", "Nutrition", "Government"], "openings": 18, "top_match": False,
        "ai_reason": "Teaching and community skills make this a great fit.",
    },
    {
        "id": 10, "title": "Two-Wheeler Mechanic", "type": "private",
        "category": "mechanic",
        "required_skills": ["mechanic", "engine", "tools", "repair", "motorcycle"],
        "location": "Belgaum, KA", "lat": 15.8497, "lng": 74.4977,
        "salary": "₹12,000–₹18,000/mo", "description": "Service and repair two-wheelers at a local workshop.",
        "tags": ["Mechanic", "Repair", "Private"], "openings": 6, "top_match": False,
        "ai_reason": "Engine repair and tools experience detected.",
    },
]

# ── Category keyword map (for fast text-based filtering) ─────────────────────
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "electrician": ["electrician", "electrical", "wiring", "circuit", "solar electrician"],
    "plumber":     ["plumber", "plumbing", "pipe", "pipeline", "sewage", "water supply"],
    "driver":      ["driver", "driving", "vehicle", "lmv", "hmv", "ambulance", "bus"],
    "teaching":    ["teacher", "teaching", "school", "education"],
    "healthcare":  ["health", "asha", "nurse", "hospital", "doctor"],
    "farming":     ["farmer", "farm", "dairy", "livestock"],
    "mechanic":    ["mechanic", "repair", "engine", "motorcycle"],
    "computer":    ["computer", "typing", "data entry"],
    "childcare":   ["childcare", "anganwadi", "nutrition"],
    "administration": ["secretary", "panchayat", "admin"],
}


def filter_by_category(jobs: List[Dict], category: str) -> List[Dict]:
    """Return only jobs matching the given category slug."""
    cat = category.lower().strip()
    return [j for j in jobs if j.get("category", "").lower() == cat]




# ─────────────────────────────────────────────────────────────────────────────
# HAVERSINE DISTANCE
# ─────────────────────────────────────────────────────────────────────────────

def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return distance in km between two GPS coordinates."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ─────────────────────────────────────────────────────────────────────────────
# SEMANTIC JOB RANKING
# ─────────────────────────────────────────────────────────────────────────────

def rank_jobs_by_skills(
    user_skills: List[str],
    jobs: List[Dict] = None,
    user_lat: float = None,
    user_lng: float = None,
    interview_score: float = 7.0,
) -> List[Dict]:
    """
    Rank jobs using:
      - Semantic similarity (sentence-transformers)   60%
      - Distance (if GPS provided)                   20%
      - Interview score (normalised)                 20%
    Returns jobs enriched with match_score, distance_km, skill_gap.
    """
    if jobs is None:
        jobs = JOB_CATALOG

    model = _get_model()
    from sentence_transformers import util
    import torch

    user_text = " ".join(user_skills) if user_skills else "general labour"
    user_emb = model.encode(user_text, convert_to_tensor=True)

    scored = []
    for job in jobs:

        job_text = " ".join(job["required_skills"])
        job_emb = model.encode(job_text, convert_to_tensor=True)

        sem_score = float(util.cos_sim(user_emb, job_emb)[0][0])

        # Distance score
        dist_km = None
        dist_score = 0.5

        if user_lat is not None and user_lng is not None:
            dist_km = haversine_km(
                user_lat,
                user_lng,
                job["lat"],
                job["lng"]
            )

            dist_score = max(0.0, 1.0 - dist_km / 500.0)

        # Interview score
        iv_score = min(interview_score / 10.0, 1.0)

        combined = (
            sem_score * 0.60 +
            dist_score * 0.20 +
            iv_score * 0.20
        )
        match_pct = round(combined * 100)

        # Skill gap analysis
        gap = get_skill_gap(
            user_skills,
            job["required_skills"]
        )

        scored.append({
            **job,
            "match_score": match_pct,
            "distance_km": round(dist_km, 1) if dist_km is not None else None,
            "missing_skills": gap["missing"],
            "skill_gap_suggestion": gap["suggestion"],
    })

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored


# ─────────────────────────────────────────────────────────────────────────────
# SKILL GAP ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────

def get_skill_gap(
    user_skills: List[str],
    required_skills: List[str],
) -> Dict[str, Any]:
    """
    Compare candidate skills vs job requirements.
    Returns missing skills and a plain-English suggestion.
    """
    user_set = {s.lower().strip() for s in user_skills}
    required_set = {s.lower().strip() for s in required_skills}
    missing = sorted(required_set - user_set)

    if not missing:
        suggestion = "Great news! You already have all the core skills for this job. Apply now!"
    elif len(missing) == 1:
        suggestion = (
            f"You are almost there! Learn '{missing[0]}' to fully qualify for this role. "
            f"Free resources are available on YouTube and PM e-Vidya portal."
        )
    else:
        top2 = "', '".join(missing[:2])
        suggestion = (
            f"Focus on improving: '{top2}'. "
            f"Short certificate courses on these are available at your nearest ITI or online."
        )

    return {"missing": missing, "suggestion": suggestion}


# ─────────────────────────────────────────────────────────────────────────────
# KANNADA / ENGLISH INTENT EXTRACTION
# ─────────────────────────────────────────────────────────────────────────────

# Keyword map: Kannada words + English words → skill/job tags
INTENT_KEYWORDS: Dict[str, List[str]] = {
    "electrician":     ["ಎಲೆಕ್ಟ್ರಿಷಿಯನ್", "electrical", "wiring", "ವಿದ್ಯುತ್"],
    "teaching":        ["ಶಿಕ್ಷಕ", "teacher", "teaching", "school", "ಶಾಲೆ"],
    "healthcare":      ["ಆರೋಗ್ಯ", "health", "asha", "nurse", "doctor", "hospital"],
    "farming":         ["ರೈತ", "farmer", "farm", "dairy", "livestock", "ಕೃಷಿ"],
    "solar":           ["ಸೌರ", "solar", "panel", "renewable"],
    "computer":        ["ಕಂಪ್ಯೂಟರ್", "computer", "typing", "data entry"],
    "mechanic":        ["ಮೆಕ್ಯಾನಿಕ್", "mechanic", "repair", "engine", "bike"],
    "construction":    ["ನಿರ್ಮಾಣ", "construction", "mason", "building", "labour"],
    "administration":  ["ಆಡಳಿತ", "admin", "secretary", "panchayat", "office"],
    "childcare":       ["ಮಕ್ಕಳು", "child", "anganwadi", "nutrition", "care"],
}


def extract_job_intent(
    text: str,
    user_lat: float = None,
    user_lng: float = None,
    interview_score: float = 7.0
) -> Tuple[List[str], List[Dict]]:
    """
    Parse spoken/typed text for job intents.
    Returns (detected_skills, filtered_jobs).
    Falls back to full catalog if nothing detected.
    """
    text_lower = text.lower()
    detected_skills: List[str] = []

    for skill, keywords in INTENT_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                detected_skills.append(skill)
                break

    if not detected_skills:
        # No clear intent → return all jobs ranked by generic profile
        detected_skills = ["general", "labour", "communication"]
        filtered_jobs = list(JOB_CATALOG)
    else:
        # Strictly filter jobs by detected categories
        filtered_jobs = [job for job in JOB_CATALOG if job.get("category") in detected_skills]
        if not filtered_jobs:
            filtered_jobs = list(JOB_CATALOG)

    ranked = rank_jobs_by_skills(
        detected_skills,
        jobs=filtered_jobs,
        user_lat=user_lat,
        user_lng=user_lng,
        interview_score=interview_score
    )

    return detected_skills, ranked
