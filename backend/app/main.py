from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import assessment, candidates
from app.routers import smart_jobs
from app.routers import applications as applications_router
from app.routers import fraud as fraud_router
from app.core.database import Base, engine

# Import all models so SQLAlchemy creates their tables
import app.models.candidate       # noqa: F401
import app.models.fraud_models    # noqa: F401

# Create tables (In a real app, use Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Gramya AI Platform API",
    description="Backend for AI-based video assessment and job application system.",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessment.router, prefix="/api/v1")
app.include_router(candidates.router, prefix="/api/v1")
app.include_router(smart_jobs.router, prefix="/api/v1")
app.include_router(applications_router.router, prefix="/api/v1")
app.include_router(fraud_router.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to Gramya AI Platform API v2"}
