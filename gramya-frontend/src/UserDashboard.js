import React from "react";
import { useNavigate } from "react-router-dom";

function UserDashboard() {
  const navigate = useNavigate();

  const candidates = JSON.parse(localStorage.getItem("candidates")) || [];

  return (
    <div className="page-center">
      <div className="container">

        <h1 className="title">Your Interview History</h1>

        {candidates.length === 0 ? (
          <div className="card">
            <p>No attempts yet</p>
            <button
              className="start-btn"
              onClick={() => navigate("/user")}
            >
              Start Interview
            </button>
          </div>
        ) : (
          <div className="card">

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#4f46e5", color: "white" }}>
                  <th style={th}>Name</th>
                  <th style={th}>Job</th>
                  <th style={th}>District</th>
                  <th style={th}>Score</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {candidates.map((item, i) => (
                  <tr key={i}>
                    <td style={td}>{item.name}</td>
                    <td style={td}>{item.job}</td>
                    <td style={td}>{item.district}</td>
                    <td style={td}>{item.score}</td>
                    <td
                      style={{
                        ...td,
                        color:
                          item.status === "Approved" ? "green" : "orange",
                        fontWeight: "bold",
                      }}
                    >
                      {item.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                className="start-btn"
                onClick={() => navigate("/user")}
              >
                Take New Interview
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

const th = {
  padding: "10px",
  borderBottom: "2px solid #ddd",
};

const td = {
  padding: "10px",
  borderBottom: "1px solid #eee",
  textAlign: "center",
};

export default UserDashboard;