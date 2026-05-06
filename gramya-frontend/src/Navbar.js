import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeContext";
import "./Navbar.css";

const LANGUAGES = [
  { code: "en", label: "English",  flag: "🇬🇧" },
  { code: "kn", label: "ಕನ್ನಡ",   flag: "🇮🇳" },
  { code: "hi", label: "हिन्दी",   flag: "🇮🇳" },
];

function Navbar({ onStartTour }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const role     = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [langOpen,   setLangOpen]   = useState(false);
  const langRef = useRef(null);

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLangChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("gramya_language", code);
    setLangOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("userProfile");
    navigate("/login");
  };

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const navLinks = [
    { key: "nav_home",            path: "/",                                    show: true },
    { key: "nav_jobs",            path: "/jobs",                               show: true },
    { key: "nav_smart_jobs",      path: "/smart-jobs",                         show: true },
    { key: "nav_my_applications", path: "/my-applications",                    show: role === "user" },
    { key: "nav_dashboard",       path: role === "admin" ? "/dashboard" : "/UserDashboard", show: !!role },
    { key: "nav_applications",    path: "/admin/applications",                 show: role === "admin" },
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
            id={`nav-${link.key.replace("nav_", "").replace(/_/g, "-")}`}
            className={`gramya-navbar__link${isActive(link.path) ? " active" : ""}`}
            onClick={() => navigate(link.path)}
            role="listitem"
            aria-current={isActive(link.path) ? "page" : undefined}
          >
            {t(link.key)}
          </button>
        ))}
      </div>

      {/* ── Right Actions ── */}
      <div className="gramya-navbar__actions">

        {/* 🌐 Language Dropdown */}
        <div className="gramya-navbar__lang-wrap" ref={langRef}>
          <button
            id="navbar-lang-btn"
            className="gramya-navbar__icon-btn"
            onClick={() => setLangOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={langOpen}
            title={t("language")}
          >
            <span>{currentLang.flag}</span>
            <span className="gramya-navbar__lang-label">{currentLang.label}</span>
            <span className="gramya-navbar__chevron">{langOpen ? "▲" : "▾"}</span>
          </button>

          {langOpen && (
            <div className="gramya-navbar__lang-dropdown" role="listbox">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={i18n.language === lang.code}
                  className={`gramya-navbar__lang-option${i18n.language === lang.code ? " active" : ""}`}
                  onClick={() => handleLangChange(lang.code)}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                  {i18n.language === lang.code && <span className="gramya-navbar__lang-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 🌗 Theme Toggle */}
        <button
          id="navbar-theme-btn"
          className="gramya-navbar__icon-btn gramya-navbar__theme-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? t("theme_light") : t("theme_dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* 🧭 Tour Button */}
        {onStartTour && (
          <button
            id="navbar-tour-btn"
            className="gramya-navbar__btn gramya-navbar__btn--tour"
            onClick={onStartTour}
            title={t("take_tour")}
          >
            🧭 {t("take_tour")}
          </button>
        )}

        {/* Auth: not logged in */}
        {!role && (
          <>
            <button
              id="nav-login"
              className="gramya-navbar__btn gramya-navbar__btn--ghost"
              onClick={() => navigate("/login")}
            >
              {t("nav_login")}
            </button>
            <button
              id="nav-signup"
              className="gramya-navbar__btn gramya-navbar__btn--primary"
              onClick={() => navigate("/register")}
            >
              {t("nav_signup")}
            </button>
          </>
        )}

        {/* Auth: logged in */}
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
              {t("nav_logout")}
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

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div className="gramya-navbar__mobile-menu" role="menu">
          {navLinks.filter((l) => l.show).map((link) => (
            <button
              key={link.path}
              className={`gramya-navbar__mobile-link${isActive(link.path) ? " active" : ""}`}
              onClick={() => { navigate(link.path); setMenuOpen(false); }}
              role="menuitem"
            >
              {t(link.key)}
            </button>
          ))}

          {/* Mobile lang options */}
          <div className="gramya-navbar__mobile-lang">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                className={`gramya-navbar__mobile-lang-btn${i18n.language === lang.code ? " active" : ""}`}
                onClick={() => { handleLangChange(lang.code); setMenuOpen(false); }}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>

          {/* Mobile theme toggle */}
          <button
            className="gramya-navbar__mobile-link"
            onClick={() => { toggleTheme(); setMenuOpen(false); }}
          >
            {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

          {!role && (
            <>
              <button className="gramya-navbar__mobile-link" onClick={() => { navigate("/login"); setMenuOpen(false); }}>{t("nav_login")}</button>
              <button className="gramya-navbar__mobile-link" onClick={() => { navigate("/signup"); setMenuOpen(false); }}>{t("nav_signup")}</button>
            </>
          )}
          {role && (
            <button className="gramya-navbar__mobile-link gramya-navbar__mobile-link--danger" onClick={handleLogout}>{t("nav_logout")}</button>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;