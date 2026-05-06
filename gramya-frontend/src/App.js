import React from "react";
import { Routes, Route } from "react-router-dom";

import Home              from "./Home";
import UserDashboard     from "./UserDashboard";
import Interview         from "./Interview";
import Result            from "./Result";
import UserForm          from "./UserForm";
import Dashboard         from "./Dashboard";
import Layout            from "./Layout";
import Login             from "./Login";
import Signup            from "./Signup";
import Register          from "./Register";
import ProtectedRoute, { PublicRoute } from "./ProtectedRoute";

import SmartJobAssistant    from "./SmartJobAssistant";
import CategoryJobsSection  from "./CategoryJobsSection";
import JobListingPage       from "./JobListingPage";
import ApplicationTracker   from "./ApplicationTracker";
import AdminApplications    from "./AdminApplications";
import AdminFraudDashboard  from "./AdminFraudDashboard";

import "./App.css";

function App() {
  return (
    <div className="app-layout">
      <Routes>
        <Route path="/" element={<Layout />}>

          {/* ── Public (unauthenticated) home ── */}
          <Route index element={<Home />} />

          {/* ── Auth routes — redirect away if already logged in ── */}
          <Route path="/login"    element={<PublicRoute><Login    /></PublicRoute>} />
          <Route path="/signup"   element={<PublicRoute><Signup   /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* ── User-protected routes ── */}
          <Route path="/user" element={
            <ProtectedRoute roleRequired="user"><UserForm /></ProtectedRoute>
          } />
          <Route path="/UserDashboard" element={
            <ProtectedRoute roleRequired="user"><UserDashboard /></ProtectedRoute>
          } />
          <Route path="/my-applications" element={
            <ProtectedRoute roleRequired="user"><ApplicationTracker /></ProtectedRoute>
          } />

          {/* ── Admin-protected routes ── */}
          <Route path="/dashboard" element={
            <ProtectedRoute roleRequired="admin"><Dashboard /></ProtectedRoute>
          } />
          <Route path="/admin/applications" element={
            <ProtectedRoute roleRequired="admin"><AdminApplications /></ProtectedRoute>
          } />
          <Route path="/admin/fraud" element={
            <ProtectedRoute roleRequired="admin"><AdminFraudDashboard /></ProtectedRoute>
          } />

          {/* ── Public job / tool routes ── */}
          <Route path="/jobs"          element={<JobListingPage      />} />
          <Route path="/category-jobs" element={<CategoryJobsSection />} />
          <Route path="/smart-jobs"    element={<SmartJobAssistant   />} />
          <Route path="/interview"     element={<Interview           />} />
          <Route path="/result"        element={<Result              />} />

        </Route>
      </Routes>
    </div>
  );
}

export default App;