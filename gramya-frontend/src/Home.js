import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="hero">
      {/* Hero Content */}
      <div className="hero-content">
        <h1>
          Smart Interviews. <br />
          <span>Better Opportunities.</span>
        </h1>

        <p>
          Gramya AI helps rural workers prepare for jobs with AI-powered
          interviews, skill evaluation, and real-time feedback.
        </p>

        <div className="hero-buttons">
          <button
            className="btn user-btn"
            onClick={() => navigate("/login")}   // ✅ FIXED
          >
            👤 I'm a User
          </button>

          <button
            className="btn admin-btn"
            onClick={() => navigate("/login")}  // ✅ FIXED
          >
            🧑‍💼 I'm Admin
          </button>
        </div>
      </div>

    </div>
  );
}

export default Home;