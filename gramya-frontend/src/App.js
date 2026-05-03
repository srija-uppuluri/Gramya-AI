import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./Home";
import UserDashboard from "./UserDashboard";
import Interview from "./Interview";
import Result from "./Result";
import UserForm from "./UserForm";
import Dashboard from "./Dashboard";
import Layout from "./Layout";


import "./App.css";

function App() {
  return (
    <div className="app-layout">
<Routes>
  <Route path="/" element={<Layout />}>
    
    <Route index element={<Home />} />   {/* instead of index */}
    <Route path="user" element={<UserForm />} />
    <Route path="/UserDashboard" element={<UserDashboard />} />
    <Route path="/interview" element={<Interview />} />
    <Route path="/result" element={<Result />} />
    <Route path="/dashboard" element={<Dashboard />} />

  </Route>
</Routes>
    </div>
  );
}

export default App;