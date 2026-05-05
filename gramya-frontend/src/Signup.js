import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = () => {
    if (!username || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];

    const userExists = users.find((u) => u.username === username);

    if (userExists) {
      alert("User already exists");
      return;
    }

    users.push({ username, password });

    localStorage.setItem("users", JSON.stringify(users));

    alert("Signup successful! Please login");

    navigate("/login");
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>

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

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="auth-input"
      />

      <button onClick={handleSignup} className="auth-btn">
        Sign Up
      </button>

      <p>
        Already have an account?{" "}
        <span
          style={{ color: "blue", cursor: "pointer" }}
          onClick={() => navigate("/login")}
        >
          Login
        </span>
      </p>
    </div>
  );
}

export default Signup;