import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./jobs.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";
const ALL_STATUSES = ["Pending Review","Under Review","Interview Scheduled","Selected","Rejected"];

const statusClass = (s) => {
  if (s==="Pending Review")      return "status--pending";
  if (s==="Under Review")        return "status--review";
  if (s==="Interview Scheduled") return "status--interview";
  if (s==="Selected")            return "status--selected";
  if (s==="Rejected")            return "status--rejected";
  return "status--pending";
};

/* ── Review Modal ─────────────────────────────────────────────────────────── */
function ReviewModal({ app, onApprove, onReject, onClose }) {
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false); // "selected" banner

  const handleApprove = () => {
    setConfirmed(true);
    onApprove(app, note);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10000, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20, padding: "32px 28px",
          width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          position: "relative", fontFamily: "inherit",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          id="review-modal-close"
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 16,
            background: "none", border: "none", fontSize: 20,
            cursor: "pointer", color: "#9ca3af", lineHeight: 1,
          }}
        >✕</button>

        {/* Candidate info */}
        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", letterSpacing: 1 }}>
          Admin Review
        </p>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#111827" }}>
          👤 {app.user_name}
        </h2>
        <p style={{ margin: "0 0 2px", fontSize: 13, color: "#6b7280" }}>
          💼 {app.job_title} &nbsp;·&nbsp; 📍 {app.user_location}
        </p>
        <p style={{ margin: "0 0 2px", fontSize: 13, color: "#6b7280" }}>
          🛠 {app.user_skills} &nbsp;·&nbsp; ⏱ {app.experience_years} yr exp
        </p>
        <span
          className={`tracker-status-badge ${statusClass(app.status)}`}
          style={{ display: "inline-block", marginTop: 8, marginBottom: 20 }}
        >
          {app.status}
        </span>

        {/* Application answers */}
        {app.answers?.length > 0 && (
          <div style={{ background: "#f9fafb", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
            <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#374151" }}>📝 Application Answers</p>
            {app.answers.map((ans, i) => (
              <p key={i} style={{ margin: "0 0 6px", fontSize: 13, color: "#374151" }}>
                <strong>Q{i + 1}:</strong> {ans}
              </p>
            ))}
            {app.cover_note && (
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#374151" }}>
                <strong>Cover Note:</strong> {app.cover_note}
              </p>
            )}
          </div>
        )}

        {/* Admin note */}
        <input
          id="review-modal-note"
          placeholder="Add an admin note (optional)…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px 14px",
            borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13,
            fontFamily: "inherit", outline: "none", marginBottom: 20,
            color: "#111827",
          }}
        />

        {/* ── Confirmation banner (shown after Approve) ── */}
        {confirmed && (
          <div style={{
            background: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
            border: "1.5px solid #34d399", borderRadius: 12,
            padding: "14px 18px", marginBottom: 18,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 24 }}>🎉</span>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#065f46" }}>
                Candidate Selected!
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#047857" }}>
                {app.user_name} has been marked as <strong>Selected</strong> for {app.job_title}.
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!confirmed && (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              id="review-modal-approve"
              onClick={handleApprove}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg,#16a34a,#22c55e)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
                fontFamily: "inherit", boxShadow: "0 4px 14px rgba(22,163,74,0.3)",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.opacity = 0.85)}
              onMouseLeave={(e) => (e.target.style.opacity = 1)}
            >
              ✅ Approve
            </button>
            <button
              id="review-modal-reject"
              onClick={() => { onReject(app, note); onClose(); }}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg,#dc2626,#ef4444)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
                fontFamily: "inherit", boxShadow: "0 4px 14px rgba(220,38,38,0.3)",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.opacity = 0.85)}
              onMouseLeave={(e) => (e.target.style.opacity = 1)}
            >
              ❌ Reject
            </button>
          </div>
        )}

        {/* Close after confirmed */}
        {confirmed && (
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Done ✓
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function AdminApplications() {
  const navigate = useNavigate();
  const [apps, setApps]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [stFilter, setStFilter]   = useState("all");
  const [expandId, setExpandId]   = useState(null);
  const [reviewApp, setReviewApp] = useState(null); // app currently being reviewed
  const [toast, setToast]         = useState("");

  const role = localStorage.getItem("role");

  useEffect(() => {
    if (role !== "admin") { navigate("/login"); return; }
    loadApps();
  }, [role, navigate]);

  const loadApps = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/applications`);
      if (res.ok) { setApps(await res.json()); setLoading(false); return; }
    } catch {}
    const all = JSON.parse(localStorage.getItem("applications") || "[]");
    setApps(all.sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at)));
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const updateStatus = async (app, newStatus, note = "") => {
    try {
      const res = await fetch(`${API}/admin/update-status`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: app.id, status: newStatus, admin_note: note }),
      });
      if (res.ok) { await loadApps(); showToast(`✅ Moved to "${newStatus}"`); return; }
    } catch {}
    // localStorage fallback
    const all = JSON.parse(localStorage.getItem("applications") || "[]");
    const idx = all.findIndex((a) => a.id === app.id);
    if (idx >= 0) {
      all[idx].status     = newStatus;
      all[idx].admin_note = note;
      all[idx].updated_at = new Date().toISOString();
    }
    localStorage.setItem("applications", JSON.stringify(all));
    setApps(all.sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at)));
    showToast(`✅ Moved to "${newStatus}"`);
  };

  const handleApprove = (app, note) => {
    updateStatus(app, "Selected", note);
    // modal stays open to show the confirmation banner
  };

  const handleReject = (app, note) => {
    updateStatus(app, "Rejected", note);
    showToast(`❌ ${app.user_name} rejected.`);
  };

  const displayed = apps.filter((a) => {
    const c = catFilter === "all" || a.job_category?.toLowerCase() === catFilter;
    const s = stFilter  === "all" || a.status === stFilter;
    return c && s;
  });

  const cats  = ["all", ...new Set(apps.map((a) => a.job_category).filter(Boolean))];
  const stats = {
    total:     apps.length,
    pending:   apps.filter((a) => a.status === "Pending Review").length,
    review:    apps.filter((a) => a.status === "Under Review").length,
    interview: apps.filter((a) => a.status === "Interview Scheduled").length,
    selected:  apps.filter((a) => a.status === "Selected").length,
    rejected:  apps.filter((a) => a.status === "Rejected").length,
  };

  return (
    <div className="admin-apps-page">
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:"#1a1a2e", color:"#fff", padding:"12px 24px", borderRadius:50, fontWeight:600, fontSize:14, zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,0.2)" }}>{toast}</div>
      )}

      {/* Review Modal */}
      {reviewApp && (
        <ReviewModal
          app={reviewApp}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => { setReviewApp(null); loadApps(); }}
        />
      )}

      <div className="admin-apps-header">
        <div>
          <p style={{ margin:"0 0 4px", fontSize:12, color:"#6b7280", fontWeight:700, textTransform:"uppercase" }}>Admin Panel</p>
          <h1 className="admin-apps-title">📋 Application Reviews</h1>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={{ padding:"10px 20px", borderRadius:50, border:"none", background:"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }} onClick={loadApps}>↻ Refresh</button>
          <button style={{ padding:"10px 20px", borderRadius:50, border:"1.5px solid #e5e7eb", background:"#fff", color:"#374151", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }} onClick={() => navigate("/dashboard")}>← Dashboard</button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        {[["Total",stats.total,"#4f46e5"],["Pending",stats.pending,"#d97706"],["In Review",stats.review,"#2563eb"],["Interview",stats.interview,"#16a34a"],["Selected",stats.selected,"#7c3aed"],["Rejected",stats.rejected,"#dc2626"]].map(([l,n,c])=>(
          <div key={l} className="admin-stat-card"><span className="admin-stat-card__num" style={{ color:c }}>{n}</span><span className="admin-stat-card__lbl">{l}</span></div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <select id="admin-cat-filter" className="admin-filter-select" value={catFilter} onChange={(e)=>setCatFilter(e.target.value)}>
          {cats.map((c)=><option key={c} value={c}>{c==="all"?"All Categories":c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
        </select>
        <select id="admin-st-filter" className="admin-filter-select" value={stFilter} onChange={(e)=>setStFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map((s)=><option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize:13, color:"#6b7280", alignSelf:"center" }}>Showing {displayed.length} of {apps.length}</span>
      </div>

      {loading && <div className="j-loading"><div className="j-spinner" /></div>}

      {!loading && displayed.length === 0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"#9ca3af" }}>
          <p style={{ fontSize:16 }}>No applications found for selected filters.</p>
        </div>
      )}

      <div className="admin-apps-table">
        {displayed.map((app) => {
          const expanded = expandId === app.id;
          return (
            <div key={app.id} id={`admin-app-${app.id}`} className="admin-app-row" style={{ display:"block" }}>
              {/* Header row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"start" }}>
                <div>
                  <p className="admin-app-row__name">👤 {app.user_name} <span style={{ fontSize:11, color:"#9ca3af", fontWeight:400 }}>· {app.user_email} · {app.user_phone}</span></p>
                  <p className="admin-app-row__job">💼 {app.job_title} <span style={{ fontSize:11, color:"#9ca3af", fontWeight:400 }}>({app.job_category})</span></p>
                  <p className="admin-app-row__meta">📍 {app.user_location} · 🛠 {app.user_skills} · ⏱ {app.experience_years} yr exp · Applied: {new Date(app.applied_at).toLocaleDateString("en-IN")}</p>
                  <span className={`tracker-status-badge ${statusClass(app.status)}`} style={{ marginTop:8, display:"inline-block" }}>{app.status}</span>
                </div>
                <div className="admin-app-row__actions">
                  {/* View / hide answers */}
                  <button
                    id={`admin-view-${app.id}`}
                    className="admin-action-btn admin-action-btn--view"
                    onClick={() => setExpandId(expanded ? null : app.id)}
                  >
                    {expanded ? "▲ Hide" : "▼ View"}
                  </button>

                  {/* 🔍 Review — opens the modal */}
                  {app.status !== "Selected" && app.status !== "Rejected" && (
                    <button
                      id={`admin-review-${app.id}`}
                      className="admin-action-btn admin-action-btn--view"
                      style={{ background:"linear-gradient(135deg,#2563eb,#3b82f6)", color:"#fff", border:"none" }}
                      onClick={() => setReviewApp(app)}
                    >
                      🔍 Review
                    </button>
                  )}

                  {/* Interview shortcut */}
                  {app.status !== "Interview Scheduled" && app.status !== "Rejected" && app.status !== "Selected" && (
                    <button
                      id={`admin-interview-${app.id}`}
                      className="admin-action-btn admin-action-btn--interview"
                      onClick={() => updateStatus(app, "Interview Scheduled")}
                    >
                      📅 Interview
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded answers */}
              {expanded && (
                <div style={{ marginTop:12 }}>
                  <div className="admin-app-answers">
                    <h4>📝 Application Answers</h4>
                    {app.answers?.map((ans, i) => (
                      <p key={i}><strong>Q{i+1}:</strong> {ans}</p>
                    ))}
                    {app.cover_note && <p><strong>Cover Note:</strong> {app.cover_note}</p>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
