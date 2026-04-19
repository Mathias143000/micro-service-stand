import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getInternalNavCounters } from "../api/dashboard";
import { useAuth } from "../context/AuthContext";

const COUNTER_REFRESH_MS = 30_000;

export default function Layout() {
  const { getDefaultRoute, hasRole, logout, user } = useAuth();
  const navigate = useNavigate();
  const [leadBadge, setLeadBadge] = useState(0);
  const [supportBadge, setSupportBadge] = useState(0);
  const [creditBadge, setCreditBadge] = useState(0);

  const isAdmin = hasRole("ADMIN");
  const canSeeClients = isAdmin || hasRole("REALTOR");
  const canSeeDeals = isAdmin || hasRole("REALTOR");
  const canSeeBankPages = isAdmin || hasRole("BANK_EMPLOYEE");
  const canSeeAnalytics = isAdmin || hasRole("REALTOR");
  const hasOperationsLinks = canSeeClients || canSeeDeals;
  const hasManagementLinks = canSeeBankPages || isAdmin;

  useEffect(() => {
    let cancelled = false;

    const loadCounters = async () => {
      try {
        const counters = await getInternalNavCounters();
        if (!cancelled) {
          setLeadBadge(canSeeClients ? counters.openLeadCount : 0);
          setSupportBadge(canSeeAnalytics ? counters.supportConversationCount : 0);
          setCreditBadge(canSeeBankPages ? counters.pendingCreditCount : 0);
        }
      } catch {
        if (!cancelled) {
          setLeadBadge(0);
          setSupportBadge(0);
          setCreditBadge(0);
        }
      }
    };

    void loadCounters();
    const intervalId = window.setInterval(() => {
      void loadCounters();
    }, COUNTER_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [canSeeAnalytics, canSeeBankPages, canSeeClients, user?.id]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const goToCreateOrganization = () => {
    navigate("/organizations#create", { replace: false });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <span className="brand-kicker">RomanEstate internal</span>
          <h1>Operations Control</h1>
          <div className="muted">
            {user?.fullName ?? "Staff user"}
            {user?.organizationName ? ` · ${user.organizationName}` : ""}
          </div>
        </div>
        <nav className="nav-links">
          {canSeeClients && (
            <NavLink to="/clients" className={({ isActive }) => (isActive ? "active" : "")}>
              Clients
              {leadBadge > 0 && <span className="nav-badge">{leadBadge > 99 ? "99+" : leadBadge}</span>}
            </NavLink>
          )}
          {canSeeDeals && (
            <NavLink to="/deals" className={({ isActive }) => (isActive ? "active" : "")}>Deals</NavLink>
          )}
          {canSeeDeals && (
            <NavLink to="/contracts" className={({ isActive }) => (isActive ? "active" : "")}>Contracts</NavLink>
          )}
          {canSeeDeals && (
            <NavLink to="/properties" className={({ isActive }) => (isActive ? "active" : "")}>Properties</NavLink>
          )}
          {canSeeBankPages && (
            <NavLink to="/credits" className={({ isActive }) => (isActive ? "active" : "")}>
              Credits
              {creditBadge > 0 && <span className="nav-badge">{creditBadge > 99 ? "99+" : creditBadge}</span>}
            </NavLink>
          )}
          {canSeeBankPages && (
            <NavLink to="/payments" className={({ isActive }) => (isActive ? "active" : "")}>Payments</NavLink>
          )}
          {canSeeAnalytics && (
            <NavLink to="/analytics" className={({ isActive }) => (isActive ? "active" : "")}>
              Analytics
              {supportBadge > 0 && <span className="nav-badge">{supportBadge > 99 ? "99+" : supportBadge}</span>}
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/users" className={({ isActive }) => (isActive ? "active" : "")}>Users</NavLink>
          )}
          {isAdmin && (
            <NavLink to="/organizations" className={({ isActive }) => (isActive ? "active" : "")}>Organizations</NavLink>
          )}
          {isAdmin && (
            <NavLink to="/register" className={({ isActive }) => (isActive ? "active" : "")}>Register</NavLink>
          )}
        </nav>
        <div className="header-right">
          {isAdmin && (
            <button type="button" className="ghost-btn" onClick={goToCreateOrganization}>
              Create Organization
            </button>
          )}
          <button type="button" className="ghost-btn" onClick={() => navigate(getDefaultRoute())}>
            Dashboard
          </button>
          <button type="button" className="ghost-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <footer className="app-footer panel">
        <div className="footer-left">
          <h3>RomanEstate Internal</h3>
          <p>
            Secure workspace for deal operations, credit approval, contract tracking and client support.
          </p>
          <small>© {new Date().getFullYear()} RomanEstate. Internal staff system.</small>
        </div>
        <div className="footer-right">
          {hasOperationsLinks && (
            <div className="footer-column">
              <h4>Operations</h4>
              {canSeeClients && <NavLink to="/clients">Clients</NavLink>}
              {canSeeDeals && <NavLink to="/deals">Deals</NavLink>}
              {canSeeDeals && <NavLink to="/contracts">Contracts</NavLink>}
            </div>
          )}
          {hasManagementLinks && (
            <div className="footer-column">
              <h4>Management</h4>
              {canSeeBankPages && <NavLink to="/credits">Credits</NavLink>}
              {canSeeBankPages && <NavLink to="/payments">Payments</NavLink>}
              {isAdmin && <NavLink to="/users">Users</NavLink>}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
