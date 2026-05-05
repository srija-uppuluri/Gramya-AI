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

export default function AdminApplications() {
  const navigate = useNavigate();
  const [apps, setApps]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [stFilter, setStFilter]   = useState("all");
  const [expandId, setExpandId]   = useState(null);
  const [noteText, setNoteText]   = useState({});
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
    // localStorage fallback
    const all = JSON.parse(localStorage.getItem("applications") || "[]");
    setApps(all.sort((a,b) => new Date(b.applied_at) - new Date(a.applied_at)));
    setLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const updateStatus = async (app, newStatus) => {
    const note = noteText[app.id] || "";
    try {
      const res = await fetch(`${API}/admin/update-status`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ application_id: app.id, status: newStatus, admin_note: note }),
      });
      if (res.ok) { await loadApps(); showToast(`✅ Moved to "${newStatus}"`); return; }
    } catch {}
    // localStorage fallback
    const all = JSON.parse(localStorage.getItem("applications") || "[]");
    const idx = all.findIndex((a) => a.id === app.id);
    if (idx >= 0) { all[idx].status = newStatus; all[idx].admin_note = note; all[idx].updated_at = new Date().toISOString(); }
    localStorage.setItem("applications", JSON.stringify(all));
    setApps(all.sort((a,b) => new Date(b.applied_at) - new Date(a.applied_at)));
    showToast(`✅ Moved to "${newStatus}"`);
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
      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:"#1a1a2e", color:"#fff", padding:"12px 24px", borderRadius:50, fontWeight:600, fontSize:14, zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,0.2)" }}>{toast}</div>
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
                  <button id={`admin-view-${app.id}`} className="admin-action-btn admin-action-btn--view" onClick={() => setExpandId(expanded ? null : app.id)}>
                    {expanded ? "▲ Hide" : "▼ View"}
                  </button>
                  {app.status !== "Under Review"        && <button className="admin-action-btn admin-action-btn--view"      onClick={() => updateStatus(app,"Under Review")}>🔍 Review</button>}
                  {app.status !== "Interview Scheduled" && app.status !== "Rejected" && app.status !== "Selected" && <button id={`admin-interview-${app.id}`} className="admin-action-btn admin-action-btn--interview" onClick={() => updateStatus(app,"Interview Scheduled")}>📅 Interview</button>}
                  {app.status !== "Selected"            && app.status !== "Rejected" && <button id={`admin-approve-${app.id}`} className="admin-action-btn admin-action-btn--approve"  onClick={() => updateStatus(app,"Selected")}>✅ Select</button>}
                  {app.status !== "Rejected"            && <button id={`admin-reject-${app.id}`}  className="admin-action-btn admin-action-btn--reject"   onClick={() => updateStatus(app,"Rejected")}>❌ Reject</button>}
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
                  <div style={{ marginTop:10, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                    <input
                      id={`admin-note-${app.id}`}
                      className="auth-input"
                      placeholder="Add admin note (optional)…"
                      style={{ flex:1, minWidth:200, padding:"9px 14px", borderRadius:10, border:"1.5px solid #e5e7eb", fontSize:13, fontFamily:"inherit", outline:"none" }}
                      value={noteText[app.id] || ""}
                      onChange={(e) => setNoteText((n) => ({ ...n, [app.id]: e.target.value }))}
                    />
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
