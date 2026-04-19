import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/error";
import ErrorMessage from "../components/ErrorMessage";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { getDefaultRoute, isAuthenticated, isResolvingSession, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isResolvingSession) {
    return <Loader text="Loading session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultRoute()} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await login(identifier, password);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || getDefaultRoute();
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="centered-page">
      <section className="panel login-panel">
        <div className="panel-title">
          <div>
            <div className="brand-kicker">Internal access</div>
            <h1>Sign In</h1>
            <p className="muted">Admin, realtor and bank employees use this console to operate the platform.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Email or username
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        <div className="client-detail-card">
          <strong>Demo roles</strong>
          <p className="muted">admin@example.com, realtor@example.com, bank@example.com</p>
        </div>
        {loading && <Loader text="Signing in..." />}
        <ErrorMessage message={error} />
      </section>
    </div>
  );
}
