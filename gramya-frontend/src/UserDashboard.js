import React from "react";
import { useNavigate } from "react-router-dom";
import AIJobsSection from "./AIJobsSection";

function UserDashboard() {
  const navigate = useNavigate();

  const candidates = JSON.parse(localStorage.getItem("candidates")) || [];

  return (
    <div style={{ width: "100%", padding: "0 12px" }}>

      {/* ── Interview History ── */}
      <div className="page-center" style={{ minHeight: "auto", marginBottom: "16px" }}>
        <div className="container">
          <h1 className="title">Your Interview History</h1>

          {candidates.length === 0 ? (
            <div className="card">
              <p>No attempts yet</p>
              <button
                className="start-btn"
                onClick={() => navigate("/user")}
              >
                Start Interview
              </button>
            </div>
          ) : (
            <div className="card">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#4f46e5", color: "white" }}>
                    <th style={th}>Name</th>
                    <th style={th}>Job</th>
                    <th style={th}>District</th>
                    <th style={th}>Score</th>
                    <th style={th}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {candidates.map((item, i) => (
                    <tr key={i}>
                      <td style={td}>{item.name}</td>
                      <td style={td}>{item.job}</td>
                      <td style={td}>{item.district}</td>
                      <td style={td}>{item.score}</td>
                      <td
                        style={{
                          ...td,
                          color:
                            item.status === "Approved" ? "green" : "orange",
                          fontWeight: "bold",
                        }}
                      >
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button
                  className="start-btn"
                  onClick={() => navigate("/user")}
                >
                  Take New Interview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Smart Job Assistant CTA ── */}
      <div style={{
        maxWidth: 1100, margin: "28px auto 0", padding: "0 16px",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7)",
          borderRadius: 20,
          padding: "28px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          boxShadow: "0 12px 32px rgba(79,70,229,0.35)",
        }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600, margin: "0 0 6px", letterSpacing: 1, textTransform:"uppercase" }}>NEW FEATURE</p>
            <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>🎤 AI Smart Job Assistant</h3>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13.5, margin: 0 }}>
              Speak in Kannada • See jobs on map • Get skill gap analysis
            </p>
          </div>
          <button
            id="cta-smart-jobs"
            onClick={() => navigate("/smart-jobs")}
            style={{
              padding: "13px 28px", borderRadius: 50, border: "none",
              background: "#fff", color: "#4f46e5",
              fontWeight: 800, fontSize: 14, cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              transition: "transform 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Try Now →
          </button>
        </div>
      </div>

      {/* ── AI Suggested Jobs Section ── */}
      {/* Category Jobs CTA */}
      <div style={{ maxWidth:1100, margin:"24px auto 0", padding:"0 16px" }}>
        <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a5f)", borderRadius:20, padding:"28px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16, boxShadow:"0 12px 32px rgba(0,0,0,0.25)" }}>
          <div>
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:11, fontWeight:700, margin:"0 0 6px", letterSpacing:1, textTransform:"uppercase" }}>CATEGORY FILTER</p>
            <h3 style={{ color:"#fff", fontSize:19, fontWeight:800, margin:"0 0 6px" }}>🔌 Plumber · Driver · Electrician</h3>
            <p style={{ color:"rgba(255,255,255,0.75)", fontSize:13, margin:0 }}>Click a category and instantly see AI-ranked matching jobs</p>
          </div>
          <button id="cta-category-jobs" onClick={() => navigate("/category-jobs")}
            style={{ padding:"13px 28px", borderRadius:50, border:"none", background:"linear-gradient(135deg,#f59e0b,#ef4444)", color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer", boxShadow:"0 4px 14px rgba(239,68,68,0.3)", whiteSpace:"nowrap", transition:"transform 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.transform="scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform="scale(1)"}>
            Explore by Category →
          </button>
        </div>
      </div>

      <AIJobsSection />



    </div>
  );
}

const th = {
  padding: "10px",
  borderBottom: "2px solid #ddd",
};

const td = {
  padding: "10px",
  borderBottom: "1px solid #eee",
  textAlign: "center",
};

export default UserDashboard;