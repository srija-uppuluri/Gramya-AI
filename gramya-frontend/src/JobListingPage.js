import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./jobs.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

const CAT_ICONS = { electrician:"🔌", plumber:"🚰", driver:"🚗", teaching:"📚", healthcare:"🏥", farming:"🌾", mechanic:"🔧" };
const CAT_COLORS = { electrician:"#f59e0b", plumber:"#3b82f6", driver:"#22c55e", teaching:"#8b5cf6", healthcare:"#ef4444", farming:"#84cc16", mechanic:"#06b6d4" };

// Demo jobs (fallback if API is down)
const DEMO_JOBS = [
  { id:"job-001", title:"Electrician / Wiring Technician",   category:"electrician", type:"private",    location:"Bengaluru Rural, KA", salary:"₹18,000–₹25,000/mo", openings:8,  description:"Install and maintain electrical wiring at residential & commercial sites.", required_skills:["Electrical Wiring","Circuit Diagrams","Safety Protocols","Hand Tools"],       questions:["How many years of electrical wiring experience do you have?","Describe a complex wiring project you completed.","Are you familiar with safety protocols for high-voltage work?"] },
  { id:"job-002", title:"Plumber (Residential & Commercial)", category:"plumber",     type:"private",    location:"Bengaluru, KA",        salary:"₹14,000–₹22,000/mo", openings:15, description:"Install and repair water supply pipes and drainage systems.",                  required_skills:["Pipe Fitting","Leak Detection","Water Supply","Sewage Systems"],            questions:["How many years of plumbing experience do you have?","Have you handled sewage system repairs?","Do you have commercial plumbing experience?"] },
  { id:"job-003", title:"Light Motor Vehicle Driver",         category:"driver",      type:"private",    location:"Bengaluru, KA",        salary:"₹14,000–₹20,000/mo", openings:30, description:"Drive company vehicles for deliveries and employee transport.",                  required_skills:["LMV License","Traffic Rules","Navigation","Vehicle Maintenance"],          questions:["Which vehicle license do you hold?","How many years of driving experience?","Have you driven in heavy traffic cities?"] },
  { id:"job-004", title:"Government School Teacher",          category:"teaching",    type:"government", location:"Varanasi, UP",         salary:"₹28,000–₹35,000/mo", openings:15, description:"Teach primary school students in government schools.",                           required_skills:["Teaching","Communication","Hindi/Kannada","Classroom Management"],         questions:["What subjects are you qualified to teach?","How many years of teaching experience?","Describe your classroom management approach."] },
  { id:"job-005", title:"ASHA Health Worker",                 category:"healthcare",  type:"government", location:"Raipur, CG",           salary:"₹15,000–₹20,000/mo", openings:22, description:"Promote health awareness and government health schemes in rural areas.",         required_skills:["Healthcare Awareness","Community Outreach","First Aid","Record Keeping"],  questions:["Do you have healthcare or nursing training?","Describe your community health experience.","How comfortable are you with record keeping?"] },
  { id:"job-006", title:"Municipal Plumber",                  category:"plumber",     type:"government", location:"Raipur, CG",           salary:"₹18,000–₹26,000/mo", openings:10, description:"Maintain municipal water supply pipelines and sewage systems.",                  required_skills:["Plumbing","Sewage Systems","Pipeline Repair","Physical Fitness"],          questions:["Have you worked on large-scale pipeline projects?","Experience with sewage pump maintenance?","Comfortable working in confined spaces?"] },
  { id:"job-007", title:"Ambulance Driver",                   category:"driver",      type:"government", location:"Raipur, CG",           salary:"₹16,000–₹22,000/mo", openings:15, description:"Drive 108 emergency ambulances under the state health department.",              required_skills:["LMV License","First Aid","Navigation","Emergency Response"],               questions:["Do you hold a valid driving license?","Have you completed first-aid training?","Describe a high-pressure driving situation."] },
  { id:"job-008", title:"Solar Panel Installer",              category:"electrician", type:"private",    location:"Jodhpur, RJ",          salary:"₹15,000–₹21,000/mo", openings:35, description:"Install rooftop solar panels under PM Surya Ghar scheme.",                      required_skills:["Solar Installation","Electrical Wiring","Rooftop Work","Safety"],          questions:["Have you installed solar panels before?","Comfortable working at heights?","Experience with DC/AC electrical connections?"] },
];

// Apply Form Modal
function ApplyModal({ job, profile, onClose, onSuccess }) {
  const [answers, setAnswers] = useState(job.questions.map(() => ""));
  const [coverNote, setCoverNote] = useState("");
  const [exp, setExp] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const setAnswer = (i) => (e) => setAnswers((a) => { const n=[...a]; n[i]=e.target.value; return n; });

  const submit = async () => {
    if (answers.some((a) => !a.trim())) { setErr("Please answer all questions."); return; }
    setLoading(true); setErr("");

    const payload = {
      user_id: profile.id, user_name: profile.name, user_email: profile.email,
      user_phone: profile.phone, user_skills: profile.skills, user_location: profile.location,
      experience_years: Number(exp), job_id: job.id, job_title: job.title,
      job_category: job.category, answers, cover_note: coverNote,
    };

    try {
      const res = await fetch(`${API}/apply`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      if (res.status === 409) { setErr("You already applied for this job."); setLoading(false); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      onSuccess(data);
    } catch {
      // Local fallback
      const apps = JSON.parse(localStorage.getItem("applications") || "[]");
      const dup = apps.find((a) => a.user_id === profile.id && a.job_id === job.id);
      if (dup) { setErr("You already applied for this job."); setLoading(false); return; }
      const appRecord = { ...payload, id: `app-${Date.now()}`, status:"Pending Review", applied_at: new Date().toISOString(), updated_at: new Date().toISOString(), admin_note:"" };
      apps.push(appRecord);
      localStorage.setItem("applications", JSON.stringify(apps));
      onSuccess(appRecord);
    }
    setLoading(false);
  };

  return (
    <div className="apply-overlay" onClick={onClose}>
      <div className="apply-modal" onClick={(e) => e.stopPropagation()}>
        <button className="apply-modal__close" id="apply-close" onClick={onClose}>✕</button>

        <div className="apply-modal__job-header">
          <p className="apply-modal__job-title">{CAT_ICONS[job.category] || "💼"} {job.title}</p>
          <p className="apply-modal__job-meta">📍 {job.location} · 💰 {job.salary}</p>
        </div>

        {err && <div className="auth-err">⚠️ {err}</div>}

        <p className="apply-section-title">Your Details (auto-filled)</p>
        <div className="auth-row">
          <div className="auth-field"><label className="auth-label">Full Name</label><input className="auth-input" value={profile.name} readOnly style={{ background:"#f9fafb" }} /></div>
          <div className="auth-field"><label className="auth-label">Phone</label><input className="auth-input" value={profile.phone} readOnly style={{ background:"#f9fafb" }} /></div>
        </div>
        <div className="auth-field"><label className="auth-label">Skills</label><input className="auth-input" value={profile.skills} readOnly style={{ background:"#f9fafb" }} /></div>
        <div className="auth-field"><label className="auth-label">Years of Experience</label>
          <input id="apply-exp" className="auth-input" type="number" min="0" max="40" value={exp} onChange={(e) => setExp(e.target.value)} />
        </div>

        <p className="apply-section-title">Job-Specific Questions</p>
        {job.questions.map((q, i) => (
          <div key={i} className="apply-q-block">
            <p className="apply-q-label">Q{i+1}. {q}</p>
            <textarea id={`apply-q-${i}`} className="apply-q-textarea" placeholder="Your answer…" value={answers[i]} onChange={setAnswer(i)} />
          </div>
        ))}

        <p className="apply-section-title">Cover Note (optional)</p>
        <textarea id="apply-cover" className="apply-q-textarea" placeholder="Tell us why you're a great fit…" value={coverNote} onChange={(e) => setCoverNote(e.target.value)} style={{ minHeight:60 }} />

        <button id="apply-submit" className="apply-submit-btn" onClick={submit} disabled={loading}>
          {loading ? "Submitting…" : "🚀 Submit Application"}
        </button>
      </div>
    </div>
  );
}

export default function JobListingPage() {
  const navigate = useNavigate();
  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [applyJob, setApplyJob]   = useState(null);   // job being applied to
  const [appliedIds, setAppliedIds] = useState([]);
  const [toast, setToast]         = useState("");

  const role    = localStorage.getItem("role");
  const userId  = localStorage.getItem("userId");
  const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");

  useEffect(() => {
    fetch(`${API}/jobs-list`)
      .then((r) => r.json())
      .then((d) => setJobs(Array.isArray(d) ? d : (Array.isArray(d?.jobs) ? d.jobs : DEMO_JOBS)))
      .catch(() => setJobs(DEMO_JOBS))
      .finally(() => setLoading(false));

    // Load applied IDs from localStorage
    const apps = JSON.parse(localStorage.getItem("applications") || "[]");
    setAppliedIds(apps.filter((a) => a.user_id === userId).map((a) => a.job_id));
  }, [userId]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const handleApply = (job) => {
    if (!role) { navigate("/register"); return; }
    if (role === "admin") { alert("Admins cannot apply for jobs."); return; }
    setApplyJob(job);
  };

  const handleSuccess = (appRecord) => {
    setAppliedIds((ids) => [...ids, appRecord.job_id]);
    setApplyJob(null);
    showToast("✅ Application submitted! Track it in My Applications.");
  };

  const displayed = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchQ = !q || j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.required_skills?.some((s) => s.toLowerCase().includes(q));
    const matchC = catFilter === "all" || j.category === catFilter;
    return matchQ && matchC;
  });

  const cats = ["all", ...new Set(jobs.map((j) => j.category))];

  return (
    <div className="jl-page">
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:"#1a1a2e", color:"#fff", padding:"14px 24px", borderRadius:50, fontWeight:600, fontSize:14, zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,0.2)", animation:"j-fadeup 0.3s ease", whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}

      <div className="jl-header">
        <span className="jl-eyebrow">💼 {displayed.length} Opportunities Available</span>
        <h1 className="jl-title">Find Your Dream Job</h1>
        <p className="jl-sub">Browse AI-matched jobs. Register once and track all your applications.</p>
        {!role && (
          <div style={{ marginTop:16, display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
            <button style={{ padding:"10px 24px", borderRadius:50, border:"none", background:"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14, fontFamily:"inherit" }} onClick={() => navigate("/register")}>Register to Apply</button>
            <button style={{ padding:"10px 24px", borderRadius:50, border:"1.5px solid #4f46e5", background:"transparent", color:"#4f46e5", fontWeight:700, cursor:"pointer", fontSize:14, fontFamily:"inherit" }} onClick={() => navigate("/login")}>Already registered? Login</button>
          </div>
        )}
        {role === "user" && (
          <button style={{ marginTop:14, padding:"9px 22px", borderRadius:50, border:"none", background:"rgba(79,70,229,0.1)", color:"#4f46e5", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"inherit" }} onClick={() => navigate("/my-applications")}>📊 Track My Applications →</button>
        )}
      </div>

      {/* Controls */}
      <div className="jl-controls">
        <input id="jl-search" className="jl-search" placeholder="🔍 Search job, location, skill…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select id="jl-cat-filter" className="jl-cat-filter" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          {cats.map((c) => <option key={c} value={c}>{c === "all" ? "All Categories" : `${CAT_ICONS[c] || "💼"} ${c.charAt(0).toUpperCase()+c.slice(1)}`}</option>)}
        </select>
      </div>

      {loading && <div className="j-loading"><div className="j-spinner" /></div>}

      {!loading && displayed.length === 0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"#9ca3af" }}>
          <p style={{ fontSize:18 }}>😔 No jobs match this search.</p>
          <button className="jl-apply-btn" style={{ width:"auto", padding:"10px 24px" }} onClick={() => { setSearch(""); setCatFilter("all"); }}>Clear Filters</button>
        </div>
      )}

      <div className="jl-grid">
        {displayed.map((job, idx) => {
          const color = CAT_COLORS[job.category] || "#4f46e5";
          const icon  = CAT_ICONS[job.category]  || "💼";
          const applied = appliedIds.includes(job.id);
          return (
            <div key={job.id} id={`job-card-${job.id}`} className="jl-card" style={{ animationDelay:`${idx*0.06}s` }}>
              <div className="jl-card__header">
                <div className="jl-card__icon" style={{ background: color+"18" }}>{icon}</div>
                <span className="jl-card__type-tag" style={{ background: job.type==="government"?"#dbeafe":"#fef3c7", color: job.type==="government"?"#1d4ed8":"#92400e" }}>
                  {job.type === "government" ? "🏛️ Govt" : "🏢 Private"}
                </span>
              </div>

              <span className="jl-card__cat-chip" style={{ color, background: color+"15", border:`1px solid ${color}30` }}>{icon} {job.category}</span>
              <h3 className="jl-card__title">{job.title}</h3>
              <p className="jl-card__desc">{job.description}</p>

              <div className="jl-skills">
                {job.required_skills?.slice(0,4).map((s) => <span key={s} className="jl-skill-chip">{s}</span>)}
              </div>

              <div className="jl-card__meta">
                <span className="jl-meta-pill">📍 {job.location}</span>
                <span className="jl-meta-pill">💰 {job.salary}</span>
                <span className="jl-meta-pill">👥 {job.openings} openings</span>
              </div>

              {applied
                ? <div className="jl-applied-tag">✅ Applied</div>
                : <button id={`apply-btn-${job.id}`} className="jl-apply-btn" onClick={() => handleApply(job)}>
                    {role ? "Apply Now →" : "Login to Apply →"}
                  </button>
              }
            </div>
          );
        })}
      </div>

      {applyJob && (
        <ApplyModal
          job={applyJob}
          profile={{ id: userId, name: profile.name||"", email: profile.email||"", phone: profile.phone||"", skills: profile.skills||"", location: profile.location||"" }}
          onClose={() => setApplyJob(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
