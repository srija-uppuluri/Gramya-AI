import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./Home";
import UserDashboard from "./UserDashboard";
import Interview from "./Interview";
import Result from "./Result";
import UserForm from "./UserForm";
import Dashboard from "./Dashboard";
import Layout from "./Layout";
import Login from "./Login";
import ProtectedRoute from "./ProtectedRoute";
import Signup from "./Signup";


import "./App.css";

function App() {
  return (
    <div className="app-layout">
<Routes>
  <Route path="/" element={<Layout />}>

    <Route index element={<Home />} />
    <Route path="/signup" element={<Signup />} />

    <Route path="/login" element={<Login />} />

    <Route path="/user" element={
      <ProtectedRoute roleRequired="user">
        <UserForm />
      </ProtectedRoute>
    } />

    <Route path="/UserDashboard" element={
      <ProtectedRoute roleRequired="user">
        <UserDashboard />
      </ProtectedRoute>
    } />

    <Route path="/interview" element={<Interview />} />
    <Route path="/result" element={<Result />} />

    <Route path="/dashboard" element={
      <ProtectedRoute roleRequired="admin">
        <Dashboard />
      </ProtectedRoute>
    } />

  </Route>
</Routes>
    </div>
  );
}

export default App;