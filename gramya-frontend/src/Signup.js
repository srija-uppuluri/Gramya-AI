import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./jobs.css";

function Signup() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ username:"", password:"", confirm:"" });
  const [error, setError]   = useState("");

  // Guard: already logged-in users skip this page
  const existingRole = localStorage.getItem("role");
  if (existingRole === "admin") { navigate("/dashboard",     { replace: true }); return null; }
  if (existingRole === "user")  { navigate("/UserDashboard", { replace: true }); return null; }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSignup = () => {
    setError("");
    const { username, password, confirm } = form;
    if (!username || !password || !confirm) { setError("All fields are required."); return; }
    if (password !== confirm)               { setError("Passwords do not match."); return; }
    if (password.length < 4)               { setError("Password must be at least 4 characters."); return; }

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const trimmedUsername = username.trim().toLowerCase();
    if (users.find((u) => (u.username || "").trim().toLowerCase() === trimmedUsername)) { setError("Username already taken."); return; }

    const userId  = `user-${Date.now()}`;
    const newUser = { id: userId, username, password, name: username, email:"", phone:"", skills:"", location:"", role:"user" };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    // Auto-login
    localStorage.setItem("role",        "user");
    localStorage.setItem("username",    username);
    localStorage.setItem("userId",      userId);
    localStorage.setItem("userProfile", JSON.stringify(newUser));

    navigate("/UserDashboard", { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo">🌱</div>
        <h1 className="auth-card__title">Create Account</h1>
        <p className="auth-card__sub">Quick signup — add more details after</p>

        {error && <div className="auth-err">⚠️ {error}</div>}

        <div className="auth-field">
          <label className="auth-label">Username</label>
          <input id="signup-username" className="auth-input" placeholder="Choose a username" value={form.username} onChange={set("username")} />
        </div>
        <div className="auth-field">
          <label className="auth-label">Password</label>
          <input id="signup-password" className="auth-input" type="password" placeholder="Min 4 characters" value={form.password} onChange={set("password")} />
        </div>
        <div className="auth-field">
          <label className="auth-label">Confirm Password</label>
          <input id="signup-confirm" className="auth-input" type="password" placeholder="Repeat password" value={form.confirm} onChange={set("confirm")} />
        </div>

        <button id="signup-submit" className="auth-submit-btn" onClick={handleSignup}>Create Account →</button>

        <p className="auth-link-text">
          Already have an account? <span id="signup-goto-login" onClick={() => navigate("/login")}>Login</span>
        </p>
        <p className="auth-link-text" style={{ marginTop:4 }}>
          Want full profile? <span id="signup-goto-register" onClick={() => navigate("/register")}>Register with details</span>
        </p>
      </div>
    </div>
  );
}

export default Signup;