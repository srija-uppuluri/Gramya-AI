# 🌾 Gramya AI Platform

> **AI-powered video assessment & smart job-matching platform built for rural India.**  
> Connecting blue-collar workers with government and private sector opportunities — with built-in fraud detection, multilingual support, and automated scoring.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running with Docker (Recommended)](#running-with-docker-recommended)
  - [Running Locally (Manual)](#running-locally-manual)
- [API Reference](#-api-reference)
- [Fraud Detection System](#-fraud-detection-system)
- [Frontend Pages](#-frontend-pages)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧭 Overview

**Gramya AI** is a full-stack platform that enables rural job-seekers to:

1. **Discover** government and private sector jobs across multiple categories (electrician, plumber, driver, teaching, healthcare, farming, mechanic).
2. **Apply** with a guided, multilingual application flow.
3. **Record & Submit** AI-evaluated video interviews — no recruiter bias, no travel costs.
4. **Track** applications in real time through a personal dashboard.

Admins get a powerful **Fraud Monitoring Dashboard** that uses computer vision and audio analysis to flag suspicious interview behaviour automatically.

---

## ✨ Features

| Area | Feature |
|---|---|
| 🎥 **Video Assessment** | Chunked video upload to MinIO, async processing via Celery |
| 🤖 **AI Scoring** | Speech-to-text via Bhashini API + semantic similarity scoring (MiniLM) |
| 🔍 **Fraud Detection** | Real-time face detection, voice-consistency checks, duplicate-face matching |
| 💼 **Job Listings** | Filterable grid of govt & private jobs with skill chips and openings count |
| 📝 **Smart Applications** | Job-specific Q&A modal, duplicate-application guard, localStorage fallback |
| 📊 **Admin Dashboard** | Fraud timeline, risk-tier badges (safe / review / high_risk), score breakdown |
| 🌐 **Multilingual** | i18next integration — add any language via `src/locales/` |
| 🗺️ **Maps** | Leaflet + react-leaflet for location-based features |
| 🔐 **Auth & Roles** | User / Admin role separation, protected routes |
| 🚀 **DevOps** | Docker Compose with PostgreSQL 15, Redis, MinIO, FastAPI app & Celery worker |

---

## 🛠 Tech Stack

### Backend
| Layer | Technology |
|---|---|
| API Framework | **FastAPI** (Python) |
| Task Queue | **Celery** + **Redis** |
| Database | **PostgreSQL 15** via SQLAlchemy + Alembic |
| Object Storage | **MinIO** (S3-compatible) |
| AI / ML | `sentence-transformers` (MiniLM), OpenCV, Librosa, MediaPipe |
| Speech-to-Text | **Bhashini API** (mock-ready) |
| Container | **Docker** + Docker Compose |

### Frontend
| Layer | Technology |
|---|---|
| Framework | **React 19** (Create React App) |
| Routing | React Router v7 |
| Charts | Recharts |
| Maps | Leaflet + react-leaflet |
| Webcam | react-webcam |
| i18n | i18next + react-i18next |
| Styling | Vanilla CSS (component-scoped) |

---

## 📁 Project Structure

```
Gramya-AI/
├── backend/                        # FastAPI backend
│   ├── app/
│   │   ├── core/
│   │   │   ├── celery_app.py       # Celery configuration
│   │   │   ├── database.py         # SQLAlchemy engine & session
│   │   │   ├── minio_client.py     # MinIO client helper
│   │   │   └── config.py           # Pydantic settings
│   │   ├── models/
│   │   │   ├── candidate.py        # Candidate & Assessment ORM models
│   │   │   └── fraud_models.py     # Fraud event ORM models
│   │   ├── routers/
│   │   │   ├── assessment.py       # Video upload & assessment endpoints
│   │   │   ├── candidates.py       # Candidate results & filter endpoints
│   │   │   ├── applications.py     # Job application CRUD
│   │   │   ├── fraud.py            # Real-time fraud detection endpoints
│   │   │   └── smart_jobs.py       # AI job-matching endpoints
│   │   ├── schemas/
│   │   │   └── assessment.py       # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── ai_service.py       # Bhashini STT + semantic scoring
│   │   │   ├── fraud_service.py    # Face, voice, duplicate detection
│   │   │   └── video_service.py    # Video download & audio extraction
│   │   ├── workers/
│   │   │   └── tasks.py            # Celery task: process_video_task
│   │   └── main.py                 # FastAPI app entry point
│   ├── .env.example                # Environment variable template
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
│
└── gramya-frontend/                # React frontend
    ├── src/
    │   ├── AdminFraudDashboard.js  # Admin fraud monitoring UI
    │   ├── AdminApplications.js    # Admin job-applications manager
    │   ├── SmartJobAssistant.js    # AI job-matching chat assistant
    │   ├── JobListingPage.js       # Filterable job listing grid
    │   ├── ApplicationTracker.js   # Candidate application tracker
    │   ├── FraudMonitor.js         # Real-time fraud event monitor
    │   ├── Dashboard.js            # Admin analytics dashboard
    │   ├── UserDashboard.js        # Candidate self-service dashboard
    │   ├── Interview.js            # Video interview recording UI
    │   ├── Register.js / Login.js  # Auth pages
    │   ├── Navbar.js               # Responsive navigation
    │   ├── OnboardingTour.js       # react-joyride guided tour
    │   ├── locales/                # i18n translation files
    │   └── i18n.js                 # i18next initialisation
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended) **or**
- Python 3.10+, Node.js 18+, PostgreSQL 15, Redis, MinIO

---

### Environment Variables

Copy the example file and fill in your values:

```bash
cd backend
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://admin:password@localhost:5432/assessment_db` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis broker URL |
| `MINIO_ENDPOINT` | `localhost:9000` | MinIO server host:port |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | `minioadmin123` | MinIO secret key |
| `MINIO_SECURE` | `False` | Use TLS for MinIO |
| `BHASHINI_API_KEY` | — | Your Bhashini speech-to-text API key |

For the frontend, create `gramya-frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

---

### Running with Docker (Recommended)

```bash
# 1. Clone the repo
git clone https://github.com/your-org/Gramya-AI.git
cd Gramya-AI/backend

# 2. Start all services (PostgreSQL, Redis, MinIO, API, Celery Worker)
docker compose up --build

# 3. In a separate terminal — start the frontend
cd ../gramya-frontend
npm install
npm start
```

Services will be available at:

| Service | URL |
|---|---|
| FastAPI (REST API) | http://localhost:8000 |
| Interactive API Docs | http://localhost:8000/docs |
| React Frontend | http://localhost:3000 |
| MinIO Console | http://localhost:9001 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

### Running Locally (Manual)

**Backend:**

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A app.core.celery_app.celery_app worker --loglevel=info
```

**Frontend:**

```bash
cd gramya-frontend
npm install
npm start
```

> ⚠️ Make sure PostgreSQL, Redis and MinIO are running locally before starting the backend.

---

## 📡 API Reference

Full interactive documentation is auto-generated at **`http://localhost:8000/docs`** (Swagger UI).

### Core Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/v1/upload` | Upload video for assessment |
| `GET` | `/api/v1/results/{candidate_id}` | Get all assessment results for a candidate |
| `GET` | `/api/v1/candidates` | List/filter candidates by score & status |
| `POST` | `/api/v1/apply` | Submit a job application |
| `GET` | `/api/v1/applications` | List all applications (admin) |
| `GET` | `/api/v1/jobs-list` | Fetch available job listings |
| `POST` | `/api/v1/fraud/analyze-frame` | Analyse a video frame for fraud (base64) |
| `POST` | `/api/v1/fraud/analyze-voice` | Analyse an audio segment for voice consistency |
| `POST` | `/api/v1/fraud/check-duplicate` | Check for duplicate face across candidates |
| `POST` | `/api/v1/fraud/compute-score` | Compute aggregate fraud score from events |
| `GET` | `/api/v1/smart-jobs` | AI-matched job recommendations |

---

## 🛡 Fraud Detection System

The fraud engine (`backend/app/services/fraud_service.py`) operates in real time during interviews and post-processing:

### Risk Scoring

| Signal | Score Impact |
|---|---|
| Multiple faces in frame | +40 |
| Duplicate face (cross-candidate) | +50 |
| Voice mismatch (cosine similarity < 0.75) | +30 |
| Liveness check failed | +25 |
| Face absent from frame | +20 |
| Tab switch event | +15 |
| Background noise detected | +10 |
| Full-screen exit | +10 |

### Risk Tiers

| Score Range | Tier | Action |
|---|---|---|
| 0 – 30 | 🟢 **Safe** | Auto-advance |
| 31 – 60 | 🟡 **Review** | Manual review required |
| 61+ | 🔴 **High Risk** | Flag for rejection |

### Technologies Used

- **Face Detection**: OpenCV Haar Cascade (`haarcascade_frontalface_default.xml`)
- **Voice Analysis**: Librosa MFCC feature extraction + cosine similarity
- **Duplicate Detection**: 128-dim face embeddings + cosine similarity (swap-in ready for `face_recognition` on Linux)
- All detectors degrade gracefully with mock responses when optional libraries are unavailable.

---

## 🖥 Frontend Pages

| Route | Component | Access |
|---|---|---|
| `/` | Home | Public |
| `/jobs` | `JobListingPage` | Public |
| `/register` | `Register` | Public |
| `/login` | `Login` | Public |
| `/interview` | `Interview` | Candidate |
| `/my-applications` | `ApplicationTracker` | Candidate |
| `/user-dashboard` | `UserDashboard` | Candidate |
| `/dashboard` | `Dashboard` | Admin |
| `/admin/applications` | `AdminApplications` | Admin |
| `/admin/fraud` | `AdminFraudDashboard` | Admin |
| `/fraud-monitor` | `FraudMonitor` | Admin |
| `/smart-jobs` | `SmartJobAssistant` | Candidate |

---

## ☁️ Deployment

### Backend (Render / Railway / AWS ECS)

1. Set all environment variables listed above in your hosting provider's dashboard.
2. Use the provided `Dockerfile` for containerised deployments.
3. Run database migrations before starting the app:
   ```bash
   alembic upgrade head
   ```
4. Use a managed PostgreSQL service (e.g., Supabase, AWS RDS) and Redis (e.g., Upstash, AWS ElastiCache).

### Frontend (Vercel / Netlify)

```bash
cd gramya-frontend
npm run build        # Creates optimised build in /build
```

Set `REACT_APP_API_URL` to your deployed backend URL in the hosting provider's environment settings.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ for rural India — <em>Gramya AI</em></p>
</div>
