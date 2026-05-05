import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import "./Dashboard.css";

const COLORS = ["#6366f1", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"];

function StatCard({ icon, label, value, color, onClick }) {
  return (
    <div className="dash-stat" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="dash-stat__icon" style={{ background: color + "18" }}>{icon}</div>
      <div>
        <span className="dash-stat__val" style={{ color }}>{value}</span>
        <span className="dash-stat__lbl">{label}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [apps, setApps]             = useState([]);
  const [activeTab, setActiveTab]   = useState("overview");

  useEffect(() => {
    setCandidates(JSON.parse(localStorage.getItem("candidates") || "[]"));
    setApps(JSON.parse(localStorage.getItem("applications") || "[]"));
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  const skillMap = {};
  candidates.forEach((c) => { skillMap[c.job] = (skillMap[c.job] || 0) + 1; });
  const skillData = Object.entries(skillMap).map(([name, count]) => ({ name, count }));

  const today = new Date().toDateString();
  const topCandidates = candidates
    .filter((c) => c.date && new Date(c.date).toDateString() === today)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Application stats
  const appStats = {
    total:     apps.length,
    pending:   apps.filter((a) => a.status === "Pending Review").length,
    review:    apps.filter((a) => a.status === "Under Review").length,
    interview: apps.filter((a) => a.status === "Interview Scheduled").length,
    selected:  apps.filter((a) => a.status === "Selected").length,
    rejected:  apps.filter((a) => a.status === "Rejected").length,
  };

  const appStatusData = [
    { name: "Pending",   value: appStats.pending   },
    { name: "In Review", value: appStats.review     },
    { name: "Interview", value: appStats.interview  },
    { name: "Selected",  value: appStats.selected   },
    { name: "Rejected",  value: appStats.rejected   },
  ].filter((d) => d.value > 0);

  const recentApps = [...apps]
    .sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at))
    .slice(0, 8);

  return (
    <div className="dash-page">

      {/* ── Header ── */}
      <div className="dash-header">
        <div>
          <p className="dash-eyebrow">🌱 Gramya AI · Admin</p>
          <h1 className="dash-title">Admin Dashboard</h1>
          <p className="dash-sub">Manage interviews, applications, and candidate analytics</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            id="dash-review-btn"
            className="dash-cta-btn"
            onClick={() => navigate("/admin/applications")}
          >
            📋 Review Applications
          </button>
          <button
            className="dash-cta-btn dash-cta-btn--ghost"
            onClick={() => { localStorage.clear(); navigate("/login"); }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ── Top stat cards ── */}
      <div className="dash-stats-row">
        <StatCard icon="👥" label="Total Candidates"   value={candidates.length}   color="#4f46e5" />
        <StatCard icon="📋" label="Total Applications" value={appStats.total}      color="#7c3aed" onClick={() => navigate("/admin/applications")} />
        <StatCard icon="⏳" label="Pending Review"     value={appStats.pending}    color="#d97706" onClick={() => navigate("/admin/applications")} />
        <StatCard icon="📅" label="Interviews Set"     value={appStats.interview}  color="#16a34a" onClick={() => navigate("/admin/applications")} />
        <StatCard icon="✅" label="Selected"           value={appStats.selected}   color="#6366f1" onClick={() => navigate("/admin/applications")} />
        <StatCard icon="❌" label="Rejected"           value={appStats.rejected}   color="#ef4444" onClick={() => navigate("/admin/applications")} />
      </div>

      {/* ── Tab bar ── */}
      <div className="dash-tabs">
        {[["overview","📊 Overview"],["applications","📋 Applications"],["candidates","👥 Candidates"]].map(([k,l]) => (
          <button key={k} id={`dash-tab-${k}`}
            className={`dash-tab${activeTab===k?" active":""}`}
            onClick={() => setActiveTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="dash-grid">

          {/* Skill / Job distribution bar chart */}
          <div className="dash-card dash-card--wide">
            <h2 className="dash-card__title">📊 Job Distribution (Interviews)</h2>
            {skillData.length === 0
              ? <p className="dash-empty">No interview data yet.</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={skillData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6,6,0,0]}>
                      {skillData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>

          {/* Application status pie chart */}
          <div className="dash-card">
            <h2 className="dash-card__title">🥧 Application Status</h2>
            {appStatusData.length === 0
              ? <p className="dash-empty">No applications yet.</p>
              : (
                <PieChart width={260} height={220}>
                  <Pie data={appStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {appStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              )
            }
          </div>

          {/* Today's top candidates */}
          <div className="dash-card">
            <h2 className="dash-card__title">🏆 Top Interviews Today</h2>
            {topCandidates.length === 0
              ? <p className="dash-empty">No interviews recorded today.</p>
              : (
                <ul className="dash-list">
                  {topCandidates.map((c, i) => (
                    <li key={i} className="dash-list__item">
                      <span className="dash-list__rank">#{i+1}</span>
                      <div>
                        <strong>{c.name}</strong>
                        <span style={{ fontSize: 12, color: "#6b7280" }}> — {c.job}</span>
                      </div>
                      <span className="dash-list__score" style={{ color: c.score >= 7 ? "#16a34a" : "#d97706" }}>
                        {c.score}/10
                      </span>
                    </li>
                  ))}
                </ul>
              )
            }
          </div>

          {/* Quick Action Card */}
          <div className="dash-card dash-card--action">
            <h2 className="dash-card__title">⚡ Quick Actions</h2>
            <div className="dash-actions">
              {[
                ["📋 Review Applications", () => navigate("/admin/applications"),"#4f46e5"],
                ["📊 View All Candidates", () => setActiveTab("candidates"),     "#7c3aed"],
                ["🔍 Pending Reviews",     () => navigate("/admin/applications"), "#d97706"],
              ].map(([label, fn, color]) => (
                <button key={label} className="dash-action-btn" style={{ borderColor: color+"40", color }}
                  onClick={fn}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── APPLICATIONS TAB ── */}
      {activeTab === "applications" && (
        <div className="dash-card" style={{ maxWidth: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <h2 className="dash-card__title" style={{ margin: 0 }}>📋 Recent Applications</h2>
            <button className="dash-cta-btn" onClick={() => navigate("/admin/applications")}>
              Open Full Review Panel →
            </button>
          </div>

          {recentApps.length === 0
            ? <p className="dash-empty">No applications yet. Share the Jobs page with candidates.</p>
            : (
              <div style={{ overflowX: "auto" }}>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Job Applied</th>
                      <th>Category</th>
                      <th>Experience</th>
                      <th>Applied On</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApps.map((a) => (
                      <tr key={a.id}>
                        <td><strong>{a.user_name}</strong><br /><span style={{ fontSize:11, color:"#9ca3af" }}>{a.user_email}</span></td>
                        <td>{a.job_title}</td>
                        <td><span style={{ fontSize:11, background:"#f3f4f6", padding:"2px 8px", borderRadius:50 }}>{a.job_category}</span></td>
                        <td>{a.experience_years} yr</td>
                        <td style={{ fontSize:12 }}>{new Date(a.applied_at).toLocaleDateString("en-IN")}</td>
                        <td>
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:50,
                            background: a.status==="Selected"?"#dcfce7":a.status==="Rejected"?"#fee2e2":a.status==="Interview Scheduled"?"#dbeafe":"#fef3c7",
                            color:      a.status==="Selected"?"#16a34a":a.status==="Rejected"?"#dc2626":a.status==="Interview Scheduled"?"#2563eb":"#d97706"
                          }}>{a.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {/* ── CANDIDATES TAB ── */}
      {activeTab === "candidates" && (
        <div className="dash-card" style={{ maxWidth: "100%" }}>
          <h2 className="dash-card__title">👥 All Interview Candidates</h2>
          {candidates.length === 0
            ? <p className="dash-empty">No interview candidates recorded yet.</p>
            : (
              <div style={{ overflowX: "auto" }}>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Job</th>
                      <th>District</th>
                      <th>Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c, i) => (
                      <tr key={i}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.job}</td>
                        <td>{c.district}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: c.score >= 7 ? "#16a34a" : c.score >= 5 ? "#d97706" : "#ef4444" }}>
                            {c.score}/10
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:50,
                            background: c.status==="Selected"?"#dcfce7":"#f3f4f6",
                            color:      c.status==="Selected"?"#16a34a":"#6b7280"
                          }}>{c.status || "Pending"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}