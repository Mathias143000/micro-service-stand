import { Link } from "react-router-dom";
import "./siteFooter.scss";
import { useLanguage } from "../../context/LanguageContext";

function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="siteFooter">
      <div className="left">
        <h3>RomanEstate</h3>
        <p>{t("footer.description")}</p>
        <small>© {new Date().getFullYear()} RomanEstate. {t("footer.rights")}</small>
      </div>

      <div className="right">
        <div className="column">
          <h4>{t("footer.marketplace")}</h4>
          <Link to="/">{t("nav.home")}</Link>
          <Link to="/list">{t("footer.browseListings")}</Link>
          <Link to="/nearby">{t("footer.nearbyProperties")}</Link>
        </div>
        <div className="column">
          <h4>{t("footer.account")}</h4>
          <Link to="/login">{t("nav.signIn")}</Link>
          <Link to="/register">{t("nav.signUp")}</Link>
          <Link to="/profile">{t("nav.profile")}</Link>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
