import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Interview from "./Interview";
import Result from "./Result";
import Dashboard from "./Dashboard";
import "./App.css";

function App() {
  const [job, setJob] = useState("");
  const [language, setLanguage] = useState("");
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");

  const navigate = useNavigate();

  return (
  <div className="app-layout">

    <Routes>
      <Route
        path="/"
        element={
          <div className="card">
         <div className="page-center">
  <div className="container">

    <h1 className="title">Gramya AI</h1>

    {/* 🔹 USER DETAILS CARD */}
    <div className="card">
      <input
        className="input"
        placeholder="Enter Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="input"
        placeholder="Enter District"
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
      />
    </div>

    {/* 🔹 JOB CARD */}
    <div className="card">
      <h2 className="section-title">Select Job</h2>
      <div className="option-group">
        {["Electrician", "Plumber", "Driver"].map((j) => (
          <button
            key={j}
            className={`option-btn ${job === j ? "active" : ""}`}
            onClick={() => setJob(j)}
          >
            {j}
          </button>
        ))}
      </div>
    </div>

    {/* 🔹 LANGUAGE CARD */}
    <div className="card">
      <h2 className="section-title">Select Language</h2>
      <div className="btn-group">
        {["Kannada", "English"].map((lang) => (
          <button
            key={lang}
            className={`option-btn ${language === lang ? "active" : ""}`}
            onClick={() => setLanguage(lang)}
          >
            {lang}
          </button>
        ))}
      </div>
    </div>

    {/* 🔹 START BUTTON */}
    <button
      className="start-btn"
      onClick={() => {
        if (!job || !language || !name || !district) {
          alert("Fill all details");
        } else {
          navigate("/interview", {
            state: { job, language, name, district },
          });
        }
      }}
    >
      Start Interview
    </button>

  </div>
</div></div>
        }
      />

      <Route
        path="/interview"
        element={
          <div className="interview-container">
            <Interview />
          </div>
        }
      />

      <Route
        path="/result"
        element={
          <div className="result-card">
            <Result />
          </div>
        }
      />

      <Route
        path="/dashboard"
        element={
          <div className="dashboard">
            <Dashboard />
          </div>
        }
      />
   
    </Routes>
   
  </div>
);
}

export default App;