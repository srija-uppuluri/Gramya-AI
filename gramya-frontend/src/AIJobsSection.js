import React, { useState } from "react";
import "./AIJobsSection.css";

// ─── Mock job data ────────────────────────────────────────────────────────────
const ALL_JOBS = [
  {
    id: 1,
    title: "Government School Teacher",
    type: "government",
    matchScore: 94,
    aiExplanation:
      "Your Hindi communication skills and education interview score of 9/10 make you a top fit for this role.",
    location: "Varanasi, UP",
    salary: "₹28,000 – ₹35,000 / month",
    topMatch: true,
    tags: ["Teaching", "Hindi", "Government"],
    posted: "2 days ago",
  },
  {
    id: 2,
    title: "Dairy Farm Supervisor",
    type: "government",
    matchScore: 87,
    aiExplanation:
      "Your rural agriculture background and livestock-related answers align strongly with this role.",
    location: "Mehsana, Gujarat",
    salary: "₹18,000 – ₹22,000 / month",
    topMatch: false,
    tags: ["Farming", "Livestock", "Supervisor"],
    posted: "1 day ago",
  },
  {
    id: 3,
    title: "Digital Data Entry Operator",
    type: "private",
    matchScore: 82,
    aiExplanation:
      "Moderate typing skills and basic computer knowledge detected in your form responses.",
    location: "Pune, Maharashtra",
    salary: "₹12,000 – ₹16,000 / month",
    topMatch: false,
    tags: ["Data Entry", "Computer", "Private"],
    posted: "3 days ago",
  },
  {
    id: 4,
    title: "ASHA Health Worker",
    type: "government",
    matchScore: 91,
    aiExplanation:
      "Your community engagement skills and health-awareness answers scored highly in our AI model.",
    location: "Raipur, Chhattisgarh",
    salary: "₹15,000 – ₹20,000 / month",
    topMatch: false,
    tags: ["Healthcare", "Community", "Government"],
    posted: "Today",
  },
  {
    id: 5,
    title: "Solar Panel Technician",
    type: "private",
    matchScore: 76,
    aiExplanation:
      "Basic electrical knowledge mentioned in your profile. Training provided on-site by the employer.",
    location: "Jodhpur, Rajasthan",
    salary: "₹14,000 – ₹18,000 / month",
    topMatch: false,
    tags: ["Solar", "Electrical", "Private"],
    posted: "5 days ago",
  },
  {
    id: 6,
    title: "Gram Panchayat Secretary",
    type: "government",
    matchScore: 88,
    aiExplanation:
      "Administrative aptitude and leadership skills detected. Strong match for local governance roles.",
    location: "Nashik, Maharashtra",
    salary: "₹22,000 – ₹30,000 / month",
    topMatch: false,
    tags: ["Administration", "Government", "Leadership"],
    posted: "4 days ago",
  },
];

const FILTERS = [
  { key: "all", label: "All Jobs" },
  { key: "nearby", label: "📍 Nearby" },
  { key: "high-match", label: "🔥 High Match (>80%)" },
  { key: "government", label: "🏛️ Government" },
  { key: "private", label: "🏢 Private" },
];

// ─── Match badge colour ───────────────────────────────────────────────────────
function getMatchColour(score) {
  if (score >= 90) return { bg: "linear-gradient(135deg,#22c55e,#16a34a)", text: "#fff" };
  if (score >= 80) return { bg: "linear-gradient(135deg,#3b82f6,#6366f1)", text: "#fff" };
  return { bg: "linear-gradient(135deg,#f59e0b,#d97706)", text: "#fff" };
}

// ─── Single Job Card ──────────────────────────────────────────────────────────
function JobCard({ job, onSelect, isTop }) {
  const mc = getMatchColour(job.matchScore);

  return (
    <div
      className={`job-card${isTop ? " job-card--top" : ""}`}
      onClick={() => onSelect(job)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(job)}
      aria-label={`View details for ${job.title}`}
    >
      {/* Top badge */}
      {job.topMatch && (
        <span className="top-match-badge">🔥 Top Match</span>
      )}

      {/* Header row */}
      <div className="job-card__header">
        <div className="job-icon" aria-hidden="true">
          {job.type === "government" ? "🏛️" : "🏢"}
        </div>
        <span
          className="match-badge"
          style={{ background: mc.bg, color: mc.text }}
          aria-label={`${job.matchScore} percent match`}
        >
          {job.matchScore}% match
        </span>
      </div>

      {/* Title */}
      <h3 className="job-title">{job.title}</h3>

      {/* Progress bar */}
      <div className="match-progress" aria-hidden="true">
        <div
          className="match-progress__fill"
          style={{
            width: `${job.matchScore}%`,
            background: mc.bg,
          }}
        />
      </div>

      {/* AI Explanation */}
      <p className="job-ai-text">✨ {job.aiExplanation}</p>

      {/* Meta row */}
      <div className="job-meta">
        <span className="job-meta__item">📍 {job.location}</span>
        {job.salary && (
          <span className="job-meta__item">💰 {job.salary}</span>
        )}
        <span className="job-meta__item">🕒 {job.posted}</span>
      </div>

      {/* Tags */}
      <div className="job-tags">
        {job.tags.map((t) => (
          <span key={t} className="job-tag">{t}</span>
        ))}
      </div>

      {/* CTA */}
      <button
        className="apply-btn"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(job);
        }}
        id={`apply-btn-${job.id}`}
      >
        Apply Now →
      </button>
    </div>
  );
}

// ─── Job Detail Modal ─────────────────────────────────────────────────────────
function JobModal({ job, onClose }) {
  const mc = getMatchColour(job.matchScore);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Job details for ${job.title}`}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          className="modal-close"
          onClick={onClose}
          id="modal-close-btn"
          aria-label="Close job detail"
        >
          ✕
        </button>

        {/* Match badge */}
        <div className="modal-match" style={{ background: mc.bg }}>
          {job.matchScore}% Match
        </div>

        <h2 className="modal-title">{job.title}</h2>
        <p className="modal-type">
          {job.type === "government" ? "🏛️ Government Job" : "🏢 Private Job"}
        </p>

        <div className="modal-section">
          <h4>🤖 Why AI Recommends This</h4>
          <p>{job.aiExplanation}</p>
        </div>

        <div className="modal-section">
          <h4>📍 Location</h4>
          <p>{job.location}</p>
        </div>

        {job.salary && (
          <div className="modal-section">
            <h4>💰 Salary</h4>
            <p>{job.salary}</p>
          </div>
        )}

        <div className="modal-section">
          <h4>🏷️ Skills Matched</h4>
          <div className="job-tags" style={{ marginTop: "6px" }}>
            {job.tags.map((t) => (
              <span key={t} className="job-tag">{t}</span>
            ))}
          </div>
        </div>

        <button
          className="apply-btn apply-btn--large"
          id={`modal-apply-btn-${job.id}`}
          onClick={() => alert(`Applying for: ${job.title}`)}
        >
          🚀 Apply Now
        </button>
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export default function AIJobsSection() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState(null);

  const filtered = ALL_JOBS.filter((j) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "nearby") return ["Varanasi, UP", "Raipur, Chhattisgarh"].includes(j.location);
    if (activeFilter === "high-match") return j.matchScore > 80;
    if (activeFilter === "government") return j.type === "government";
    if (activeFilter === "private") return j.type === "private";
    return true;
  });

  // Best card goes first
  const sorted = [...filtered].sort((a, b) => {
    if (a.topMatch && !b.topMatch) return -1;
    if (!a.topMatch && b.topMatch) return 1;
    return b.matchScore - a.matchScore;
  });

  return (
    <section className="ai-jobs-section" id="ai-jobs-section" aria-label="AI Suggested Jobs">
      {/* Header */}
      <div className="ai-jobs-header">
        <div className="ai-jobs-header__text">
          <div className="ai-jobs-header__eyebrow">
            <span className="ai-chip">🤖 AI Powered</span>
          </div>
          <h2 className="ai-jobs-title">AI Suggested Jobs</h2>
          <p className="ai-jobs-subtitle">
            Personalized opportunities based on your skills &amp; interview performance
          </p>
        </div>
        <div className="ai-jobs-header__stat">
          <span className="stat-number">{ALL_JOBS.length}</span>
          <span className="stat-label">Jobs Found</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" role="group" aria-label="Job filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            id={`filter-${f.key}`}
            className={`filter-btn${activeFilter === f.key ? " filter-btn--active" : ""}`}
            onClick={() => setActiveFilter(f.key)}
            aria-pressed={activeFilter === f.key}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="results-count">
        Showing <strong>{sorted.length}</strong> job{sorted.length !== 1 ? "s" : ""}
      </p>

      {/* Job Grid */}
      {sorted.length === 0 ? (
        <div className="no-jobs">
          <p>😔 No jobs match this filter right now.</p>
          <button className="filter-btn filter-btn--active" onClick={() => setActiveFilter("all")}>
            Show All Jobs
          </button>
        </div>
      ) : (
        <div className="jobs-grid">
          {sorted.map((job, idx) => (
            <JobCard
              key={job.id}
              job={job}
              onSelect={setSelectedJob}
              isTop={idx === 0 && job.topMatch}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedJob && (
        <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </section>
  );
}
