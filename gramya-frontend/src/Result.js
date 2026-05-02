import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Evaluation Result</h1>

      <h2 style={{ color }}>{score} / 10</h2>

      <div style={{ background: "#ddd", height: "10px", width: "100%" }}>
        <div style={{
          width: `${score * 10}%`,
          background: color,
          height: "100%"
        }} />
      </div>

      <p><b>Name:</b> {name}</p>
      <p><b>District:</b> {district}</p>
      <p><b>Job:</b> {job}</p>

      <p><b>Skills:</b> {skills?.join(", ")}</p>
      <p><b>Suggestion:</b> {suggestion}</p>
      <p><b>Reason:</b> {reason}</p>
      <p><b>Confidence:</b> {confidence}</p>

      <p><b>Your Answer:</b> {answer}</p>

      <button onClick={() => navigate("/")}>Go Home</button>
      <br /><br />
      <button onClick={() => navigate("/dashboard")}>View Dashboard</button>
    </div>
  );
}

export default Result;