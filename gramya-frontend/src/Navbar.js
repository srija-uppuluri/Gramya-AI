import { useNavigate } from "react-router-dom";
import "./App.css";

function Navbar() {
  const navigate = useNavigate();

  return (
    <div className="navbar">
      {/* Logo / Title */}
      <span style={{ fontWeight: "bold", fontSize: "18px" }}>
        Gramya AI
      </span>

      {/* Home Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          background: "white",
          borderRadius: "6px",
          padding: "6px 12px",
          border: "none",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        Home
      </button>
    </div>
  );
}

export default Navbar;