import os
import subprocess
from app.core.minio_client import minio_client, BUCKET_NAME

def download_video(object_name: str, download_path: str):
    """Download video from MinIO."""
    minio_client.fget_object(BUCKET_NAME, object_name, download_path)

def extract_audio(video_path: str, audio_path: str):
    """Extract audio from video using ffmpeg."""
    command = [
        "ffmpeg", "-y", "-i", video_path, 
        "-q:a", "0", "-map", "a", audio_path
    ]
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
