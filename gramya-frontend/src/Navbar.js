import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        padding: "12px 20px",
        background: "#4f46e5",
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
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