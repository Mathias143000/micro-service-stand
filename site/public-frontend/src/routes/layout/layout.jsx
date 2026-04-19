import "./layout.scss";
import Navbar from "../../components/navbar/Navbar";
import SupportChatWidget from "../../components/supportChatWidget/SupportChatWidget";
import SiteFooter from "../../components/siteFooter/SiteFooter";
import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

function Shell() {
  return (
    <div className="layout">
      <div className="navbar">
        <Navbar />
      </div>
      <div className="content">
        <Outlet />
      </div>
      <SiteFooter />
      <SupportChatWidget />
    </div>
  );
}

function Layout() {
  return <Shell />;
}

function RequireAuth() {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) return <Navigate to="/login" />;
  return <Shell />;
}

export { Layout, RequireAuth };
