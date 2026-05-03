import os
import shutil
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from app.schemas.assessment import ProcessVideoRequest, ProcessVideoResponse
from app.core.minio_client import minio_client, BUCKET_NAME
from app.workers.tasks import process_video_task
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.models.candidate import Assessment, Candidate

router = APIRouter()

TEMP_DIR = "/tmp/video_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/upload-video")
async def upload_video(
    file: UploadFile = File(...),
    chunk_index: int = Form(0),
    total_chunks: int = Form(1),
    filename: str = Form(...)
):
    """
    Accepts video file or chunks.
    Allows resumable/chunk uploads for offline support and large files.
    """
    temp_file_path = os.path.join(TEMP_DIR, filename)
    
    # Append chunk to file
    mode = "ab" if chunk_index > 0 else "wb"
    with open(temp_file_path, mode) as f:
        shutil.copyfileobj(file.file, f)
        
    # If last chunk, upload to MinIO
    if chunk_index == total_chunks - 1:
        object_name = f"uploads/{filename}"
        minio_client.fput_object(
            BUCKET_NAME,
            object_name,
            temp_file_path
        )
        # Clean up temp file
        os.remove(temp_file_path)
        
        return {"message": "Upload complete", "filename": filename, "object_name": object_name}
        
    return {"message": f"Chunk {chunk_index + 1}/{total_chunks} received."}

@router.post("/process-video", response_model=ProcessVideoResponse)
async def process_video(request: ProcessVideoRequest, db: Session = Depends(get_db)):
    """
    Trigger async processing.
    """
    # Verify candidate exists (mocking candidate creation if not for simplicity)
    candidate = db.query(Candidate).filter(Candidate.id == request.candidate_id).first()
    if not candidate:
        candidate = Candidate(id=request.candidate_id, name=f"Candidate {request.candidate_id}", email=f"candidate{request.candidate_id}@example.com")
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

    # Create assessment record
    object_name = f"uploads/{request.video_filename}"
    assessment = Assessment(
        candidate_id=candidate.id,
        video_path=object_name,
        status="pending"
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Trigger Celery task
    task = process_video_task.delay(assessment.id)
    
    return ProcessVideoResponse(task_id=task.id, message="Video processing started.")
