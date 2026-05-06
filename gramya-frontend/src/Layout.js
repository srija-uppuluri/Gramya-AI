import React from "react";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import OnboardingTour, { useTour } from "./OnboardingTour";

function Layout() {
  const { run, startTour, stopTour } = useTour();

  return (
    <div className="app-layout">
      <OnboardingTour run={run} onFinish={stopTour} />
      <Navbar onStartTour={startTour} />
      <main style={{ flex: 1, width: "100%" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;