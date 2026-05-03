import React, { useEffect, useState } from "react";
import "./App.css";
import Navbar from "./Navbar";

function Dashboard() {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("candidates")) || [];
    setCandidates(data);
  }, []);

  return (
    <>
    <div className="page-center">
    <div className="dashboard">

      <h1 className="title">Admin Dashboard</h1>

      {/* Table Container */}
      <div style={{ overflowX: "auto", marginTop: "20px" }}>
        <table className="table">

          <thead>
            <tr>
              <th>Name</th>
              <th>Job</th>
              <th>District</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {candidates.length > 0 ? (
              candidates.map((c, i) => (
                <tr key={i}>
                  <td>{c.name}</td>
                  <td>{c.job}</td>
                  <td>{c.district}</td>

                  <td
                    style={{
                      color: c.score >= 7 ? "green" : "red",
                      fontWeight: "bold"
                    }}
                  >
                    {c.score}
                  </td>

                  <td>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "8px",
                        background:
                          c.score >= 7 ? "#dcfce7" : "#fee2e2",
                        color:
                          c.score >= 7 ? "#166534" : "#991b1b",
                        fontSize: "12px"
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                  No candidates yet
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
      </div>
    </div>
  </> 
  );
}

export default Dashboard;