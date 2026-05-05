import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./jobs.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

const STEPS = ["Pending Review","Under Review","Interview Scheduled","Selected","Rejected"];
const STEP_ICONS = ["📥","🔍","📅","✅","❌"];

const statusClass = (s) => {
  if (s === "Pending Review")        return "status--pending";
  if (s === "Under Review")          return "status--review";
  if (s === "Interview Scheduled")   return "status--interview";
  if (s === "Selected")              return "status--selected";
  if (s === "Rejected")              return "status--rejected";
  return "status--pending";
};

const stepIndex = (status) => STEPS.indexOf(status);

function StatusStepper({ status }) {
  const current = stepIndex(status);
  const isRejected = status === "Rejected";
  const displaySteps = isRejected ? ["Pending Review","Under Review","Rejected"] : STEPS.slice(0,-1);

  return (
    <div className="tracker-stepper">
      {displaySteps.map((step, i) => {
        const done   = isRejected ? (i < 2) : (i < current);
        const active = isRejected ? (i === 2) : (i === current);
        return (
          <div key={step} className="tracker-step">
            <div className={`tracker-step__dot tracker-step__dot--${done?"done":active?"active":"idle"}`}>
              {done ? "✓" : active ? (isRejected && i===2 ? "✕" : i+1) : i+1}
            </div>
            {i < displaySteps.length - 1 && (
              <div className={`tracker-step__line tracker-step__line--${done?"done":"idle"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ApplicationTracker() {
  const navigate = useNavigate();
  const [apps, setApps]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterSt, setFilterSt] = useState("all");

  const userId   = localStorage.getItem("userId");
  const role     = localStorage.getItem("role");

  useEffect(() => {
    if (!userId || role !== "user") { navigate("/login"); return; }
    loadApps();
  }, [userId, role, navigate]);

  const loadApps = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/applications/${userId}`);
      if (res.ok) { setApps(await res.json()); setLoading(false); return; }
    } catch {}
    // localStorage fallback
    const all = JSON.parse(localStorage.getItem("applications") || "[]");
    setApps(all.filter((a) => a.user_id === userId));
    setLoading(false);
  };

  const displayed = filterSt === "all" ? apps : apps.filter((a) => a.status === filterSt);
  const notifications = apps.filter((a) => a.status === "Interview Scheduled" || a.status === "Selected");

  return (
    <div className="tracker-page">
      <div className="tracker-header">
        <span className="jl-eyebrow">📊 Application History</span>
        <h1 className="tracker-title">My Applications</h1>
        <p className="tracker-sub">Track every job you applied for in real time</p>
      </div>

      {/* Notification banner */}
      {notifications.length > 0 && (
        <div style={{ maxWidth:760, margin:"0 auto 20px", background:"linear-gradient(135deg,rgba(34,197,94,0.12),rgba(16,163,127,0.12))", border:"1.5px solid rgba(34,197,94,0.35)", borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:22 }}>🔔</span>
          <div>
            <strong style={{ color:"#065f46", fontSize:14 }}>You have {notifications.length} update{notifications.length>1?"s":""}!</strong>
            <p style={{ margin:"2px 0 0", fontSize:12.5, color:"#047857" }}>
              {notifications.map((a) => `${a.job_title}: ${a.status}`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ maxWidth:760, margin:"0 auto 20px", display:"flex", gap:10, flexWrap:"wrap" }}>
        {["all",...new Set(apps.map((a)=>a.status))].map((s) => (
          <button key={s}
            style={{ padding:"8px 16px", borderRadius:50, border:"1.5px solid", fontFamily:"inherit", fontWeight:600, fontSize:12.5, cursor:"pointer", borderColor: filterSt===s?"#4f46e5":"#e5e7eb", background: filterSt===s?"linear-gradient(135deg,#4f46e5,#7c3aed)":"rgba(255,255,255,0.8)", color: filterSt===s?"#fff":"#6b7280", transition:"all 0.2s" }}
            onClick={() => setFilterSt(s)}>
            {s === "all" ? `All (${apps.length})` : `${s} (${apps.filter(a=>a.status===s).length})`}
          </button>
        ))}
      </div>

      {loading && <div className="j-loading"><div className="j-spinner" /></div>}

      {!loading && displayed.length === 0 && (
        <div className="tracker-empty">
          <p>😔 {filterSt==="all" ? "You haven't applied to any jobs yet." : `No ${filterSt} applications.`}</p>
          <button className="jl-apply-btn" style={{ width:"auto", padding:"11px 28px" }} onClick={() => navigate("/jobs")}>Browse Jobs →</button>
        </div>
      )}

      <div className="tracker-list">
        {displayed.map((app, idx) => (
          <div key={app.id} id={`tracker-app-${app.id}`} className="tracker-card" style={{ animationDelay:`${idx*0.07}s` }}>
            <div className="tracker-card__header">
              <div>
                <p className="tracker-card__title">{app.job_title}</p>
                <p className="tracker-card__date">Applied: {new Date(app.applied_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})} · App ID: #{app.id}</p>
              </div>
              <span className={`tracker-status-badge ${statusClass(app.status)}`}>
                {app.status === "Pending Review"      && "⏳ Pending Review"}
                {app.status === "Under Review"        && "🔍 Under Review"}
                {app.status === "Interview Scheduled" && "📅 Interview Scheduled"}
                {app.status === "Selected"            && "✅ Selected!"}
                {app.status === "Rejected"            && "❌ Rejected"}
              </span>
            </div>

            <StatusStepper status={app.status} />

            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:4 }}>
              <span style={{ fontSize:11.5, background:"#f3f4f6", color:"#374151", padding:"3px 10px", borderRadius:50, fontWeight:500 }}>📍 {app.user_location || "—"}</span>
              <span style={{ fontSize:11.5, background:"#f3f4f6", color:"#374151", padding:"3px 10px", borderRadius:50, fontWeight:500 }}>🗂️ {app.job_category}</span>
              <span style={{ fontSize:11.5, background:"#f3f4f6", color:"#374151", padding:"3px 10px", borderRadius:50, fontWeight:500 }}>⏱ {app.experience_years} yr exp</span>
            </div>

            {app.admin_note && (
              <div className="tracker-card__admin-note">
                💬 <strong>Admin Note:</strong> {app.admin_note}
              </div>
            )}

            {(app.status === "Interview Scheduled" || app.status === "Selected") && (
              <div className="tracker-notification">
                🎉 {app.status === "Interview Scheduled"
                  ? "Congratulations! You have been selected for an interview. Check your email/phone for details."
                  : "You have been selected for this role! Our team will contact you soon."}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign:"center", marginTop:28 }}>
        <button style={{ padding:"11px 28px", borderRadius:50, border:"none", background:"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit" }} onClick={() => navigate("/jobs")}>
          + Apply for More Jobs
        </button>
      </div>
    </div>
  );
}
