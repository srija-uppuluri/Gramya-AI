import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./App.css";

function Dashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("candidates")) || [];
    setData(stored);
  }, []);

  // 🔹 Skill Distribution (Job Count)
  const skillMap = {};
  data.forEach((c) => {
    skillMap[c.job] = (skillMap[c.job] || 0) + 1;
  });

  const skillData = Object.keys(skillMap).map((key) => ({
    name: key,
    count: skillMap[key],
  }));

  // 🔹 Top Candidates Today
  const today = new Date().toDateString();

  const topCandidates = data
    .filter(
      (c) =>
        c.date &&
        new Date(c.date).toDateString() === today
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // 🔹 Colors for Pie Chart
  const COLORS = ["#6366f1", "#06b6d4", "#22c55e", "#f59e0b"];

  return (
    <div className="page-center">
      <div className="container">

        <h1 className="title">Admin Dashboard</h1>

        {/* 🔹 Skill Distribution Chart */}
        <div className="card">
          <h2>Skill Distribution</h2>

          <BarChart width={400} height={250} data={skillData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </div>

        {/* 🔹 Pie Chart */}
        <div className="card">
          <h2>Job Distribution</h2>

          <PieChart width={300} height={250}>
            <Pie
              data={skillData}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {skillData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </div>

        {/* 🔹 Top Candidates */}
        <div className="card">
          <h2>Top Candidates Today</h2>

          {topCandidates.length === 0 ? (
            <p>No data for today</p>
          ) : (
            <ul>
              {topCandidates.map((c, i) => (
                <li key={i}>
                  {c.name} - {c.job} - Score: {c.score}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 🔹 Existing Table */}
        <div className="card">
          <h2>All Candidates</h2>

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
              {data.map((c, i) => (
                <tr key={i}>
                  <td>{c.name}</td>
                  <td>{c.job}</td>
                  <td>{c.district}</td>
                  <td>{c.score}</td>
                  <td>{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;