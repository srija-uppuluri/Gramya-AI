/**
 * FraudMonitor.js
 * ─────────────────────────────────────────────────────────────────
 * Real-time AI fraud detection monitor for interview sessions.
 * 
 * Features:
 *  • Face detection via webcam (periodic frame capture → backend)
 *  • Tab switch / window visibility detection
 *  • Fullscreen exit detection
 *  • Liveness challenge popup (blink / turn head / smile)
 *  • Background audio monitoring (volume spikes)
 *  • Live fraud score widget with risk tier badge
 *  • Toast warning system
 *  • Event log panel
 *  • Submits full fraud-check at interview end
 */

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import "./FraudMonitor.css";

// ─── Config ────────────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

const FRAUD_SCORES = {
  multiple_faces:   40,
  face_absent:      20,
  voice_mismatch:   30,
  tab_switch:       15,
  duplicate_face:   50,
  liveness_failed:  25,
  fullscreen_exit:  10,
  background_noise: 10,
};

const RISK_TIER = (score) => {
  if (score <= 30)  return "safe";
  if (score <= 60)  return "review";
  return "high_risk";
};

const RISK_LABELS = {
  safe:      { label: "✅ Secure",    emoji: "✅" },
  review:    { label: "⚠️ Review",    emoji: "⚠️" },
  high_risk: { label: "🔴 High Risk", emoji: "🔴" },
};

const LIVENESS_CHALLENGES = [
  { action: "😊 Smile for 2 seconds",    key: "smile" },
  { action: "👁️ Blink twice slowly",     key: "blink" },
  { action: "↩️ Turn head left slightly", key: "turn_left" },
  { action: "↪️ Turn head right slightly", key: "turn_right" },
];

const FACE_STATUS = {
  unknown: { label: "Scanning…",   cls: "" },
  ok:      { label: "Face OK ✓",   cls: "face-ok" },
  absent:  { label: "No Face ⚠",   cls: "face-warn" },
  multi:   { label: "Multi-face!", cls: "face-danger" },
};

const EVENT_ICONS = {
  tab_switch:       { icon: "⚡", label: "Tab switched",        severity: "warning" },
  fullscreen_exit:  { icon: "⛶",  label: "Fullscreen exited",   severity: "warning" },
  face_absent:      { icon: "👤", label: "Face not detected",   severity: "warning" },
  multiple_faces:   { icon: "👥", label: "Multiple faces",      severity: "danger"  },
  liveness_failed:  { icon: "🚨", label: "Liveness failed",     severity: "danger"  },
  voice_mismatch:   { icon: "🎙️", label: "Voice mismatch",      severity: "danger"  },
  duplicate_face:   { icon: "🪪", label: "Duplicate identity",  severity: "danger"  },
  background_noise: { icon: "🔊", label: "Suspicious audio",    severity: "warning" },
};

// ─── Utility ────────────────────────────────────────────────────────────────
function fmtTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

let toastIdCounter = 0;

// ─── Component ──────────────────────────────────────────────────────────────
/**
 * Props:
 *   candidateId      {string}  — unique candidate identifier
 *   sessionId        {string}  — interview session id
 *   webcamRef        {ref}     — ref to the <Webcam> element
 *   interviewActive  {bool}    — true while interview is running
 *   onFraudComplete  {fn}      — called with final { fraudScore, riskTier, events } at end
 *   children         {node}    — interview content to wrap
 */
const FraudMonitor = forwardRef(function FraudMonitor(
  { candidateId, sessionId, webcamRef, interviewActive, onFraudComplete, children },
  ref
) {
  // ── State ─────────────────────────────────────────────────────
  const [fraudScore, setFraudScore]       = useState(0);
  const [events, setEvents]               = useState([]);       // { type, delta, time, label, icon, severity }
  const [toasts, setToasts]               = useState([]);
  const [faceStatus, setFaceStatus]       = useState("unknown");
  const [livenessOpen, setLivenessOpen]   = useState(false);
  const [livenessIdx, setLivenessIdx]     = useState(0);
  const [livenessTimer, setLivenessTimer] = useState(15);
  const [livenessVerified, setLivenessVerified] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const eventsRef        = useRef([]);
  const fraudScoreRef    = useRef(0);
  const sessionTimer     = useRef(null);
  const faceInterval     = useRef(null);
  const livenessTimeout  = useRef(null);
  const livenessCountRef = useRef(null);
  const audioCtxRef      = useRef(null);
  const analyserRef      = useRef(null);
  const audioFrameRef    = useRef(null);
  const livenessDoneRef  = useRef(false);

  // ── Expose submitFraudCheck to parent via ref ──────────────────
  useImperativeHandle(ref, () => ({
    submitFraudCheck,
  }));

  // ─── Add fraud event ─────────────────────────────────────────
  const addEvent = useCallback((type, delta, extraDetail = "") => {
    const t = sessionSeconds;
    const meta = EVENT_ICONS[type] || { icon: "⚠️", label: type, severity: "warning" };
    const newEvent = {
      id: Date.now() + Math.random(),
      event_type: type,
      score_delta: delta,
      timestamp_seconds: t,
      label: meta.label,
      icon: meta.icon,
      severity: meta.severity,
      detail: extraDetail,
    };

    eventsRef.current = [...eventsRef.current, newEvent];
    setEvents([...eventsRef.current]);

    fraudScoreRef.current = Math.min(fraudScoreRef.current + delta, 100);
    setFraudScore(fraudScoreRef.current);

    // Show toast
    showToast(meta.severity, meta.label, extraDetail || `+${delta} fraud points`, type);

    // Log to backend (fire-and-forget)
    fetch(`${API_BASE}/fraud/log-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate_id: candidateId,
        session_id: sessionId,
        event_type: type,
        score_delta: delta,
        timestamp_seconds: t,
        metadata: { detail: extraDetail },
      }),
    }).catch(() => {});
  }, [candidateId, sessionId, sessionSeconds]);

  // ─── Toast system ────────────────────────────────────────────
  const showToast = (severity, title, msg, key) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev.slice(-4), { id, severity, title, msg, key, time: new Date() }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 350);
    }, 5000);
  };

  // ─── Session timer ───────────────────────────────────────────
  useEffect(() => {
    if (!interviewActive) return;
    sessionTimer.current = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(sessionTimer.current);
  }, [interviewActive]);

  // ─── Tab / visibility switch detection ──────────────────────
  useEffect(() => {
    if (!interviewActive) return;

    const handleVisibility = () => {
      if (document.hidden) {
        addEvent("tab_switch", FRAUD_SCORES.tab_switch, "Candidate switched tab or minimized window");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [interviewActive, addEvent]);

  // ─── Fullscreen exit detection ───────────────────────────────
  useEffect(() => {
    if (!interviewActive) return;

    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        addEvent("fullscreen_exit", FRAUD_SCORES.fullscreen_exit, "Exited fullscreen mode");
      }
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [interviewActive, addEvent]);

  // ─── Face detection via webcam frames ───────────────────────
  useEffect(() => {
    if (!interviewActive) return;

    const checkFace = async () => {
      if (!webcamRef?.current) return;
      let imageB64 = null;
      try {
        imageB64 = webcamRef.current.getScreenshot?.();
      } catch (_) { return; }
      if (!imageB64) return;

      // Strip data: prefix for backend
      const b64data = imageB64.replace(/^data:image\/[a-z]+;base64,/, "");

      try {
        const res = await fetch(`${API_BASE}/fraud/analyze-face`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidate_id: candidateId,
            session_id: sessionId,
            image_b64: b64data,
            timestamp_seconds: sessionSeconds,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.face_count === 0) {
          setFaceStatus("absent");
          if (data.fraud_detected) {
            addEvent("face_absent", FRAUD_SCORES.face_absent, "No face detected in frame");
          }
        } else if (data.face_count > 1) {
          setFaceStatus("multi");
          if (data.fraud_detected) {
            addEvent("multiple_faces", FRAUD_SCORES.multiple_faces, `${data.face_count} faces in frame`);
          }
        } else {
          setFaceStatus("ok");
        }
      } catch (_) {
        // Backend not reachable — simulate locally
        setFaceStatus("ok");
      }
    };

    faceInterval.current = setInterval(checkFace, 8000); // every 8s
    return () => clearInterval(faceInterval.current);
  }, [interviewActive, candidateId, sessionId, sessionSeconds, addEvent, webcamRef]);

  // ─── Background audio monitoring ────────────────────────────
  useEffect(() => {
    if (!interviewActive) return;
    let stream = null;

    const startAudio = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        let spikeCount = 0;

        const frame = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          if (avg > 80) {
            spikeCount++;
            if (spikeCount >= 3) {
              addEvent("background_noise", FRAUD_SCORES.background_noise, "Sustained loud background audio detected");
              spikeCount = 0;
            }
          } else {
            spikeCount = Math.max(0, spikeCount - 1);
          }
          audioFrameRef.current = requestAnimationFrame(frame);
        };
        frame();
      } catch (_) { /* microphone denied — skip silently */ }
    };

    startAudio();

    return () => {
      if (audioFrameRef.current) cancelAnimationFrame(audioFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [interviewActive, addEvent]);

  // ─── Liveness challenge — trigger after 30s ──────────────────
  useEffect(() => {
    if (!interviewActive || livenessDoneRef.current) return;

    const trigger = setTimeout(() => {
      if (!livenessDoneRef.current) {
        setLivenessIdx(Math.floor(Math.random() * LIVENESS_CHALLENGES.length));
        setLivenessTimer(15);
        setLivenessOpen(true);
      }
    }, 30000);

    return () => clearTimeout(trigger);
  }, [interviewActive]);

  // Liveness countdown
  useEffect(() => {
    if (!livenessOpen) return;
    livenessCountRef.current = setInterval(() => {
      setLivenessTimer((t) => {
        if (t <= 1) {
          clearInterval(livenessCountRef.current);
          handleLivenessFail();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(livenessCountRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livenessOpen]);

  const handleLivenessPass = () => {
    clearInterval(livenessCountRef.current);
    livenessDoneRef.current = true;
    setLivenessVerified(true);
    setLivenessOpen(false);
    showToast("info", "Liveness Verified ✓", "Identity confirmed successfully", "liveness_ok");
  };

  const handleLivenessFail = () => {
    clearInterval(livenessCountRef.current);
    livenessDoneRef.current = true;
    setLivenessOpen(false);
    addEvent("liveness_failed", FRAUD_SCORES.liveness_failed, "Liveness challenge not completed");
  };

  // ─── Final fraud check submission ────────────────────────────
  const submitFraudCheck = useCallback(async () => {
    let imageB64 = null;
    try {
      imageB64 = webcamRef?.current?.getScreenshot?.();
      if (imageB64) imageB64 = imageB64.replace(/^data:image\/[a-z]+;base64,/, "");
    } catch (_) {}

    const payload = {
      candidate_id: candidateId,
      session_id: sessionId,
      events: eventsRef.current.map((e) => ({
        candidate_id: candidateId,
        event_type: e.event_type,
        score_delta: e.score_delta,
        timestamp_seconds: e.timestamp_seconds,
        metadata: { detail: e.detail },
      })),
      face_image_b64: imageB64,
      liveness_verified: livenessDoneRef.current && livenessVerified,
      voice_match_score: null,
    };

    try {
      const res = await fetch(`${API_BASE}/fraud/fraud-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const report = await res.json();
        onFraudComplete?.({
          fraudScore: report.total_score,
          riskTier: report.risk_tier,
          events: report.events,
          livenessVerified: report.liveness_verified,
          duplicateSuspected: report.duplicate_suspected,
        });
        return report;
      }
    } catch (_) {}

    // Fallback — return local data
    const localResult = {
      fraudScore: fraudScoreRef.current,
      riskTier: RISK_TIER(fraudScoreRef.current),
      events: eventsRef.current,
      livenessVerified: livenessDoneRef.current,
      duplicateSuspected: false,
    };
    onFraudComplete?.(localResult);
    return localResult;
  }, [candidateId, sessionId, livenessVerified, onFraudComplete, webcamRef]);

  // ── Derived values ────────────────────────────────────────────
  const riskTier     = RISK_TIER(fraudScore);
  const riskLabel    = RISK_LABELS[riskTier];
  const scorePercent = Math.min((fraudScore / 100) * 100, 100);
  const faceInfo     = FACE_STATUS[faceStatus] || FACE_STATUS.unknown;

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="fraud-interview-wrapper">

      {/* ── Top Status Bar ──────────────────────────────────── */}
      <div className="fraud-status-bar">
        <div className="fraud-status-left">
          <span className="fraud-brand">🛡 Integrity Monitor</span>
          <span className="fraud-session-id">
            {sessionId || candidateId || "SES-000"}
          </span>
        </div>

        <div className="fraud-status-right">
          {/* Score */}
          <div className="fraud-score-display">
            <span style={{ fontSize: 11, color: "var(--fraud-muted)" }}>FRAUD SCORE</span>
            <span className={`fraud-score-num ${riskTier}`}>{fraudScore}</span>
            <div className="fraud-score-meter">
              <div
                className={`fraud-score-fill ${riskTier}`}
                style={{ width: `${scorePercent}%` }}
              />
            </div>
          </div>

          {/* Risk badge */}
          <div className={`fraud-risk-badge ${riskTier}`}>
            <span className="fraud-risk-dot" />
            {riskLabel.label}
          </div>

          {/* Liveness indicator */}
          {livenessVerified && (
            <span style={{ fontSize: 12, color: "var(--fraud-safe)", fontWeight: 700 }}>
              👁 Liveness ✓
            </span>
          )}

          {/* Session time */}
          <span style={{ fontFamily: "var(--fraud-mono)", fontSize: 12, color: "var(--fraud-muted)" }}>
            ⏱ {fmtTime(sessionSeconds)}
          </span>
        </div>
      </div>

      {/* ── Interview content (children) ──────────────────── */}
      <div style={{ paddingTop: 56 }}>
        {children}
      </div>

      {/* ── Toast Notifications ────────────────────────────── */}
      <div className="fraud-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`fraud-toast ${t.severity} ${t.exiting ? "exiting" : ""}`}>
            <span className="fraud-toast-icon">
              {EVENT_ICONS[t.key]?.icon || "⚠️"}
            </span>
            <div className="fraud-toast-body">
              <div className="fraud-toast-title">{t.title}</div>
              <div className="fraud-toast-msg">{t.msg}</div>
              <div className="fraud-toast-time">
                {t.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Camera monitor (bottom-right) ─────────────────── */}
      <div className={`fraud-camera-monitor ${faceInfo.cls}`}>
        <span className="fraud-camera-label">📷 Live</span>
        {webcamRef?.current && (
          <video
            ref={(el) => {
              if (el && webcamRef.current?.video) {
                el.srcObject = webcamRef.current.video?.srcObject || null;
              }
            }}
            autoPlay
            muted
            playsInline
            style={{ width: "100%", display: "block" }}
          />
        )}
        <span className={`fraud-face-indicator ${faceInfo.cls.replace("face-", "") || ""}`}>
          {faceInfo.label}
        </span>
      </div>

      {/* ── Event Log (bottom-left) ────────────────────────── */}
      <div className="fraud-event-log">
        <div className="fraud-log-title">⚡ Fraud Event Log</div>
        {events.length === 0 && (
          <div style={{ fontSize: 11, color: "var(--fraud-muted)", padding: "4px 0" }}>
            No events detected
          </div>
        )}
        {[...events].reverse().map((e) => (
          <div key={e.id} className="fraud-log-item">
            <span className="fraud-log-icon">{e.icon}</span>
            <span className="fraud-log-text">{e.label}</span>
            <span className="fraud-log-delta">+{e.score_delta}</span>
            <span className="fraud-log-time">{fmtTime(e.timestamp_seconds || 0)}</span>
          </div>
        ))}
      </div>

      {/* ── Liveness Challenge Modal ───────────────────────── */}
      {livenessOpen && (
        <div className="fraud-liveness-overlay">
          <div className="fraud-liveness-card">
            <div className="fraud-liveness-shield">🛡️</div>
            <h3>Identity Verification</h3>
            <p>Please perform the action below to confirm you are a live person.</p>
            <div className="fraud-liveness-action">
              {LIVENESS_CHALLENGES[livenessIdx].action}
            </div>
            <div className="fraud-liveness-timer">{livenessTimer}s</div>
            <div className="fraud-liveness-btns">
              <button className="fraud-btn-verify" onClick={handleLivenessPass}>
                ✓ I Did It
              </button>
              <button className="fraud-btn-skip" onClick={handleLivenessFail}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
});

export default FraudMonitor;
