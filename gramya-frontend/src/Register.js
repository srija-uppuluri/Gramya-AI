import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./jobs.css";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", phone:"", skills:"", location:"", username:"", password:"", confirm:"" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleRegister = () => {
    setError("");
    const { name, email, phone, skills, location, username, password, confirm } = form;
    if (!name || !email || !phone || !username || !password || !confirm) { setError("Please fill all required fields."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 4) { setError("Password must be at least 4 characters."); return; }

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const trimmedUsername = username.trim().toLowerCase();
    if (users.find((u) => (u.username || "").trim().toLowerCase() === trimmedUsername)) { setError("Username already taken."); return; }

    setLoading(true);
    const userId = `user-${Date.now()}`;
    const newUser = { id: userId, username, password, name, email, phone, skills, location, role: "user" };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    // Auto login
    localStorage.setItem("role", "user");
    localStorage.setItem("username", username);
    localStorage.setItem("userId", userId);
    localStorage.setItem("userProfile", JSON.stringify(newUser));

    setTimeout(() => { navigate("/jobs"); }, 400);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo">🌱</div>
        <h1 className="auth-card__title">Create Your Account</h1>
        <p className="auth-card__sub">Register to apply for jobs and track your applications</p>

        {error && <div className="auth-err">⚠️ {error}</div>}

        <p className="apply-section-title" style={{ marginTop:0 }}>Personal Details</p>
        <div className="auth-row">
          <div className="auth-field">
            <label className="auth-label">Full Name *</label>
            <input id="reg-name" className="auth-input" placeholder="Ramesh Kumar" value={form.name} onChange={set("name")} />
          </div>
          <div className="auth-field">
            <label className="auth-label">Phone *</label>
            <input id="reg-phone" className="auth-input" placeholder="9876543210" value={form.phone} onChange={set("phone")} />
          </div>
        </div>
        <div className="auth-field">
          <label className="auth-label">Email *</label>
          <input id="reg-email" className="auth-input" type="email" placeholder="you@email.com" value={form.email} onChange={set("email")} />
        </div>
        <div className="auth-field">
          <label className="auth-label">Location (District, State)</label>
          <input id="reg-location" className="auth-input" placeholder="Bengaluru, KA" value={form.location} onChange={set("location")} />
        </div>
        <div className="auth-field">
          <label className="auth-label">Your Skills (comma separated)</label>
          <input id="reg-skills" className="auth-input" placeholder="Electrical, Wiring, Tools…" value={form.skills} onChange={set("skills")} />
        </div>

        <p className="apply-section-title">Login Credentials</p>
        <div className="auth-field">
          <label className="auth-label">Username *</label>
          <input id="reg-username" className="auth-input" placeholder="Choose a username" value={form.username} onChange={set("username")} />
        </div>
        <div className="auth-row">
          <div className="auth-field">
            <label className="auth-label">Password *</label>
            <input id="reg-password" className="auth-input" type="password" placeholder="Min 4 chars" value={form.password} onChange={set("password")} />
          </div>
          <div className="auth-field">
            <label className="auth-label">Confirm *</label>
            <input id="reg-confirm" className="auth-input" type="password" placeholder="Repeat password" value={form.confirm} onChange={set("confirm")} />
          </div>
        </div>

        <button id="reg-submit" className="auth-submit-btn" onClick={handleRegister} disabled={loading}>
          {loading ? "Creating account…" : "🚀 Create Account & Apply"}
        </button>
        <p className="auth-link-text">Already registered? <span onClick={() => navigate("/login")}>Login here</span></p>
      </div>
    </div>
  );
}
