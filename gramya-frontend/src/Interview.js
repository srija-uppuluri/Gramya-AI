import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { useNavigate, useLocation } from "react-router-dom";

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
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Interview ({questionIndex + 1}/{questions.length})</h2>

      <p><b>Name:</b> {name}</p>
      <p><b>District:</b> {district}</p>
      <p><b>Job:</b> {job}</p>

      <h3>{questions[questionIndex]}</h3>

      {!image ? (
        <>
          <Webcam ref={webcamRef} screenshotFormat="image/jpeg" width={300} />
          <br />
          <button onClick={capture}>Capture 📸</button>
        </>
      ) : (
        <>
          <img src={image} alt="capture" width={300} />
          <br />
          <button onClick={() => setImage(null)}>Retake</button>
        </>
      )}

      <br /><br />

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type answer..."
        style={{ width: "300px", height: "80px" }}
      />

      <br /><br />

      <button onClick={startListening}>🎤 Speak</button>

      <br /><br />

      {loading && <p>Analyzing...</p>}

      <button onClick={handleNext} disabled={loading}>
        {questionIndex === questions.length - 1
          ? (loading ? "Analyzing..." : "Submit Interview")
          : "Next Question"}
      </button>
    </div>
  );
}

export default Interview;