import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./jobs.css";

function Login() {
  const [role, setRole]         = useState("user");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const navigate = useNavigate();

  // Guard: already logged-in users never reach this page (PublicRoute handles it),
  // but as a safety net we check here too.
  const existingRole = localStorage.getItem("role");
  if (existingRole === "admin") { navigate("/dashboard",    { replace: true }); return null; }
  if (existingRole === "user")  { navigate("/UserDashboard",{ replace: true }); return null; }

  const handleLogin = () => {
    setError("");
    if (!username || !password) { setError("Please enter username and password."); return; }

    // ── Admin Login ──
    if (role === "admin") {
      if (username === "admin" && password === "admin123") {
        localStorage.setItem("role", "admin");
        localStorage.setItem("username", "admin");
        navigate("/dashboard", { replace: true });
      } else {
        setError("Invalid admin credentials. Try admin / admin123");
      }
      return;
    }

    // ── User Login ──
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const found = users.find((u) => u.username === username && u.password === password);
    if (found) {
      localStorage.setItem("role",        "user");
      localStorage.setItem("username",    found.username);
      localStorage.setItem("userId",      found.id || `user-${username}`);
      localStorage.setItem("userProfile", JSON.stringify(found));
      navigate("/UserDashboard", { replace: true });
    } else {
      setError("Invalid credentials. New user? Sign up below.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo">🌱</div>
        <h1 className="auth-card__title">Welcome Back</h1>
        <p className="auth-card__sub">Login to your Gramya AI account</p>

        {/* Role Toggle */}
        <div className="auth-role-toggle">
          <button id="login-role-user"  className={`auth-role-btn${role==="user"?" active":""}`}  onClick={() => setRole("user")}>👤 Candidate</button>
          <button id="login-role-admin" className={`auth-role-btn${role==="admin"?" active":""}`} onClick={() => setRole("admin")}>🧑‍💼 Admin</button>
        </div>

        {error && <div className="auth-err">⚠️ {error}</div>}

        <div className="auth-field">
          <label className="auth-label">Username</label>
          <input id="login-username" className="auth-input" placeholder={role==="admin"?"admin":"Your username"}
            value={username} onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
        </div>
        <div className="auth-field">
          <label className="auth-label">Password</label>
          <input id="login-password" className="auth-input" type="password" placeholder="Your password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
        </div>

        <button id="login-submit" className="auth-submit-btn" onClick={handleLogin}>
          Login →
        </button>

        {/* Sign Up link — only shown for non-admin */}
        {role === "user" && (
          <p className="auth-link-text">
            New here?{" "}
            <span id="login-goto-signup" onClick={() => navigate("/register")}>Create a free account</span>
          </p>
        )}

        {role === "admin" && (
          <p className="auth-link-text" style={{ color:"#9ca3af", fontSize:12 }}>
            Default credentials: <strong>admin</strong> / <strong>admin123</strong>
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;