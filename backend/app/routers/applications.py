"""
applications.py
---------------
FastAPI router for the Job Application & Tracking System.

  POST /api/v1/apply                      — submit application
  GET  /api/v1/applications/{user_id}     — get user's applications
  GET  /api/v1/admin/applications         — admin: all applications (with filters)
  PUT  /api/v1/admin/update-status        — admin: update application status
  GET  /api/v1/jobs-list                  — full job listings (with description)
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid

router = APIRouter(tags=["Applications"])

# ─────────────────────────────────────────────────────────────────────────────
# In-memory store (replace with DB in production)
# ─────────────────────────────────────────────────────────────────────────────

APPLICATIONS: List[dict] = []

# ─────────────────────────────────────────────────────────────────────────────
# JOB LISTINGS  (extended with description + questions)
# ─────────────────────────────────────────────────────────────────────────────

JOB_LISTINGS = [
    {
        "id": "job-001",
        "title": "Electrician / Wiring Technician",
        "category": "electrician",
        "description": "Install, maintain, and repair electrical wiring and equipment at residential and commercial sites.",
        "required_skills": ["Electrical Wiring", "Circuit Diagrams", "Safety Protocols", "Hand Tools"],
        "location": "Bengaluru Rural, KA",
        "salary": "₹18,000–₹25,000/mo",
        "openings": 8,
        "type": "private",
        "questions": [
            "How many years of electrical wiring experience do you have?",
            "Describe a complex wiring project you completed.",
            "Are you familiar with safety protocols for high-voltage work?",
        ],
    },
    {
        "id": "job-002",
        "title": "Plumber (Residential & Commercial)",
        "category": "plumber",
        "description": "Install and repair water supply pipes, drainage systems, and sanitary fittings in homes and offices.",
        "required_skills": ["Pipe Fitting", "Leak Detection", "Water Supply", "Sewage Systems"],
        "location": "Bengaluru, KA",
        "salary": "₹14,000–₹22,000/mo",
        "openings": 15,
        "type": "private",
        "questions": [
            "How many years of plumbing experience do you have?",
            "Have you handled sewage system repairs? Describe your experience.",
            "Do you have experience with commercial plumbing projects?",
        ],
    },
    {
        "id": "job-003",
        "title": "Light Motor Vehicle Driver",
        "category": "driver",
        "description": "Drive company cars, vans, and light trucks for deliveries and employee transport.",
        "required_skills": ["LMV License", "Traffic Rules", "Navigation", "Vehicle Maintenance"],
        "location": "Bengaluru, KA",
        "salary": "₹14,000–₹20,000/mo",
        "openings": 30,
        "type": "private",
        "questions": [
            "Which vehicle license do you hold? (LMV / HMV / Both)",
            "How many years of driving experience do you have?",
            "Have you driven in heavy traffic city routes? Which cities?",
        ],
    },
    {
        "id": "job-004",
        "title": "Government School Teacher",
        "category": "teaching",
        "description": "Teach primary school students in government-run schools. Subjects include Maths, Science, and regional language.",
        "required_skills": ["Teaching", "Communication", "Hindi/Kannada", "Patience", "Classroom Management"],
        "location": "Varanasi, UP",
        "salary": "₹28,000–₹35,000/mo",
        "openings": 15,
        "type": "government",
        "questions": [
            "What subjects are you qualified to teach?",
            "How many years of teaching experience do you have?",
            "Describe your approach to managing a classroom of 30+ students.",
        ],
    },
    {
        "id": "job-005",
        "title": "ASHA Health Worker",
        "category": "healthcare",
        "description": "Promote health awareness and facilitate access to government health schemes in rural communities.",
        "required_skills": ["Healthcare Awareness", "Community Outreach", "First Aid", "Record Keeping"],
        "location": "Raipur, CG",
        "salary": "₹15,000–₹20,000/mo",
        "openings": 22,
        "type": "government",
        "questions": [
            "Do you have any formal healthcare or nursing training?",
            "Describe your experience working in a rural community health setting.",
            "How comfortable are you with record keeping and reporting?",
        ],
    },
    {
        "id": "job-006",
        "title": "Municipal Plumber",
        "category": "plumber",
        "description": "Maintain and repair municipal water supply pipelines and sewage systems under the local municipal body.",
        "required_skills": ["Plumbing", "Sewage Systems", "Pipeline Repair", "Physical Fitness"],
        "location": "Raipur, CG",
        "salary": "₹18,000–₹26,000/mo",
        "openings": 10,
        "type": "government",
        "questions": [
            "Have you worked on large-scale municipal pipeline projects?",
            "Do you have experience with sewage pump maintenance?",
            "Are you comfortable working in confined spaces?",
        ],
    },
    {
        "id": "job-007",
        "title": "Ambulance Driver",
        "category": "driver",
        "description": "Drive 108 emergency ambulances safely and efficiently under the state health department.",
        "required_skills": ["LMV License", "First Aid", "Navigation", "Emergency Response"],
        "location": "Raipur, CG",
        "salary": "₹16,000–₹22,000/mo",
        "openings": 15,
        "type": "government",
        "questions": [
            "Do you hold a valid LMV or HMV driving license?",
            "Have you completed any first-aid or emergency response training?",
            "Describe a high-pressure driving situation you have handled.",
        ],
    },
    {
        "id": "job-008",
        "title": "Solar Panel Installer",
        "category": "electrician",
        "description": "Install and commission rooftop solar panels for rural households under the PM Surya Ghar scheme.",
        "required_skills": ["Solar Installation", "Electrical Wiring", "Rooftop Work", "Safety"],
        "location": "Jodhpur, RJ",
        "salary": "₹15,000–₹21,000/mo",
        "openings": 35,
        "type": "private",
        "questions": [
            "Have you installed solar panels before? How many installations?",
            "Are you comfortable working at heights on rooftops?",
            "Do you have experience with DC/AC electrical connections?",
        ],
    },
]

STATUS_FLOW = ["Pending Review", "Under Review", "Interview Scheduled", "Selected", "Rejected"]

# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────

class ApplyRequest(BaseModel):
    user_id: str
    user_name: str
    user_email: str
    user_phone: str
    user_skills: str          # comma-separated
    user_location: str
    experience_years: int = 0
    job_id: str
    job_title: str
    job_category: str
    answers: List[str]        # one answer per job question
    cover_note: Optional[str] = ""


class ApplicationOut(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    user_phone: str
    user_skills: str
    user_location: str
    experience_years: int
    job_id: str
    job_title: str
    job_category: str
    answers: List[str]
    cover_note: str
    status: str
    applied_at: str
    updated_at: str
    admin_note: Optional[str] = ""


class StatusUpdateRequest(BaseModel):
    application_id: str
    status: str               # one of STATUS_FLOW
    admin_note: Optional[str] = ""


# ─────────────────────────────────────────────────────────────────────────────
# 1. POST /apply
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/apply", response_model=ApplicationOut)
def submit_application(req: ApplyRequest):
    # Prevent duplicate application for same job
    existing = next(
        (a for a in APPLICATIONS if a["user_id"] == req.user_id and a["job_id"] == req.job_id),
        None,
    )
    if existing:
        raise HTTPException(status_code=409, detail="You have already applied for this job.")

    now = datetime.utcnow().isoformat()
    app = {
        "id": str(uuid.uuid4())[:8],
        "user_id": req.user_id,
        "user_name": req.user_name,
        "user_email": req.user_email,
        "user_phone": req.user_phone,
        "user_skills": req.user_skills,
        "user_location": req.user_location,
        "experience_years": req.experience_years,
        "job_id": req.job_id,
        "job_title": req.job_title,
        "job_category": req.job_category,
        "answers": req.answers,
        "cover_note": req.cover_note or "",
        "status": "Pending Review",
        "applied_at": now,
        "updated_at": now,
        "admin_note": "",
    }
    APPLICATIONS.append(app)
    return ApplicationOut(**app)


# ─────────────────────────────────────────────────────────────────────────────
# 2. GET /applications/{user_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/applications/{user_id}", response_model=List[ApplicationOut])
def get_user_applications(user_id: str):
    apps = [a for a in APPLICATIONS if a["user_id"] == user_id]
    return [ApplicationOut(**a) for a in apps]


# ─────────────────────────────────────────────────────────────────────────────
# 3. GET /admin/applications
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/admin/applications", response_model=List[ApplicationOut])
def admin_get_applications(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    results = list(APPLICATIONS)
    if category:
        results = [a for a in results if a["job_category"].lower() == category.lower()]
    if status:
        results = [a for a in results if a["status"].lower() == status.lower()]
    results.sort(key=lambda x: x["applied_at"], reverse=True)
    return [ApplicationOut(**a) for a in results]


# ─────────────────────────────────────────────────────────────────────────────
# 4. PUT /admin/update-status
# ─────────────────────────────────────────────────────────────────────────────

@router.put("/admin/update-status", response_model=ApplicationOut)
def admin_update_status(req: StatusUpdateRequest):
    if req.status not in STATUS_FLOW:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {STATUS_FLOW}")

    app = next((a for a in APPLICATIONS if a["id"] == req.application_id), None)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    app["status"] = req.status
    app["admin_note"] = req.admin_note or ""
    app["updated_at"] = datetime.utcnow().isoformat()
    return ApplicationOut(**app)


# ─────────────────────────────────────────────────────────────────────────────
# 5. GET /jobs-list
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/jobs-list")
def get_jobs_list(category: Optional[str] = Query(None)):
    jobs = list(JOB_LISTINGS)
    if category:
        jobs = [j for j in jobs if j["category"].lower() == category.lower()]
    return jobs
