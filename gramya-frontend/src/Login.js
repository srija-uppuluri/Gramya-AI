import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [role, setRole] = useState("user");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = () => {
    // 🔹 USER LOGIN
    if (role === "user") {
      const users = JSON.parse(localStorage.getItem("users")) || [];

      const validUser = users.find(
        (u) => u.username === username && u.password === password
      );

      if (validUser) {
        localStorage.setItem("role", "user");
        localStorage.setItem("username", username);
        navigate("/user");
      } else {
        alert("Invalid user credentials");
      }
    }

    // 🔹 ADMIN LOGIN
    else if (role === "admin") {
      if (username === "admin" && password === "admin123") {
        localStorage.setItem("role", "admin");
        navigate("/dashboard");
      } else {
        alert("Invalid admin credentials");
      }
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>

      {/* 🔹 ROLE SELECT */}
      <div style={{ marginBottom: "15px" }}>
        <button
          onClick={() => setRole("user")}
          style={{
            marginRight: "10px",
            background: role === "user" ? "#4f46e5" : "#ddd",
            color: role === "user" ? "white" : "black",
            padding: "8px 12px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          👤 User
        </button>

        <button
          onClick={() => setRole("admin")}
          style={{
            background: role === "admin" ? "#4f46e5" : "#ddd",
            color: role === "admin" ? "white" : "black",
            padding: "8px 12px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          🧑‍💼 Admin
        </button>
      </div>

      {/* 🔹 INPUTS */}
      <input
        type="text"
        placeholder="Enter Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="auth-input"
      />

      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="auth-input"
      />

      {/* 🔹 LOGIN BUTTON */}
      <button onClick={handleLogin} className="auth-btn">
        Login
      </button>

      {/* 🔹 SIGNUP LINK (only for user) */}
      {role === "user" && (
        <p style={{ marginTop: "10px" }}>
          New user?{" "}
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>
      )}
    </div>
  );
}

export default Login;