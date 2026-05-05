import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const role      = localStorage.getItem("role");
  const username  = localStorage.getItem("username");
  const [menuOpen, setMenuOpen] = useState(false);


  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const navLinks = [
    { label: "Home",            path: "/",                      show: true },
    { label: "Jobs",            path: "/jobs",                  show: true },
    { label: "Smart Jobs",      path: "/smart-jobs",            show: true },
    { label: "My Applications", path: "/my-applications",       show: role === "user" },
    { label: "Dashboard",       path: role === "admin" ? "/dashboard" : "/UserDashboard", show: !!role },
    { label: "Applications",    path: "/admin/applications",    show: role === "admin" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="gramya-navbar" role="navigation" aria-label="Main navigation">

      {/* ── Brand ── */}
      <button
        className="gramya-navbar__brand"
        onClick={() => navigate("/")}
        id="navbar-brand"
        aria-label="Go to Gramya AI home"
      >
        <span className="gramya-navbar__logo-icon" aria-hidden="true">🌱</span>
        <span>Gramya <strong>AI</strong></span>
      </button>

      {/* ── Desktop Nav Links ── */}
      <div className="gramya-navbar__links" role="list">
        {navLinks.filter((l) => l.show).map((link) => (
          <button
            key={link.path}
            id={`nav-${link.label.toLowerCase().replace(" ", "-")}`}
            className={`gramya-navbar__link${isActive(link.path) ? " active" : ""}`}
            onClick={() => navigate(link.path)}
            role="listitem"
            aria-current={isActive(link.path) ? "page" : undefined}
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* ── Right Action Buttons ── */}
      <div className="gramya-navbar__actions">
        {/* Not logged in → show Login + Sign Up */}
        {!role && (
          <>
            <button
              id="nav-login"
              className="gramya-navbar__btn gramya-navbar__btn--ghost"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
            <button
              id="nav-signup"
              className="gramya-navbar__btn gramya-navbar__btn--primary"
              onClick={() => navigate("/register")}
            >
              Sign Up
            </button>
          </>
        )}

        {/* Logged in → show username + Logout only */}
        {role && (
          <>
            <span className="gramya-navbar__role-badge" id="nav-user-badge">
              {role === "admin" ? "👑" : "👤"} {username || (role === "admin" ? "Admin" : "User")}
            </span>
            <button
              id="nav-logout"
              className="gramya-navbar__btn gramya-navbar__btn--danger"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}

        {/* Mobile hamburger */}
        <button
          className="gramya-navbar__hamburger"
          id="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>


      {/* ── Mobile Menu Dropdown ── */}
      {menuOpen && (
        <div className="gramya-navbar__mobile-menu" role="menu">
          {navLinks.filter((l) => l.show).map((link) => (
            <button
              key={link.path}
              className={`gramya-navbar__mobile-link${isActive(link.path) ? " active" : ""}`}
              onClick={() => { navigate(link.path); setMenuOpen(false); }}
              role="menuitem"
            >
              {link.label}
            </button>
          ))}
          {!role && (
            <>
              <button className="gramya-navbar__mobile-link" onClick={() => { navigate("/login"); setMenuOpen(false); }}>Login</button>
              <button className="gramya-navbar__mobile-link" onClick={() => { navigate("/signup"); setMenuOpen(false); }}>Sign Up</button>
            </>
          )}
          {role && (
            <button className="gramya-navbar__mobile-link gramya-navbar__mobile-link--danger" onClick={handleLogout}>Logout</button>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;