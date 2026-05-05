import { useNavigate } from "react-router-dom";
import "./App.css";

function Navbar() {
  const navigate = useNavigate();

  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div
      className="navbar"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        background: "linear-gradient(90deg, #4f46e5, #9333ea)",
        borderRadius: "10px",
        margin: "10px"
      }}
    >
      {/* 🔹 Logo */}
      <span style={{ fontWeight: "bold", fontSize: "18px", color: "white" }}>
        Gramya AI
      </span>

      {/* 🔹 Buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => navigate("/")}
          style={btnStyle}
        >
          Home
        </button>

        {/* 🔥 Show Logout only if logged in */}
        {role && (
          <button
            onClick={handleLogout}
            style={{ ...btnStyle, background: "#ef4444", color: "white" }}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

const btnStyle = {
  background: "white",
  borderRadius: "6px",
  padding: "6px 12px",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold"
};

export default Navbar;