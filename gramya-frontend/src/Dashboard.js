import React, { useEffect, useState } from "react";

function Dashboard() {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("candidates")) || [];
    setCandidates(data);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Admin Dashboard</h1>

      <table border="1" cellPadding="10" style={{ width: "100%" }}>
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
          {candidates.map((c, i) => (
            <tr key={i}>
              <td>{c.name}</td>
              <td>{c.job}</td>
              <td>{c.district}</td>
              <td style={{ color: c.score >= 7 ? "green" : "red" }}>
                {c.score}
              </td>
              <td>{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;