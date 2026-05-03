from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import assessment, candidates
from app.core.database import Base, engine

# Create tables (In a real app, use Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Video Assessment API",
    description="Backend for AI-based video assessment system.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessment.router, prefix="/api/v1")
app.include_router(candidates.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Video Assessment API"}
