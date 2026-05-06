/**
 * AdminFraudDashboard.js
 * ─────────────────────────────────────────────────────────────────
 * Admin-only page for reviewing AI fraud detection results.
 *
 * Features:
 *  • Stats row: total / safe / review / high-risk counts
 *  • Filterable, sortable alert table
 *  • Right-side detail panel: score meter, event timeline, info grid
 *  • Review actions: mark as reviewed, add notes, flag for rejection
 *  • Auto-refreshes every 30s
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminFraudDashboard.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

// ─── Constants ──────────────────────────────────────────────────
const TIER_META = {
  safe:      { label: "✅ Safe",      emoji: "✅", cls: "safe"      },
  review:    { label: "⚠️ Review",    emoji: "⚠️", cls: "review"    },
  high_risk: { label: "🔴 High Risk", emoji: "🔴", cls: "high_risk" },
};

const EVENT_ICONS = {
  tab_switch:       "⚡",
  fullscreen_exit:  "⛶",
  face_absent:      "👤",
  multiple_faces:   "👥",
  liveness_failed:  "🚨",
  voice_mismatch:   "🎙️",
  duplicate_face:   "🪪",
  background_noise: "🔊",
};

// ─── Mock data for offline/dev preview ──────────────────────────
const MOCK_ALERTS = [
  {
    candidate_id: "cand_Ravi_1714987200000",
    total_score: 75,
    risk_tier: "high_risk",
    event_count: 4,
    duplicate_suspected: true,
    reviewed: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    candidate_id: "cand_Priya_1714983600000",
    total_score: 45,
    risk_tier: "review",
    event_count: 2,
    duplicate_suspected: false,
    reviewed: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    candidate_id: "cand_Arun_1714980000000",
    total_score: 15,
    risk_tier: "safe",
    event_count: 1,
    duplicate_suspected: false,
    reviewed: true,
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    candidate_id: "cand_Meera_1714976400000",
    total_score: 85,
    risk_tier: "high_risk",
    event_count: 5,
    duplicate_suspected: true,
    reviewed: false,
    created_at: new Date(Date.now() - 14400000).toISOString(),
  },
];

const MOCK_REPORTS = {
  "cand_Ravi_1714987200000": {
    candidate_id: "cand_Ravi_1714987200000",
    total_score: 75,
    risk_tier: "high_risk",
    event_count: 4,
    liveness_verified: false,
    voice_match_score: 0.61,
    duplicate_suspected: true,
    reviewed: false,
    reviewer_notes: null,
    events: [
      { time: "00:14", event: "tab_switch",     delta: 15, detail: "Candidate switched tab" },
      { time: "02:14", event: "multiple_faces", delta: 40, detail: "2 faces in frame" },
      { time: "03:22", event: "voice_mismatch", delta: 30, detail: "Score 0.61 below threshold" },
      { time: "05:00", event: "duplicate_face", delta: 50, detail: "Matches cand_Arun" },
    ],
  },
  "cand_Priya_1714983600000": {
    candidate_id: "cand_Priya_1714983600000",
    total_score: 45,
    risk_tier: "review",
    event_count: 2,
    liveness_verified: true,
    voice_match_score: 0.88,
    duplicate_suspected: false,
    reviewed: false,
    reviewer_notes: null,
    events: [
      { time: "01:05", event: "tab_switch",    delta: 15, detail: "Minimized window" },
      { time: "04:30", event: "face_absent",   delta: 20, detail: "Face not in frame for 8s" },
    ],
  },
};

// ─── Helpers ────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function truncId(id) {
  if (!id) return "—";
  const parts = id.split("_");
  return parts.slice(0, 2).join("_") + (parts.length > 2 ? "_…" : "");
}

// ─── Component ──────────────────────────────────────────────────
export default function AdminFraudDashboard() {
  const navigate = useNavigate();

  const [alerts,       setAlerts]       = useState([]);
  const [selected,     setSelected]     = useState(null);     // candidate_id
  const [report,       setReport]       = useState(null);
  const [filter,       setFilter]       = useState("all");    // all | safe | review | high_risk
  const [search,       setSearch]       = useState("");
  const [reviewNotes,  setReviewNotes]  = useState("");
  const [loading,      setLoading]      = useState(true);
  const [reportLoading,setReportLoading]= useState(false);
  const [saving,       setSaving]       = useState(false);
  const [spinning,     setSpinning]     = useState(false);
  const [useMock,      setUseMock]      = useState(false);

  // ── Fetch alerts ─────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    setSpinning(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("risk_tier", filter);
      params.set("limit", "100");

      const res = await fetch(`${API_BASE}/fraud/alerts?${params}`);
      if (!res.ok) throw new Error("non-200");
      const data = await res.json();
      setAlerts(data);
      setUseMock(false);
    } catch (_) {
      // Backend unavailable — show mock data for preview
      let data = [...MOCK_ALERTS];
      if (filter !== "all") data = data.filter((a) => a.risk_tier === filter);
      setAlerts(data);
      setUseMock(true);
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }, [filter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(fetchAlerts, 30000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  // ── Fetch detail report ───────────────────────────────────────
  const fetchReport = useCallback(async (candidateId) => {
    setReportLoading(true);
    try {
      const res = await fetch(`${API_BASE}/fraud/report/${candidateId}`);
      if (!res.ok) throw new Error("non-200");
      const data = await res.json();
      setReport(data);
      setReviewNotes(data.reviewer_notes || "");
    } catch (_) {
      // Use mock
      const mock = MOCK_REPORTS[candidateId] || null;
      setReport(mock);
      setReviewNotes(mock?.reviewer_notes || "");
    } finally {
      setReportLoading(false);
    }
  }, []);

  const handleSelectRow = (candidateId) => {
    setSelected(candidateId);
    fetchReport(candidateId);
  };

  // ── Review action ─────────────────────────────────────────────
  const handleReview = async (reviewed) => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/fraud/report/${selected}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewed, reviewer_notes: reviewNotes }),
      });
    } catch (_) {}

    // Update local state optimistically
    setAlerts((prev) =>
      prev.map((a) => a.candidate_id === selected ? { ...a, reviewed } : a)
    );
    setReport((prev) => prev ? { ...prev, reviewed, reviewer_notes: reviewNotes } : prev);
    setSaving(false);
  };

  // ── Filter + search ──────────────────────────────────────────
  const displayed = alerts.filter((a) => {
    if (search && !a.candidate_id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── Stats ────────────────────────────────────────────────────
  const stats = {
    total:     alerts.length,
    safe:      alerts.filter((a) => a.risk_tier === "safe").length,
    review:    alerts.filter((a) => a.risk_tier === "review").length,
    high_risk: alerts.filter((a) => a.risk_tier === "high_risk").length,
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="afd-page">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="afd-header">
        <div className="afd-header-left">
          <div className="afd-shield-icon">🛡️</div>
          <div>
            <div className="afd-header-title">Fraud Integrity Monitor</div>
            <div className="afd-header-sub">
              AI-powered interview fraud detection · Admin review panel
              {useMock && <span style={{ color: "var(--afd-warn)", marginLeft: 8 }}>⚠ Preview mode (backend offline)</span>}
            </div>
          </div>
        </div>

        <div className="afd-header-right">
          <button
            className={`afd-refresh-btn ${spinning ? "spinning" : ""}`}
            onClick={fetchAlerts}
            title="Refresh"
          >
            {spinning ? "↻" : "↻ Refresh"}
          </button>
          <button className="afd-back-btn" onClick={() => navigate("/dashboard")}>
            ← Dashboard
          </button>
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────── */}
      <div className="afd-stats-row">
        {[
          { key: "total",     label: "Total Cases",  val: stats.total },
          { key: "safe",      label: "✅ Safe",       val: stats.safe },
          { key: "review",    label: "⚠️ Needs Review", val: stats.review },
          { key: "high_risk", label: "🔴 High Risk",  val: stats.high_risk },
        ].map((s) => (
          <div key={s.key} className={`afd-stat-card ${s.key}`}>
            <div className="afd-stat-label">{s.label}</div>
            <div className="afd-stat-value">{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ────────────────────────────────────── */}
      <div className="afd-filter-bar">
        {["all", "safe", "review", "high_risk"].map((f) => (
          <button
            key={f}
            className={`afd-filter-btn ${f} ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All Cases" :
             f === "safe" ? "✅ Safe" :
             f === "review" ? "⚠️ Review" : "🔴 High Risk"}
          </button>
        ))}
        <div className="afd-filter-spacer" />
        <input
          className="afd-search"
          placeholder="🔍 Search candidate ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Main Content ──────────────────────────────────── */}
      <div className="afd-main">

        {/* Left — Alert table */}
        <div className="afd-left-panel">
          {loading ? (
            <div className="afd-loading">
              <div className="afd-spinner" />
              <span>Loading fraud data…</span>
            </div>
          ) : displayed.length === 0 ? (
            <div className="afd-no-data">
              <div className="afd-no-data-icon">🎉</div>
              <div>No fraud alerts found</div>
            </div>
          ) : (
            <div className="afd-table-wrap">
              <table className="afd-table">
                <thead>
                  <tr>
                    <th>Candidate ID</th>
                    <th>Score</th>
                    <th>Risk Tier</th>
                    <th>Events</th>
                    <th>Duplicate</th>
                    <th>Reviewed</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((a) => {
                    const tier = TIER_META[a.risk_tier] || TIER_META.safe;
                    return (
                      <tr
                        key={a.candidate_id}
                        className={selected === a.candidate_id ? "selected" : ""}
                        onClick={() => handleSelectRow(a.candidate_id)}
                      >
                        <td>
                          <div className="afd-cand-id" title={a.candidate_id}>
                            {truncId(a.candidate_id)}
                          </div>
                        </td>
                        <td>
                          <span className={`afd-score-cell ${a.risk_tier}`}>
                            {a.total_score}
                          </span>
                        </td>
                        <td>
                          <span className={`afd-tier-badge ${tier.cls}`}>
                            {tier.emoji} {a.risk_tier === "high_risk" ? "High Risk" : a.risk_tier.charAt(0).toUpperCase() + a.risk_tier.slice(1)}
                          </span>
                        </td>
                        <td style={{ fontFamily: "var(--afd-mono)", fontSize: 13 }}>
                          {a.event_count}
                        </td>
                        <td>
                          {a.duplicate_suspected
                            ? <span style={{ color: "var(--afd-danger)", fontWeight: 700 }}>🪪 Yes</span>
                            : <span style={{ color: "var(--afd-muted)" }}>—</span>
                          }
                        </td>
                        <td>
                          <span className={`afd-reviewed-chip ${a.reviewed ? "yes" : "no"}`}>
                            {a.reviewed ? "✓ Done" : "Pending"}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, color: "var(--afd-muted)", whiteSpace: "nowrap" }}>
                          {fmtDate(a.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right — Detail panel */}
        <div className="afd-right-panel">
          {!selected ? (
            <div className="afd-detail-empty">
              <div className="afd-detail-empty-icon">👈</div>
              <div>Select a candidate to review their fraud report</div>
            </div>
          ) : reportLoading ? (
            <div className="afd-loading">
              <div className="afd-spinner" />
              <span>Loading report…</span>
            </div>
          ) : !report ? (
            <div className="afd-detail-empty">
              <div className="afd-detail-empty-icon">📄</div>
              <div>No report found for this candidate</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="afd-detail-header">
                <div className="afd-detail-cand-id">{report.candidate_id}</div>
                <div className="afd-detail-risk-row">
                  <span className={`afd-tier-badge ${report.risk_tier}`}>
                    {TIER_META[report.risk_tier]?.emoji} {
                      report.risk_tier === "high_risk" ? "High Risk" :
                      report.risk_tier.charAt(0).toUpperCase() + report.risk_tier.slice(1)
                    }
                  </span>
                  {report.duplicate_suspected && (
                    <span style={{ color: "var(--afd-danger)", fontSize: 12, fontWeight: 700 }}>
                      🪪 Duplicate Suspected
                    </span>
                  )}
                  {report.liveness_verified && (
                    <span style={{ color: "var(--afd-safe)", fontSize: 12, fontWeight: 700 }}>
                      👁 Liveness ✓
                    </span>
                  )}
                </div>

                {/* Score meter */}
                <div className="afd-score-meter">
                  <div className="afd-score-meter-label">
                    <span>Fraud Score</span>
                    <span style={{ fontFamily: "var(--afd-mono)", fontWeight: 700 }}>
                      {report.total_score} / 100
                    </span>
                  </div>
                  <div className="afd-score-bar">
                    <div
                      className={`afd-score-fill ${report.risk_tier}`}
                      style={{ width: `${Math.min(report.total_score, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div className="afd-info-grid">
                <div className="afd-info-item">
                  <div className="afd-info-item-label">Total Events</div>
                  <div className="afd-info-item-value">{report.event_count}</div>
                </div>
                <div className="afd-info-item">
                  <div className="afd-info-item-label">Voice Match</div>
                  <div className="afd-info-item-value" style={{
                    color: report.voice_match_score != null
                      ? (report.voice_match_score >= 0.75 ? "var(--afd-safe)" : "var(--afd-danger)")
                      : "var(--afd-muted)"
                  }}>
                    {report.voice_match_score != null
                      ? `${(report.voice_match_score * 100).toFixed(0)}%`
                      : "N/A"}
                  </div>
                </div>
                <div className="afd-info-item">
                  <div className="afd-info-item-label">Liveness</div>
                  <div className="afd-info-item-value" style={{
                    color: report.liveness_verified ? "var(--afd-safe)" : "var(--afd-warn)"
                  }}>
                    {report.liveness_verified ? "Verified" : "Not verified"}
                  </div>
                </div>
                <div className="afd-info-item">
                  <div className="afd-info-item-label">Duplicate</div>
                  <div className="afd-info-item-value" style={{
                    color: report.duplicate_suspected ? "var(--afd-danger)" : "var(--afd-safe)"
                  }}>
                    {report.duplicate_suspected ? "Suspected" : "None"}
                  </div>
                </div>
              </div>

              {/* Event timeline */}
              <div className="afd-timeline-title">📋 Fraud Event Timeline</div>
              <div className="afd-timeline">
                {(!report.events || report.events.length === 0) ? (
                  <div style={{ color: "var(--afd-muted)", fontSize: 13 }}>No events recorded</div>
                ) : (
                  report.events.map((e, i) => (
                    <div key={i} className="afd-timeline-item">
                      <div className="afd-tl-time">{e.time || "N/A"}</div>
                      <div className="afd-tl-event">
                        <strong>
                          {EVENT_ICONS[e.event] || "⚠️"} {
                            (e.event || "unknown")
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())
                          }
                        </strong>
                        {e.detail && <span>{e.detail}</span>}
                      </div>
                      <div className="afd-tl-delta">+{e.delta}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Review section */}
              <div className="afd-review-section">
                <div className="afd-review-title">🖊 Admin Review</div>
                <textarea
                  className="afd-review-notes"
                  placeholder="Add reviewer notes…"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
                <div className="afd-review-btns">
                  <button
                    className="afd-btn afd-btn-safe"
                    onClick={() => handleReview(true)}
                    disabled={saving}
                  >
                    ✓ Mark Reviewed
                  </button>
                  <button
                    className="afd-btn afd-btn-primary"
                    onClick={() => handleReview(false)}
                    disabled={saving}
                  >
                    🔄 Reset Review
                  </button>
                  <button
                    className="afd-btn afd-btn-danger"
                    onClick={() => {
                      setReviewNotes((n) => n + "\n[FLAGGED FOR REJECTION]");
                      handleReview(true);
                    }}
                    disabled={saving}
                  >
                    🚫 Flag Rejection
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
