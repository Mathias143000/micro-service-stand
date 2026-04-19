import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getOrganizationReferences } from "../api/organizations";
import { getErrorMessage } from "../api/error";
import type { OrganizationReference, UserRole } from "../types";
import ErrorMessage from "../components/ErrorMessage";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "ROLE_REALTOR", label: "Realtor" },
  { value: "ROLE_BANK_EMPLOYEE", label: "Bank employee" },
  { value: "ROLE_ADMIN", label: "Admin" }
];

export default function RegisterPage() {
  const { isAuthenticated, hasRole, register } = useAuth();
  const { showSuccess } = useToast();

  const [organizations, setOrganizations] = useState<OrganizationReference[]>([]);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("ROLE_REALTOR");
  const [organizationId, setOrganizationId] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);

  const isAdmin = hasRole("ADMIN");
  const keepCurrentSession = isAuthenticated && isAdmin;
  const requiresOrganization = role !== "ROLE_ADMIN";

  useEffect(() => {
    if (!keepCurrentSession) {
      return;
    }

    setLoadingOrganizations(true);
    getOrganizationReferences()
      .then((items) => {
        setOrganizations(items);
        if (items[0] && !organizationId) {
          setOrganizationId(items[0].id);
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoadingOrganizations(false));
  }, [keepCurrentSession, organizationId]);

  if (!keepCurrentSession) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await register(
        {
          fullName,
          username,
          email,
          phone,
          password,
          role,
          organizationId: requiresOrganization ? organizationId : undefined
        },
        true
      );

      showSuccess("User registered");
      setFullName("");
      setUsername("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("ROLE_REALTOR");
      setOrganizationId(organizations[0]?.id ?? 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-title">
          <h2>Register Staff User</h2>
          {loadingOrganizations && <span className="muted">Loading organizations...</span>}
        </div>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Full name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              {roleOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Organization
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(Number(e.target.value))}
              disabled={!requiresOrganization}
              required={requiresOrganization}
            >
              {!requiresOrganization && <option value={0}>Not required for admins</option>}
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={loading || (requiresOrganization && !organizationId)}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        {loading && <Loader text="Creating account..." />}
        <ErrorMessage message={error} />
      </section>

      <section className="panel">
        <h2>Access Model</h2>
        <p className="muted">Admins manage staff users. Realtors work with deals, contracts, properties and analytics.</p>
        <p className="muted">Bank employees work with credits and payments only, inside their assigned organization.</p>
      </section>
    </div>
  );
}
