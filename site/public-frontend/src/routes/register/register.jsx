import "./register.scss";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import apiRequest from "../../lib/apiRequest";
import { useLanguage } from "../../context/LanguageContext";

function Register() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const formData = new FormData(e.target);

    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");
    const mobile_number = formData.get("phone");
    try {
      await apiRequest.post("/auth/register", {
        username,
        email,
        password,
        mobile_number,
      });

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registerPage">
      <div className="formContainer">
        <div className="formCard">
          <form onSubmit={handleSubmit}>
            <span className="eyebrow">{t("auth.heroLabel")}</span>
            <h1>{t("auth.registerTitle")}</h1>
            <p className="subtitle">{t("auth.registerSubtitle")}</p>
            <input name="username" type="text" autoComplete="username" placeholder={t("auth.username")} aria-label={t("auth.username")} required />
            <input name="email" type="text" autoComplete="email" placeholder={t("auth.email")} aria-label={t("auth.email")} required />
            <input name="password" type="password" autoComplete="new-password" placeholder={t("auth.password")} aria-label={t("auth.password")} required />
            <input name="phone" type="tel" autoComplete="tel" placeholder={t("auth.phone")} aria-label={t("auth.phone")} pattern="[0-9]{10}" required />
            <button disabled={isLoading}>{t("auth.register")}</button>
            {error && <span className="errorMessage">{error}</span>}
            <p className="switchRow">
              {t("auth.registerSwitch")} <Link to="/login">{t("auth.registerSwitchCta")}</Link>
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

export default Register;
