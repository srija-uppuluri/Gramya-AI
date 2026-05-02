import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Interview from "./Interview";
import Result from "./Result";
import Dashboard from "./Dashboard";

function App() {
  const [job, setJob] = useState("");
  const [language, setLanguage] = useState("");
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");

  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div style={{ textAlign: "center", padding: "20px" }}>
            <h1>Gramya AI</h1>

            <input
              placeholder="Enter Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <br /><br />

            <input
              placeholder="Enter District"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />

            <h2>Select Job</h2>
            {["Electrician", "Plumber", "Driver"].map((j) => (
              <button key={j} onClick={() => setJob(j)}>
                {j}
              </button>
            ))}

            <h2>Select Language</h2>
            {["Kannada", "English"].map((lang) => (
              <button key={lang} onClick={() => setLanguage(lang)}>
                {lang}
              </button>
            ))}

            <br /><br />

            <button
              onClick={() => {
                if (!job || !language || !name || !district) {
                  alert("Fill all details");
                } else {
                  navigate("/interview", {
                    state: { job, language, name, district }
                  });
                }
              }}
            >
              Start Interview
            </button>
          </div>
        }
      />

      <Route path="/interview" element={<Interview />} />
      <Route path="/result" element={<Result />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;