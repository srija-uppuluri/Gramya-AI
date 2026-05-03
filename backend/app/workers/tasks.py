import os
import json
from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.candidate import Assessment
from app.services.video_service import download_video, extract_audio
from app.services.fraud_service import check_multiple_faces, check_audio_continuity
from app.services.ai_service import transcribe_audio_bhashini, calculate_semantic_score

TEMP_DIR = "/tmp/processing"
os.makedirs(TEMP_DIR, exist_ok=True)

@celery_app.task(name="process_video_task")
def process_video_task(assessment_id: int):
    db = SessionLocal()
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    if not assessment:
        db.close()
        return "Assessment not found"
        
    try:
        assessment.status = "processing"
        db.commit()
        
        # 1. Download video
        video_filename = os.path.basename(assessment.video_path)
        local_video_path = os.path.join(TEMP_DIR, video_filename)
        download_video(assessment.video_path, local_video_path)
        
        # 2. Extract audio
        local_audio_path = os.path.join(TEMP_DIR, f"{assessment_id}.wav")
        extract_audio(local_video_path, local_audio_path)
        
        # 3. Fraud Detection
        flags = []
        if check_multiple_faces(local_video_path):
            flags.append("multiple_faces_detected")
        if check_audio_continuity(local_audio_path):
            flags.append("audio_cuts_detected")
            
        # 4. Speech to Text
        transcript = transcribe_audio_bhashini(local_audio_path)
        
        # 5. Semantic Matching
        ideal_answer = "This is a mocked transcript of the candidate's answer." # Mocked ideal answer
        score = calculate_semantic_score(transcript, ideal_answer) * 100
        
        # Update Assessment
        assessment.status = "completed"
        assessment.score = score
        assessment.transcript = transcript
        assessment.confidence = 0.95  # Mocked STT confidence
        assessment.fraud_flags = json.dumps(flags)
        assessment.needs_manual_review = len(flags) > 0
        
        db.commit()
        
        # Cleanup
        try:
            os.remove(local_video_path)
            os.remove(local_audio_path)
        except OSError:
            pass
            
    except Exception as e:
        assessment.status = "failed"
        db.commit()
        print(f"Task failed: {str(e)}")
    finally:
        db.close()
        
    return "Processing completed"
