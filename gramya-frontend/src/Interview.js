import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { useNavigate, useLocation } from "react-router-dom";
import FraudMonitor from "./FraudMonitor";
import "./App.css";

function Interview() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const { job, language, name, district } = location.state || {};

  // Generate stable IDs for this session
  const candidateId = useRef(`cand_${name || "guest"}_${Date.now()}`).current;
  const sessionId   = useRef(`sess_${Date.now()}`).current;

  const webcamRef    = useRef(null);
  const fraudMonRef  = useRef(null); // exposes submitFraudCheck

  const [image,         setImage]         = useState(null);
  const [answer,        setAnswer]        = useState("");
  const [allAnswers,    setAllAnswers]    = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [started,       setStarted]       = useState(false); // delay monitoring until started

  const questions = [
    "How do you ensure safety while working?",
    "What tools do you use in your job?",
    "How do you handle emergency situations?",
  ];

  const capture = () => {
    const img = webcamRef.current?.getScreenshot();
    setImage(img);
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "Kannada" ? "kn-IN" : "en-IN";
    recognition.start();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setAnswer((prev) => prev + " " + text);
    };

    recognition.onerror = () => alert("Voice error — please try again.");
  };

  const evaluateAllAnswers = (answers) => {
    let score = 0;
    const skills = [];
    let confidence = "Low";

    const text = answers.join(" ").toLowerCase();
    if (text.includes("helmet"))   { score += 3; skills.push("Safety Gear"); }
    if (text.includes("gloves"))   { score += 2; skills.push("Protection"); }
    if (text.includes("check"))    { score += 2; skills.push("Awareness"); }
    if (text.includes("emergency")){ score += 2; skills.push("Emergency Handling"); }
    if (image) score += 1;

    const suggestion = score >= 7
      ? "Good, but can improve protective equipment usage"
      : "Needs improvement in safety practices";
    const reason = score >= 7
      ? "Candidate gave structured and safety-aware response"
      : "Basic knowledge detected but lacks depth";

    if (score >= 7) confidence = "High";
    else if (score >= 4) confidence = "Medium";

    return { score, skills, suggestion, reason, confidence };
  };

  const handleNext = useCallback(async () => {
    if (!answer && !image) {
      alert("Provide answer via voice, text, or image.");
      return;
    }

    const updated = [...allAnswers, answer];
    setAllAnswers(updated);
    setAnswer("");
    setImage(null);

    if (questionIndex === questions.length - 1) {
      setLoading(true);

      // Run fraud check concurrently with evaluation
      const [result, fraudResult] = await Promise.all([
        Promise.resolve(evaluateAllAnswers(updated)),
        fraudMonRef.current
          ? fraudMonRef.current.submitFraudCheck()
          : Promise.resolve({ fraudScore: 0, riskTier: "safe", events: [] }),
      ]);

      setLoading(false);

      navigate("/result", {
        state: {
          job,
          language,
          name,
          district,
          answer: updated.join(" | "),
          // Assessment result
          ...result,
          // Fraud result
          fraudScore:        fraudResult?.fraudScore    ?? 0,
          fraudRiskTier:     fraudResult?.riskTier      ?? "safe",
          fraudEvents:       fraudResult?.events        ?? [],
          livenessVerified:  fraudResult?.livenessVerified ?? false,
          duplicateSuspected: fraudResult?.duplicateSuspected ?? false,
        },
      });
    } else {
      setQuestionIndex(questionIndex + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, image, allAnswers, questionIndex]);

  return (
    <FraudMonitor
      ref={fraudMonRef}
      candidateId={candidateId}
      sessionId={sessionId}
      webcamRef={webcamRef}
      interviewActive={started}
      onFraudComplete={null} /* handled inline in handleNext */
    >
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

            {/* Start button — begins fraud monitoring */}
            {!started && (
              <button
                className="glow-btn start-btn"
                style={{ marginBottom: 16 }}
                onClick={() => setStarted(true)}
              >
                🛡 Start Secure Interview
              </button>
            )}

            {/* Question */}
            <h3>{questions[questionIndex]}</h3>

            {/* Camera */}
            {!image ? (
              <>
                <div className="video-box">
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width="100%"
                    height="100%"
                    audio={false}
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
                  style={{ width: "100%", maxWidth: "350px", borderRadius: "12px" }}
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
                placeholder="Type your answer…"
              />
            </div>

            {/* Voice */}
            <div style={{ marginTop: "10px" }}>
              <button className="glow-btn capture-btn" onClick={startListening}>
                🎤 Speak
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <p style={{ marginTop: "10px", color: "#ddd" }}>
                ⏳ Analyzing response & running fraud check…
              </p>
            )}

            {/* Next / Submit */}
            <button
              className="glow-btn start-btn"
              onClick={handleNext}
              disabled={loading || !started}
            >
              {questionIndex === questions.length - 1
                ? loading ? "Analyzing…" : "Submit Interview"
                : "Next Question"}
            </button>

          </div>
        </div>
      </div>
    </FraudMonitor>
  );
}

export default Interview;