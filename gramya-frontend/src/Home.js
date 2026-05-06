import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="hero">
      {/* Hero Content */}
      <div className="hero-content">
        <h1>
          {t("home_title")} <br />
          <span>{t("home_subtitle")}</span>
        </h1>

        <p>{t("home_desc")}</p>

        <div className="hero-buttons">
          <button
            className="btn user-btn"
            onClick={() => navigate("/login")}
          >
            👤 {t("home_user_btn")}
          </button>

          <button
            className="btn admin-btn"
            onClick={() => navigate("/login")}
          >
            🧑‍💼 {t("home_admin_btn")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;