import requests
import json
from sentence_transformers import SentenceTransformer, util
from app.core.config import settings

# Load the semantic matching model
model = SentenceTransformer('all-MiniLM-L6-v2')

def transcribe_audio_bhashini(audio_path: str) -> str:
    """
    Mock integration with Bhashini API for STT.
    """
    # In a real scenario, we'd read the file and send it to Bhashini endpoint
    # using settings.BHASHINI_API_KEY
    # Mocking it for now:
    print(f"Mocking Bhashini API call for {audio_path} using key: {settings.BHASHINI_API_KEY}")
    return "This is a mocked transcript of the candidate's answer."

def calculate_semantic_score(transcript: str, ideal_answer: str) -> float:
    """
    Calculate semantic similarity between transcript and ideal answer.
    """
    embeddings1 = model.encode(transcript, convert_to_tensor=True)
    embeddings2 = model.encode(ideal_answer, convert_to_tensor=True)
    cosine_scores = util.cos_sim(embeddings1, embeddings2)
    return float(cosine_scores[0][0])
