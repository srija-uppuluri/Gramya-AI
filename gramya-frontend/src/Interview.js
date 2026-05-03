import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import Navbar from "./Navbar";

function Interview() {
  const navigate = useNavigate();
  const location = useLocation();

  const { job, language, name, district } = location.state || {};

  const webcamRef = useRef(null);

  const [image, setImage] = useState(null);
  const [answer, setAnswer] = useState("");
  const [allAnswers, setAllAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  const questions = [
    "How do you ensure safety while working?",
    "What tools do you use in your job?",
    "How do you handle emergency situations?"
  ];

  const capture = () => {
    const img = webcamRef.current.getScreenshot();
    setImage(img);
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "Kannada" ? "kn-IN" : "en-IN";
    recognition.start();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setAnswer((prev) => prev + " " + text);
    };

    recognition.onerror = () => {
      alert("Voice error");
    };
  };

  const evaluateAllAnswers = (answers) => {
    let score = 0;
    let skills = [];
    let suggestion = "";
    let reason = "";
    let confidence = "Low";

    const text = answers.join(" ").toLowerCase();

    if (text.includes("helmet")) {
      score += 3;
      skills.push("Safety Gear");
    }
    if (text.includes("gloves")) {
      score += 2;
      skills.push("Protection");
    }
    if (text.includes("check")) {
      score += 2;
      skills.push("Awareness");
    }
    if (text.includes("emergency")) {
      score += 2;
      skills.push("Emergency Handling");
    }

    if (image) score += 1;

    if (score >= 7) {
      suggestion = "Good, but can improve protective equipment usage";
      reason = "Candidate gave structured and safety-aware response";
      confidence = "High";
    } else {
      suggestion = "Needs improvement in safety practices";
      reason = "Basic knowledge detected but lacks depth";
    }

    return { score, skills, suggestion, reason, confidence };
  };

  const handleNext = () => {
    if (!answer && !image) {
      alert("Provide answer via voice, text, or image");
      return;
    }

    const updated = [...allAnswers, answer];
    setAllAnswers(updated);

    setAnswer("");
    setImage(null);

    if (questionIndex === questions.length - 1) {
      setLoading(true);

      const result = evaluateAllAnswers(updated);

      setTimeout(() => {
        setLoading(false);

        navigate("/result", {
          state: {
            job,
            language,
            name,
            district,
            answer: updated.join(" | "),
            ...result
          }
        });
      }, 2000);
    } else {
      setQuestionIndex(questionIndex + 1);
    }
  };

 return (
  <>
    <Navbar />
    <div className="card">
     <div className="page-center">
      <div className="interview-container">

        <h2 className="title">
          Interview ({questionIndex + 1}/{questions.length})
        </h2>

        {/* Candidate Info */}
       <div className="user-info">
        <div style={{ marginBottom: "15px", fontSize: "14px", color: "#eee" }}>
          <p><b>Name:</b> {name}</p>
          <p><b>District:</b> {district}</p>
          <p><b>Job:</b> {job}</p>
        </div>
        </div>

        {/* Question */}
        <h3>{questions[questionIndex]}</h3>

        {/* Camera Section */}
        {!image ? (
          <>
            <div className="video-box">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                height="100%"
              />
            </div>

            <button className="glow-btn capture-btn" onClick={capture}>
              📸 Capture
            </button>
          </>
        ) : (
          <>
            <img
              src={image}
              alt="capture"
              style={{
                width: "100%",
                maxWidth: "350px",
                borderRadius: "12px"
              }}
            />

            <br /><br />

            <button className="glow-btn" onClick={() => setImage(null)}>
              🔄 Retake
            </button>
          </>
        )}
 
        {/* Answer Box */}
       <div className="answer-box">
        <textarea
          className="text-area"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer..."
        />
        </div>

        {/* Voice Button */}
        <div style={{ marginTop: "10px" }}>
          <button className="glow-btn capture-btn" onClick={startListening}>
            🎤 Speak
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <p style={{ marginTop: "10px", color: "#ddd" }}>
            ⏳ Analyzing...
          </p>
        )}

        {/* Next Button */}
        <button
          className="glow-btn start-btn"
          onClick={handleNext}
          disabled={loading}
        >
          {questionIndex === questions.length - 1
            ? (loading ? "Analyzing..." : "Submit Interview")
            : "Next Question"}
        </button>
       </div>
      </div>
      </div>
  </>
);
}

export default Interview;