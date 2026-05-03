import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./App.css";

function Result() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    score,
    job,
    language,
    name,
    district,
    skills,
    suggestion,
    reason,
    confidence,
    answer
  } = location.state || {};

  // Save to localStorage
  const existing = JSON.parse(localStorage.getItem("candidates")) || [];

  existing.push({
    name,
    job,
    district,
    score,
    status: score >= 7 ? "Approved" : "Review"
  });

  localStorage.setItem("candidates", JSON.stringify(existing));

  const color = score >= 7 ? "green" : "red";

  return (
    <>
    <div className="page-center">
     <div className="result-card">

    <h1 className="title">Evaluation Result</h1>

    {/* Score */}
    <h2 className="result-score" style={{ color }}>
      {score} / 10
    </h2>

    {/* Progress Bar */}
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{
          width: `${score * 10}%`,
          background: color
        }}
      />
    </div>

    {/* Candidate Info */}
    <div style={{ marginTop: "15px", fontSize: "14px" }}>
      <p><b>Name:</b> {name}</p>
      <p><b>District:</b> {district}</p>
      <p><b>Job:</b> {job}</p>
    </div>

    {/* Skills */}
    <h3 className="section-title">Skills Detected</h3>
    <p>{skills?.join(", ") || "None"}</p>

    {/* Suggestion */}
    <p><b>Suggestion:</b> {suggestion}</p>

    {/* Reason */}
    <p style={{ color: "#555" }}>
      <b>Reason:</b> {reason}
    </p>

    {/* Confidence */}
    <p><b>Confidence:</b> {confidence}</p>

    {/* Answer */}
    <div style={{
      marginTop: "15px",
      background: "#f9fafb",
      padding: "10px",
      borderRadius: "8px"
    }}>
      <p><b>Your Answer:</b></p>
      <p style={{ fontSize: "14px" }}>{answer}</p>
    </div>

    {/* Buttons */}
    <div style={{ marginTop: "20px" }}>
      <button
        className="start-btn"
        onClick={() => navigate("/")}
      >
        Go Home
      </button>

      <br /><br />

      <button
        className="select-btn"
        onClick={() => navigate("/UserDashboard")}
      >
        View Dashboard 
      </button>
    </div>
    </div>
  </div>
</>
);
}

export default Result;