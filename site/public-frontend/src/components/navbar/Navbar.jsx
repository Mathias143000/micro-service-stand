import { useContext, useState } from "react";
import "./navbar.scss";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import SafeImage from "../safeImage/SafeImage";
import { useLanguage } from "../../context/LanguageContext";

function Navbar() {
  const [open, setOpen] = useState(false);
  const { currentUser } = useContext(AuthContext);
  const { language, setLanguage, t } = useLanguage();

  const navLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/list", label: t("nav.listings") },
    { to: "/new-builds", label: t("nav.newBuilds") },
    { to: "/nearby", label: t("nav.nearby") },
    { to: "/profile?tab=favorites", label: t("nav.favorites"), authOnly: true },
    { to: "/profile?tab=deals", label: t("nav.deals"), authOnly: true },
  ];

  const visibleLinks = navLinks.filter((item) => currentUser || !item.authOnly);
  const menuAriaLabel = open
    ? language === "ru"
      ? "Закрыть меню"
      : "Close menu"
    : language === "ru"
      ? "Открыть меню"
      : "Open menu";
  const languageAriaLabel = language === "ru" ? "Переключить язык" : "Switch language";

  const closeMenu = () => setOpen(false);

  return (
    <nav className={open ? "menuOpen" : ""}>
      <div className="brandCluster">
        <Link to="/" className="logo" onClick={closeMenu}>
          <img src="/logo.png" alt="" />
          <div className="logoCopy">
            <span className="brandName">RomanEstate</span>
            <small>
              {language === "ru" ? "Подобранная витрина недвижимости" : "Curated property marketplace"}
            </small>
          </div>
        </Link>
      </div>
      <div className="actionCluster">
        <div className="languageToggle" role="group" aria-label={languageAriaLabel}>
          <button
            type="button"
            className={language === "en" ? "langButton active" : "langButton"}
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
          >
            EN
          </button>
          <button
            type="button"
            className={language === "ru" ? "langButton active" : "langButton"}
            onClick={() => setLanguage("ru")}
            aria-pressed={language === "ru"}
          >
            RU
          </button>
        </div>
        {currentUser ? (
          <Link to="/profile" className="accountChip" onClick={closeMenu}>
            <SafeImage src={currentUser.avatar} fallback="/noavatar.jpg" alt={currentUser.username} />
            <span>{currentUser.username}</span>
          </Link>
        ) : (
          <div className="authLinks">
            <Link to="/login" className="signIn" onClick={closeMenu}>{t("nav.signIn")}</Link>
            <Link to="/register" className="register" onClick={closeMenu}>
              {t("nav.signUp")}
            </Link>
          </div>
        )}
        <button
          type="button"
          className={open ? "menuIcon active" : "menuIcon"}
          onClick={() => setOpen((prev) => !prev)}
          aria-label={menuAriaLabel}
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      <div className="navRow">
        {visibleLinks.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === "/"}
            onClick={closeMenu}
            className={({ isActive }) => (isActive ? "navLink activeLink" : "navLink")}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
      <button
        type="button"
        className={open ? "menuBackdrop active" : "menuBackdrop"}
        onClick={closeMenu}
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
      />
      <div className={open ? "mobilePanel active" : "mobilePanel"}>
        <div className="mobilePanelTop">
          <div>
            <span className="mobileEyebrow">{language === "ru" ? "Навигация" : "Navigation"}</span>
            <strong>RomanEstate</strong>
          </div>
          {currentUser && (
            <Link to="/profile" className="mobileProfile" onClick={closeMenu}>
              {t("nav.profile")}
            </Link>
          )}
        </div>
        <div className="mobileNavLinks">
          {visibleLinks.map((item) => (
            <NavLink
              key={`mobile-${item.label}`}
              to={item.to}
              end={item.to === "/"}
              onClick={closeMenu}
              className={({ isActive }) => (isActive ? "mobileNavLink activeLink" : "mobileNavLink")}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        {currentUser ? (
          <Link to="/profile" className="mobileAccountLink" onClick={closeMenu}>
            {t("nav.profile")}
          </Link>
        ) : (
          <div className="mobileAuthLinks">
            <Link to="/login" onClick={closeMenu}>{t("nav.signIn")}</Link>
            <Link to="/register" className="register" onClick={closeMenu}>
              {t("nav.signUp")}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
