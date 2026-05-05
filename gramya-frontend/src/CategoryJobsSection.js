import React, { useState, useEffect, useCallback } from "react";
import "./CategoryJobsSection.css";

const ALL_JOBS = [
  { id:2,  title:"Electrician / Wiring Technician",   category:"electrician", type:"private",    match_score:92, location:"Bengaluru Rural, KA", salary:"₹18,000–₹25,000/mo", openings:8,  ai_reason:"Electrical aptitude & tool knowledge detected.", missing_skills:["circuit","safety"], tags:["Electrical","Wiring"] },
  { id:11, title:"Electrician Helper",                 category:"electrician", type:"private",    match_score:84, location:"Mysuru, KA",          salary:"₹10,000–₹14,000/mo", openings:20, ai_reason:"Entry-level electrical role for your experience.", missing_skills:["safety"], tags:["Electrical","Helper"] },
  { id:12, title:"Electrical Maintenance Worker",      category:"electrician", type:"government", match_score:88, location:"Pune, MH",             salary:"₹16,000–₹22,000/mo", openings:12, ai_reason:"Maintenance + electrical skills strongly match.", missing_skills:["panel"], tags:["Electrical","Maintenance"] },
  { id:13, title:"Solar Panel Electrician",            category:"electrician", type:"private",    match_score:79, location:"Jodhpur, RJ",          salary:"₹15,000–₹21,000/mo", openings:35, ai_reason:"Combines electrical and solar installation skills.", missing_skills:["solar","installation"], tags:["Solar","Electrical"] },
  { id:14, title:"Plumber (Residential)",              category:"plumber",     type:"private",    match_score:90, location:"Bengaluru, KA",        salary:"₹14,000–₹22,000/mo", openings:18, ai_reason:"Pipe fitting & leak repair skills matched.", missing_skills:["water supply"], tags:["Plumbing","Residential"] },
  { id:15, title:"Plumber Helper / Apprentice",        category:"plumber",     type:"private",    match_score:82, location:"Nashik, MH",           salary:"₹8,000–₹12,000/mo",  openings:25, ai_reason:"Great entry-level plumbing role.", missing_skills:["pipe fitting"], tags:["Plumbing","Helper"] },
  { id:16, title:"Municipal Plumber",                  category:"plumber",     type:"government", match_score:87, location:"Raipur, CG",           salary:"₹18,000–₹26,000/mo", openings:10, ai_reason:"Government plumbing — stable income + benefits.", missing_skills:["sewage"], tags:["Plumbing","Government"] },
  { id:17, title:"Pipeline Repair Technician",         category:"plumber",     type:"private",    match_score:75, location:"Hubli, KA",            salary:"₹13,000–₹19,000/mo", openings:8,  ai_reason:"Pipeline repair matches your tools & repair skills.", missing_skills:["pipeline"], tags:["Plumbing","Pipeline"] },
  { id:18, title:"Light Motor Vehicle Driver",         category:"driver",      type:"private",    match_score:91, location:"Bengaluru, KA",        salary:"₹14,000–₹20,000/mo", openings:30, ai_reason:"LMV license & navigation skills matched.", missing_skills:["vehicle maintenance"], tags:["Driving","LMV"] },
  { id:19, title:"Ambulance Driver",                   category:"driver",      type:"government", match_score:86, location:"Raipur, CG",           salary:"₹16,000–₹22,000/mo", openings:15, ai_reason:"Driving + first aid = government stability.", missing_skills:["first aid"], tags:["Driving","Healthcare"] },
  { id:20, title:"School Bus Driver",                  category:"driver",      type:"government", match_score:83, location:"Varanasi, UP",         salary:"₹12,000–₹18,000/mo", openings:12, ai_reason:"HMV license & safe driving skills matched.", missing_skills:["child safety"], tags:["Driving","Government"] },
  { id:21, title:"Delivery / Logistics Driver",        category:"driver",      type:"private",    match_score:88, location:"Pune, MH",             salary:"₹12,000–₹18,000/mo", openings:50, ai_reason:"High-demand delivery role matches your license.", missing_skills:[], tags:["Driving","Delivery"] },
  { id:1,  title:"Government School Teacher",          category:"teaching",    type:"government", match_score:94, location:"Varanasi, UP",         salary:"₹28,000–₹35,000/mo", openings:15, ai_reason:"Top match: communication & education score 9/10.", missing_skills:[], tags:["Teaching","Hindi"] },
  { id:3,  title:"ASHA Health Worker",                 category:"healthcare",  type:"government", match_score:91, location:"Raipur, CG",           salary:"₹15,000–₹20,000/mo", openings:22, ai_reason:"Community engagement skills are a strong match.", missing_skills:["first aid"], tags:["Healthcare","Community"] },
  { id:4,  title:"Dairy Farm Supervisor",              category:"farming",     type:"government", match_score:82, location:"Mehsana, GJ",          salary:"₹18,000–₹22,000/mo", openings:5,  ai_reason:"Rural farming background aligns well.", missing_skills:["management"], tags:["Farming","Livestock"] },
  { id:10, title:"Two-Wheeler Mechanic",               category:"mechanic",    type:"private",    match_score:85, location:"Belgaum, KA",          salary:"₹12,000–₹18,000/mo", openings:6,  ai_reason:"Engine repair & tools experience detected.", missing_skills:["engine"], tags:["Mechanic","Repair"] },
];

const CATEGORIES = [
  { slug:"all",         label:"All Jobs",    icon:"✨", color:"#4f46e5" },
  { slug:"electrician", label:"Electrician", icon:"🔌", color:"#f59e0b" },
  { slug:"plumber",     label:"Plumber",     icon:"🚰", color:"#3b82f6" },
  { slug:"driver",      label:"Driver",      icon:"🚗", color:"#22c55e" },
  { slug:"teaching",    label:"Teacher",     icon:"📚", color:"#8b5cf6" },
  { slug:"healthcare",  label:"Healthcare",  icon:"🏥", color:"#ef4444" },
  { slug:"farming",     label:"Farming",     icon:"🌾", color:"#84cc16" },
  { slug:"mechanic",    label:"Mechanic",    icon:"🔧", color:"#06b6d4" },
];

const TYPE_FILTERS = [
  { key:"all", label:"All Types" },
  { key:"government", label:"🏛️ Government" },
  { key:"private", label:"🏢 Private" },
];

const API = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";
const matchGrad = (s) => s >= 90 ? "linear-gradient(135deg,#22c55e,#16a34a)" : s >= 80 ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "linear-gradient(135deg,#f59e0b,#d97706)";

function JobModal({ job, onClose }) {
  if (!job) return null;
  const catInfo = CATEGORIES.find((c) => c.slug === job.category) || CATEGORIES[0];
  return (
    <div className="cjs-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cjs-modal" onClick={(e) => e.stopPropagation()}>
        <button className="cjs-modal-close" id="cjs-modal-close" onClick={onClose}>✕</button>
        <div className="cjs-modal-cat-chip" style={{ background: catInfo.color + "20", color: catInfo.color, border: `1px solid ${catInfo.color}40` }}>{catInfo.icon} {catInfo.label}</div>
        <div className="cjs-modal-match" style={{ background: matchGrad(job.match_score) }}>{job.match_score}% AI Match</div>
        <h2 className="cjs-modal-title">{job.title}</h2>
        <p className="cjs-modal-sub">{job.type === "government" ? "🏛️ Government" : "🏢 Private"} · {job.openings} openings · {job.location}</p>
        <div className="cjs-modal-section"><h4>🤖 Why AI Recommends This</h4><p>{job.ai_reason}</p></div>
        <div className="cjs-modal-section"><h4>💰 Salary</h4><p>{job.salary}</p></div>
        {job.missing_skills?.length > 0 && (
          <div className="cjs-modal-section">
            <h4>📉 Skills to Improve</h4>
            <div className="cjs-chips" style={{ marginTop:6 }}>
              {job.missing_skills.map((s) => <span key={s} className="cjs-chip cjs-chip--red">❌ {s}</span>)}
            </div>
          </div>
        )}
        {job.missing_skills?.length === 0 && (
          <div className="cjs-modal-section" style={{ background:"#f0fdf4", borderColor:"#bbf7d0" }}>
            <h4 style={{ color:"#16a34a" }}>✅ All Skills Matched!</h4>
            <p>You already have all required skills. Apply now!</p>
          </div>
        )}
        <button className="cjs-apply-btn cjs-apply-btn--lg" id={`cjs-modal-apply-${job.id}`} onClick={() => alert(`✅ Applied for: ${job.title}`)}>🚀 Apply Now</button>
      </div>
    </div>
  );
}

export default function CategoryJobsSection() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType]         = useState("all");
  const [jobs, setJobs]                     = useState(ALL_JOBS);
  const [loading, setLoading]               = useState(false);
  const [selectedJob, setSelectedJob]       = useState(null);
  const [searchQuery, setSearchQuery]       = useState("");
  const [sortBy, setSortBy]                 = useState("match");

  const fetchJobs = useCallback(async (category) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 20, interview_score: 7 });
      if (category && category !== "all") params.set("category", category);
      const res = await fetch(`${API}/ai-suggested-jobs?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.jobs?.length) { setJobs(data.jobs); setLoading(false); return; }
    } catch {}
    let filtered = category === "all" ? ALL_JOBS : ALL_JOBS.filter((j) => j.category === category);
    setJobs(filtered);
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(activeCategory); }, [activeCategory, fetchJobs]);

  const displayed = jobs
    .filter((j) => {
      if (activeType !== "all" && j.type !== activeType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.tags?.some((t) => t.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => sortBy === "match" ? b.match_score - a.match_score : b.openings - a.openings);

  const activeCat = CATEGORIES.find((c) => c.slug === activeCategory);

  return (
    <section className="cjs-section" id="category-jobs-section">
      {/* Header */}
      <div className="cjs-header">
        <div className="cjs-header__text">
          <span className="cjs-eyebrow">🤖 AI Powered · Category Filtered</span>
          <h2 className="cjs-title">Customized Job Suggestions</h2>
          <p className="cjs-subtitle">Select a category to instantly see AI-matched opportunities</p>
        </div>
        <div className="cjs-header__stat">
          <span className="cjs-stat-num">{displayed.length}</span>
          <span className="cjs-stat-lbl">Jobs Found</span>
        </div>
      </div>

      {/* Category Scroll */}
      <div className="cjs-cat-scroll" role="group" aria-label="Job categories">
        {CATEGORIES.map((cat) => {
          const count = cat.slug === "all" ? ALL_JOBS.length : ALL_JOBS.filter((j) => j.category === cat.slug).length;
          const active = activeCategory === cat.slug;
          return (
            <button key={cat.slug} id={`cjs-cat-${cat.slug}`}
              className={`cjs-cat-btn${active ? " active" : ""}`}
              style={active ? { background: cat.color, borderColor: cat.color, color: "#fff", boxShadow: `0 6px 20px ${cat.color}50` } : {}}
              onClick={() => setActiveCategory(cat.slug)} aria-pressed={active}>
              <span className="cjs-cat-icon">{cat.icon}</span>
              <span className="cjs-cat-label">{cat.label}</span>
              <span className="cjs-cat-count" style={active ? { background:"rgba(255,255,255,0.25)", color:"#fff" } : {}}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="cjs-controls">
        <div className="cjs-type-pills">
          {TYPE_FILTERS.map((f) => (
            <button key={f.key} id={`cjs-type-${f.key}`}
              className={`cjs-type-btn${activeType === f.key ? " active" : ""}`}
              onClick={() => setActiveType(f.key)}>{f.label}</button>
          ))}
        </div>
        <div className="cjs-search-box">
          <span className="cjs-search-icon">🔍</span>
          <input id="cjs-search" className="cjs-search-input" placeholder="Search jobs, location…"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {searchQuery && <button className="cjs-clear-btn" onClick={() => setSearchQuery("")}>✕</button>}
        </div>
        <select id="cjs-sort" className="cjs-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="match">Sort: Best Match</option>
          <option value="openings">Sort: Most Openings</option>
        </select>
      </div>

      {/* Active category banner */}
      {activeCategory !== "all" && activeCat && (
        <div className="cjs-cat-banner" style={{ borderLeft:`4px solid ${activeCat.color}`, background: activeCat.color + "0d" }}>
          <span style={{ fontSize:22 }}>{activeCat.icon}</span>
          <div>
            <strong style={{ color: activeCat.color }}>{activeCat.label} Jobs</strong>
            <p>Showing <strong>{displayed.length}</strong> {activeCat.label.toLowerCase()} opportunities ranked by AI</p>
          </div>
          <button className="cjs-clear-cat" onClick={() => setActiveCategory("all")}>✕ Clear</button>
        </div>
      )}

      <p className="cjs-count">Showing <strong>{displayed.length}</strong> job{displayed.length !== 1 ? "s" : ""}</p>

      {loading && <div className="cjs-loading"><div className="cjs-spinner"/><p>Finding your best matches…</p></div>}

      {!loading && displayed.length === 0 && (
        <div className="cjs-empty">
          <p>😔 No jobs match this filter.</p>
          <button className="cjs-cat-btn active" style={{ background:"#4f46e5", borderColor:"#4f46e5", color:"#fff" }}
            onClick={() => { setActiveCategory("all"); setActiveType("all"); setSearchQuery(""); }}>✨ Show All Jobs</button>
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="cjs-grid">
          {displayed.map((job, idx) => {
            const isTop = idx === 0 && job.match_score >= 88;
            const catInfo = CATEGORIES.find((c) => c.slug === job.category) || CATEGORIES[0];
            const mg = matchGrad(job.match_score);
            return (
              <div key={job.id} id={`cjs-job-${job.id}`}
                className={`cjs-card${isTop ? " cjs-card--top" : ""}`}
                onClick={() => setSelectedJob(job)} role="button" tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelectedJob(job)}>
                {isTop && <span className="cjs-top-badge">🔥 Top Match</span>}
                <div className="cjs-card-head">
                  <div className="cjs-card-icon" style={{ background: catInfo.color + "18" }}>{catInfo.icon}</div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                    <span className="cjs-match-badge" style={{ background:mg }}>{job.match_score}%</span>
                    <span className="cjs-type-tag" style={{ background:job.type==="government"?"#dbeafe":"#fef3c7", color:job.type==="government"?"#1d4ed8":"#92400e" }}>
                      {job.type === "government" ? "🏛️ Govt" : "🏢 Pvt"}
                    </span>
                  </div>
                </div>
                <span className="cjs-card-cat" style={{ color:catInfo.color, background:catInfo.color+"15", borderColor:catInfo.color+"30" }}>{catInfo.icon} {catInfo.label}</span>
                <h3 className="cjs-card-title">{job.title}</h3>
                <div className="cjs-prog-track"><div className="cjs-prog-fill" style={{ width:`${job.match_score}%`, background:mg }}/></div>
                <p className="cjs-ai-text">✨ {job.ai_reason}</p>
                <div className="cjs-meta">
                  <span className="cjs-meta-pill">📍 {job.location}</span>
                  <span className="cjs-meta-pill">💰 {job.salary}</span>
                  <span className="cjs-meta-pill">👥 {job.openings} openings</span>
                </div>
                {job.missing_skills?.length > 0 && (
                  <div className="cjs-gap-row">
                    <span className="cjs-gap-label">Gap:</span>
                    {job.missing_skills.slice(0,2).map((s) => <span key={s} className="cjs-gap-chip">{s}</span>)}
                    {job.missing_skills.length > 2 && <span className="cjs-gap-chip">+{job.missing_skills.length - 2}</span>}
                  </div>
                )}
                <button id={`cjs-apply-${job.id}`} className="cjs-apply-btn"
                  onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}>Apply Now →</button>
              </div>
            );
          })}
        </div>
      )}
      <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </section>
  );
}
