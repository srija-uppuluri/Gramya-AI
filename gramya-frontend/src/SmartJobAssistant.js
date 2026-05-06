import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./SmartJobAssistant.css";

// Fix Leaflet default icon path issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Custom coloured marker ────────────────────────────────────────────────────
const makeIcon = (color) =>
  new L.DivIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:${color};border:3px solid white;
      transform:rotate(-45deg);
      box-shadow:0 4px 12px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });

const TOP_ICON   = makeIcon("#ef4444");
const HIGH_ICON  = makeIcon("#4f46e5");
const NORM_ICON  = makeIcon("#6b7280");

// ── Mock job data (mirrors backend JOB_CATALOG) ───────────────────────────────
const ALL_JOBS = [
  { id:1, title:"Government School Teacher", category:"teaching", type:"government", required_skills:["teaching","communication","hindi","education","patience"], location:"Varanasi, UP", lat:25.3176, lng:82.9739, salary:"₹28,000–₹35,000/mo", tags:["Teaching","Hindi","Government"], openings:15, top_match:true,  match_score:94, ai_reason:"Your communication & education answers scored highly.", missing_skills:["patience"], skill_gap_suggestion:"Practice classroom management scenarios." },
  { id:2, title:"Electrician / Wiring Technician", category:"electrician", type:"private",  required_skills:["electrical","wiring","circuit","tools","safety"], location:"Bengaluru Rural, KA", lat:13.0012, lng:77.5667, salary:"₹18,000–₹25,000/mo", tags:["Electrical","Wiring","Private"], openings:8,  top_match:false, match_score:87, ai_reason:"Electrical aptitude detected in your profile.", missing_skills:["circuit","safety"], skill_gap_suggestion:"Learn basic circuit concepts at your nearest ITI." },
  { id:3, title:"ASHA Health Worker", category:"healthcare", type:"government", required_skills:["healthcare","community","awareness","communication","first aid"], location:"Raipur, CG", lat:21.2514, lng:81.6296, salary:"₹15,000–₹20,000/mo", tags:["Healthcare","Community","Government"], openings:22, top_match:false, match_score:91, ai_reason:"Community engagement skills are a strong match.", missing_skills:["first aid"], skill_gap_suggestion:"Take a free first-aid course via Red Cross India." },
  { id:4, title:"Dairy Farm Supervisor", category:"farming", type:"government", required_skills:["farming","livestock","dairy","management","animal care"], location:"Mehsana, GJ", lat:23.5880, lng:72.3693, salary:"₹18,000–₹22,000/mo", tags:["Farming","Livestock","Dairy"], openings:5,  top_match:false, match_score:82, ai_reason:"Rural farming background aligns well with this role.", missing_skills:["management"], skill_gap_suggestion:"Short dairy management course available at NDDB." },
  { id:5, title:"Solar Panel Installer", category:"solar", type:"private",  required_skills:["solar","electrical","installation","panels","renewable energy"], location:"Jodhpur, RJ", lat:26.2389, lng:73.0243, salary:"₹14,000–₹20,000/mo", tags:["Solar","Electrical","Private"], openings:30, top_match:false, match_score:76, ai_reason:"Basic electrical knowledge detected. On-site training provided.", missing_skills:["solar","panels","renewable energy"], skill_gap_suggestion:"Enrol in PM Surya Ghar training program (free)." },
  { id:6, title:"Computer Operator (CSC)", category:"computer", type:"government", required_skills:["computer","typing","data entry","internet","ms office"], location:"Mysuru, KA", lat:12.2958, lng:76.6394, salary:"₹12,000–₹16,000/mo", tags:["Computer","Data Entry","Government"], openings:12, top_match:false, match_score:79, ai_reason:"Basic computer skills detected in your interview.", missing_skills:["ms office","internet"], skill_gap_suggestion:"Free MS Office course on PM e-Vidya portal." },
];

const FILTERS = [
  { key:"all",        label:"All Jobs" },
  { key:"nearby",     label:"📍 Nearby" },
  { key:"high-match", label:"🔥 High Match" },
  { key:"government", label:"🏛️ Government" },
  { key:"private",    label:"🏢 Private" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const matchColor = (s) =>
  s >= 90 ? "linear-gradient(135deg,#22c55e,#16a34a)"
  : s >= 80 ? "linear-gradient(135deg,#3b82f6,#6366f1)"
  : "linear-gradient(135deg,#f59e0b,#d97706)";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

// Keyword → skill intent map (Kannada + English)
const INTENT_MAP = {
  electrician: [
    "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್",
    "electrical",
    "wiring",
    "ವಿದ್ಯುತ್",
    "electric",
    "current",
    "wire",
    "eb",
    "electrician",
    "line work"
  ],

  teaching: [
    "ಶಿಕ್ಷಕ",
    "teacher",
    "teaching",
    "school",
    "ಶಾಲೆ",
    "professor",
    "tuition"
  ],

  healthcare: [
    "ಆರೋಗ್ಯ",
    "health",
    "asha",
    "nurse",
    "hospital",
    "doctor",
    "medical"
  ],

  farming: [
    "ರೈತ",
    "farmer",
    "farm",
    "dairy",
    "livestock",
    "ಕೃಷಿ",
    "agriculture"
  ],

  solar: [
    "ಸೌರ",
    "solar",
    "panel",
    "renewable",
    "sun power"
  ],

  computer: [
    "ಕಂಪ್ಯೂಟರ್",
    "computer",
    "typing",
    "data entry",
    "software",
    "office work"
  ]
};

function extractIntent(text) {
  const lower = text.toLowerCase();
  const skills = [];
  for (const [skill, kws] of Object.entries(INTENT_MAP)) {
    if (kws.some((k) => lower.includes(k.toLowerCase()))) skills.push(skill);
  }
  return skills.length ? skills : ["general"];
}

function filterJobs(jobs, filter, userLat, userLng) {
  let out = [...jobs];
  if (filter === "nearby" && userLat) {
    out = out.filter((j) => {
      const d = Math.hypot(j.lat - userLat, j.lng - userLng) * 111;
      return d < 600;
    });
  }
  if (filter === "high-match") out = out.filter((j) => j.match_score > 80);
  if (filter === "government")  out = out.filter((j) => j.type === "government");
  if (filter === "private")     out = out.filter((j) => j.type === "private");
  return out;
}

// ── Map flyTo helper ──────────────────────────────────────────────────────────
function MapFly({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 8, { duration: 1.2 }); }, [center, map]);
  return null;
}

// ── Job Detail Modal ──────────────────────────────────────────────────────────
function JobModal({ job, onClose }) {
  if (!job) return null;
  const mc = matchColor(job.match_score);
  return (
    <div className="sja-modal-overlay" onClick={onClose}>
      <div className="sja-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sja-modal-close" onClick={onClose} id="sja-modal-close">✕</button>
        <div className="sja-modal-match-badge" style={{ background: mc }}>{job.match_score}% Match</div>
        <h2 className="sja-modal-title">{job.title}</h2>
        <p className="sja-modal-sub">{job.type === "government" ? "🏛️ Government" : "🏢 Private"} · {job.openings} openings</p>

        <div className="sja-modal-section">
          <h4>🤖 Why AI Suggests This</h4>
          <p>{job.ai_reason}</p>
        </div>
        <div className="sja-modal-section">
          <h4>📍 Location</h4>
          <p>{job.location}</p>
        </div>
        <div className="sja-modal-section">
          <h4>💰 Salary</h4>
          <p>{job.salary}</p>
        </div>
        {job.missing_skills?.length > 0 && (
          <div className="sja-modal-section">
            <h4>📉 Skills to Improve</h4>
            <div className="sja-missing-chips" style={{ marginTop: 6 }}>
              {job.missing_skills.map((s) => <span key={s} className="sja-missing-chip">{s}</span>)}
            </div>
            <p style={{ marginTop: 8 }}>{job.skill_gap_suggestion}</p>
          </div>
        )}
        <button
          className="sja-apply-btn"
          id={`sja-apply-modal-${job.id}`}
          style={{ marginTop: 8 }}
          onClick={() => alert(`✅ Applied for: ${job.title}`)}
        >
          🚀 Apply Now
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SmartJobAssistant() {
  const [tab, setTab]               = useState("jobs");        // jobs | map
  const [filter, setFilter]         = useState("all");
  const [jobs, setJobs]             = useState(ALL_JOBS);
  const [transcript, setTranscript] = useState("");
  const [detectedSkills, setDetectedSkills] = useState([]);
  const [recording, setRecording]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [textInput, setTextInput]   = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [userPos, setUserPos]       = useState(null);         // { lat, lng }
  const [mapCenter, setMapCenter]   = useState([20.5937, 78.9629]); // India centre
  const [kannResponse, setKannResponse] = useState("");

  const recognitionRef = useRef(null);

  // ── Browser Speech Recognition ──────────────────────────────────────────────
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported in this browser. Please type your query."); return; }
    const rec = new SR();
    rec.lang = "kn-IN";            // Kannada
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    setRecording(true);
    rec.start();
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      handleSearch(text);
    };
    rec.onerror = () => setRecording(false);
    rec.onend   = () => setRecording(false);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  // ── Search / ranking ────────────────────────────────────────────────────────
  const handleSearch = async (query) => {
    const q = (query || textInput || "").trim();
    if (!q) return;
    setLoading(true);
    setTranscript(q);

    try {
      const fd = new FormData();
      fd.append("text_input", q);
      if (userPos) { fd.append("user_lat", userPos.lat); fd.append("user_lng", userPos.lng); }
      const res = await fetch(`${API}/voice-job-suggestions`, { method:"POST", body:fd });
      if (res.ok) {
        const data = await res.json();

        setJobs(data.jobs);

      
        setDetectedSkills(data.detected_skills || []);
        setKannResponse(data.kannada_response_text || "");
     } else { throw new Error("API error"); }
    } catch {
      // Fallback: local intent extraction
      const skills = extractIntent(q);
      setDetectedSkills(skills);
      const boostedJobs = ALL_JOBS.map(job => {
        const isMatch = skills.includes(job.category);
        return {
          ...job,
          match_score: isMatch ? Math.max(95, job.match_score + 10) : job.match_score
        };
      });

      const ranked = boostedJobs.sort((a, b) => {
        const aHit = skills.includes(a.category) ? 1 : 0;
        const bHit = skills.includes(b.category) ? 1 : 0;
        if (aHit !== bHit) {
            return bHit - aHit;
        }
        return b.match_score - a.match_score;
      });
      setJobs(ranked);
      setKannResponse(`ನಿಮಗಾಗಿ ${ranked.length} ಕೆಲಸಗಳು ಕಂಡುಬಂದಿವೆ`);
    }
    setLoading(false);
  };

  // ── GPS location ────────────────────────────────────────────────────────────
  const getLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserPos({ lat, lng });
        setMapCenter([lat, lng]);
        setFilter("nearby");
      },
      () => alert("Location access denied. Please enable GPS.")
    );
  };

  // ── Nearby jobs via backend ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userPos) return;
    fetch(`${API}/nearby-jobs?lat=${userPos.lat}&lng=${userPos.lng}`)
      .then((r) => r.json())
      .then((d) => { if (d.jobs?.length) setJobs(d.jobs); })
      .catch(() => {});
  }, [userPos]);

  // ── TTS – browser native ────────────────────────────────────────────────────
  const speakKannada = () => {
    if (!kannResponse || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(kannResponse);
    utter.lang = "kn-IN";
    window.speechSynthesis.speak(utter);
  };

  const displayed = filterJobs(jobs, filter, userPos?.lat, userPos?.lng);

  // ── Map marker icon chooser ──────────────────────────────────────────────────
  const markerIcon = (job) =>
    job.top_match ? TOP_ICON : job.match_score >= 80 ? HIGH_ICON : NORM_ICON;

  return (
    <div className="sja-page">
      <div className="sja-container">

        {/* ── Header ── */}
        <div className="sja-header">
          <div className="sja-header__chip">🤖 AI Powered · Kannada Voice Support</div>
          <h1>AI Smart Job Assistant</h1>
          <p>Speak in Kannada or type to discover personalised job opportunities near you</p>
        </div>

        <div className="sja-grid">
          {/* ══ LEFT COLUMN: Voice Panel ══ */}
          <div>
            <div className="sja-panel">
              <p className="sja-panel__title">🎤 Voice Job Search</p>

              <div className="sja-mic-area">
                <button
                  id="sja-mic-btn"
                  className={`sja-mic-btn${recording ? " recording" : ""}`}
                  onClick={recording ? stopVoice : startVoice}
                  aria-label={recording ? "Stop recording" : "Start Kannada voice input"}
                >
                  {recording ? "⏹" : "🎤"}
                </button>
                <p className="sja-mic-label">
                  {recording
                    ? <><strong>Listening…</strong> ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ</>
                    : "Tap to speak in Kannada"}
                </p>
              </div>

              <div className="sja-text-input-row">
                <input
                  id="sja-text-input"
                  className="sja-text-input"
                  placeholder="Or type: electrician job…"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button id="sja-search-btn" className="sja-search-btn" onClick={() => handleSearch()}>🔍</button>
              </div>

              {transcript && (
                <div className="sja-transcript">
                  <strong>You said:</strong> {transcript}
                </div>
              )}

              {kannResponse && (
                <button className="sja-tts-btn" id="sja-tts-btn" onClick={speakKannada}>
                  🔊 ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ (Listen in Kannada)
                </button>
              )}

              {detectedSkills.length > 0 && (
                <div className="sja-detected-skills">
                  {detectedSkills.map((s) => <span key={s} className="sja-skill-chip">{s}</span>)}
                </div>
              )}
            </div>

            {/* Skill Gap Panel (shows when a job is selected) */}
            {selectedJob && (
              <div className="sja-gap-panel">
                <p className="sja-gap-title">📉 Skill Gap Analysis</p>
                <p className="sja-gap-job-name">🎯 {selectedJob.title}</p>

                {selectedJob.missing_skills?.length === 0 ? (
                  <div className="sja-missing-chips">
                    <span className="sja-no-gap-chip">✅ All skills matched!</span>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize:12, color:"#9ca3af", marginBottom:8 }}>Missing Skills:</p>
                    <div className="sja-missing-chips">
                      {selectedJob.missing_skills.map((s) =>
                        <span key={s} className="sja-missing-chip">❌ {s}</span>)}
                    </div>
                  </>
                )}

                <div className="sja-gap-suggestion">
                  💡 {selectedJob.skill_gap_suggestion}
                </div>

                <button
                  className="sja-apply-btn"
                  id={`sja-apply-gap-${selectedJob.id}`}
                  style={{ marginTop:14 }}
                  onClick={() => alert(`✅ Applied for: ${selectedJob.title}`)}
                >
                  🚀 Apply Now
                </button>
              </div>
            )}
          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div>
            {/* View Tabs */}
            <div className="sja-tabs">
              {[["jobs","📊 Job Cards"],["map","📍 Map View"]].map(([k,l]) => (
                <button key={k} id={`sja-tab-${k}`}
                  className={`sja-tab${tab === k ? " active" : ""}`}
                  onClick={() => setTab(k)}>{l}</button>
              ))}
            </div>

            {/* Filter chips */}
            <div className="sja-filters">
              {FILTERS.map((f) => (
                <button key={f.key} id={`sja-filter-${f.key}`}
                  className={`sja-filter-btn${filter === f.key ? " active" : ""}`}
                  onClick={() => setFilter(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>

            <p className="sja-results-count">
              Showing <strong>{displayed.length}</strong> job{displayed.length !== 1 ? "s" : ""}
            </p>

            {/* ── MAP TAB ── */}
            {tab === "map" && (
              <div className="sja-panel" style={{ padding:0, overflow:"hidden" }}>
                {!userPos && (
                  <div className="sja-location-banner" style={{ margin:16 }}>
                    📍 Allow location access to see jobs near you
                    <br />
                    <button id="sja-location-btn" className="sja-location-btn" onClick={getLocation}>
                      📍 Use My Location
                    </button>
                  </div>
                )}
                <div className="sja-map-wrapper">
                  <MapContainer center={mapCenter} zoom={5} style={{ height:"100%", width:"100%" }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    <MapFly center={mapCenter} />
                    {userPos && (
                      <Marker position={[userPos.lat, userPos.lng]}
                        icon={new L.DivIcon({ className:"", html:'<div style="width:16px;height:16px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 0 0 4px rgba(34,197,94,0.3);"></div>', iconSize:[16,16], iconAnchor:[8,8] })}>
                        <Popup><strong>📍 You are here</strong></Popup>
                      </Marker>
                    )}
                    {displayed.map((job) => (
                      <Marker key={job.id} position={[job.lat, job.lng]} icon={markerIcon(job)}>
                        <Popup>
                          <div style={{ minWidth:200 }}>
                            {job.top_match && <span style={{ background:"#ef4444",color:"#fff",fontSize:10,padding:"2px 8px",borderRadius:50,fontWeight:700 }}>🔥 Top Match</span>}
                            <p style={{ fontWeight:700, margin:"6px 0 4px", fontSize:14 }}>{job.title}</p>
                            <p style={{ margin:"2px 0", fontSize:12, color:"#6b7280" }}>📍 {job.location}</p>
                            <p style={{ margin:"2px 0", fontSize:12, color:"#4f46e5", fontWeight:600 }}>{job.match_score}% match · {job.salary}</p>
                            <button
                              style={{ marginTop:8, width:"100%", padding:"7px 0", borderRadius:8, border:"none", background:"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13 }}
                              onClick={() => { setSelectedJob(job); setTab("jobs"); }}
                            >Apply Now →</button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            )}

            {/* ── JOBS TAB ── */}
            {tab === "jobs" && (
              loading ? (
                <div className="sja-loading">
                  <div className="sja-spinner" />
                  <p>Finding your best matches…</p>
                </div>
              ) : displayed.length === 0 ? (
                <div className="sja-empty">
                  <p>😔 No jobs match this filter.</p>
                  <button className="sja-filter-btn active" onClick={() => setFilter("all")}>Show All</button>
                </div>
              ) : (
                <div className="sja-jobs-grid">
                  {displayed.map((job, idx) => {
                    const mc = matchColor(job.match_score);
                    const isTop = idx === 0 && job.top_match;
                    return (
                      <div key={job.id} id={`sja-job-${job.id}`}
                        className={`sja-job-card${isTop ? " top-match" : ""}`}
                        onClick={() => setSelectedJob(job)}
                        role="button" tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedJob(job)}
                        aria-label={`View ${job.title}`}>

                        {isTop && <span className="sja-top-badge">🔥 Top Match</span>}

                        <div className="sja-card-header">
                          <div className="sja-job-icon">{job.type === "government" ? "🏛️" : "🏢"}</div>
                          <span className="sja-match-badge" style={{ background: mc }}>
                            {job.match_score}%
                          </span>
                        </div>

                        <h3 className="sja-job-title">{job.title}</h3>

                        <div className="sja-match-bar">
                          <div className="sja-match-fill" style={{ width:`${job.match_score}%`, background:mc }} />
                        </div>

                        <p className="sja-job-ai">✨ {job.ai_reason}</p>

                        <div className="sja-job-meta">
                          <span className="sja-meta-pill">📍 {job.location}</span>
                          <span className="sja-meta-pill">💰 {job.salary}</span>
                          <span className="sja-meta-pill">👥 {job.openings} openings</span>
                        </div>

                        <button
                          id={`sja-apply-${job.id}`}
                          className="sja-apply-btn"
                          onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                        >
                          Apply Now →
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
