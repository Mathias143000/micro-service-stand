import { useContext, useState } from "react";
import "./login.scss";
import { Link, useNavigate } from "react-router-dom";
import apiRequest from "../../lib/apiRequest";
import { AuthContext } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

function Login() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { updateUser } = useContext(AuthContext);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const formData = new FormData(e.target);

    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const res = await apiRequest.post("/auth/login", {
        username,
        password,
      });

      updateUser(res.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="formContainer">
        <div className="formCard">
          <form onSubmit={handleSubmit}>
            <span className="eyebrow">{t("auth.heroLabel")}</span>
            <h1>{t("auth.loginTitle")}</h1>
            <p className="subtitle">{t("auth.loginSubtitle")}</p>
            <input
              name="username"
              required
              minLength={3}
              maxLength={20}
              type="text"
              autoComplete="username"
              aria-label={t("auth.username")}
              placeholder={t("auth.username")}
            />
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              aria-label={t("auth.password")}
              placeholder={t("auth.password")}
            />
            <button disabled={isLoading}>{t("auth.login")}</button>
            {error && <span className="errorMessage">{error}</span>}
            <p className="switchRow">
              {t("auth.loginSwitch")} <Link to="/register">{t("auth.loginSwitchCta")}</Link>
            </p>
          </form>
        </div>
      </div>
      <div className="imgContainer">
        <div className="imageCard">
          <img src="/bg.jpg" alt="" />
        </div>
      </div>
    </div>
  );
}

export default Login;
