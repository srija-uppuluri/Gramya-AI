/**
 * OnboardingTour.js
 * ─────────────────────────────────────────────────────────────
 * First-time user guided tour using react-joyride.
 * Auto-triggers on first visit; shows only once (stored in localStorage).
 * Can also be triggered manually via the "Take a Tour" button.
 */
import React, { useState, useEffect, useCallback } from "react";
import { Joyride, STATUS } from "react-joyride";
import { useTranslation } from "react-i18next";

const TOUR_KEY = "gramya_tour_completed";

export function useTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      // Small delay so DOM elements have rendered
      const t = setTimeout(() => setRun(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const startTour = useCallback(() => setRun(true), []);
  const stopTour  = useCallback(() => setRun(false), []);

  return { run, startTour, stopTour };
}

export default function OnboardingTour({ run, onFinish }) {
  const { t } = useTranslation();

  const steps = [
    {
      target: ".gramya-navbar",
      title: t("tour_navbar_title"),
      content: t("tour_navbar_content"),
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "#nav-jobs, [id='nav-jobs']",
      title: t("tour_jobs_title"),
      content: t("tour_jobs_content"),
      placement: "bottom",
    },
    {
      target: "#navbar-lang-btn",
      title: t("tour_language_title"),
      content: t("tour_language_content"),
      placement: "bottom",
    },
    {
      target: "#navbar-theme-btn",
      title: "Theme Toggle",
      content: "Switch between light and dark mode for a comfortable experience.",
      placement: "bottom",
    },
    {
      target: "#nav-my-applications, [id='nav-my-applications']",
      title: t("tour_track_title"),
      content: t("tour_track_content"),
      placement: "bottom",
    },
  ];

  const handleCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem(TOUR_KEY, "true");
      onFinish?.();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      spotlightClicks
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: "#6366f1",
          textColor: "#1e293b",
          backgroundColor: "#ffffff",
          arrowColor: "#ffffff",
          overlayColor: "rgba(0,0,0,0.55)",
          zIndex: 9000,
        },
        buttonNext: {
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          borderRadius: 8,
          padding: "10px 20px",
          fontWeight: 700,
          fontSize: 14,
        },
        buttonSkip: {
          color: "#64748b",
          fontSize: 13,
        },
        buttonBack: {
          color: "#6366f1",
          fontSize: 13,
        },
        tooltip: {
          borderRadius: 14,
          padding: "20px 24px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
          fontFamily: "'Inter', sans-serif",
        },
        tooltipTitle: {
          fontSize: 15,
          fontWeight: 800,
          color: "#1e293b",
          marginBottom: 8,
        },
        tooltipContent: {
          fontSize: 13,
          color: "#475569",
          lineHeight: 1.6,
        },
        beacon: {
          inner: "#6366f1",
          outer: "rgba(99,102,241,0.4)",
        },
      }}
      locale={{
        back: "← Back",
        close: "Close",
        last: "Finish 🎉",
        next: "Next →",
        skip: "Skip Tour",
        open: "Open",
      }}
    />
  );
}
