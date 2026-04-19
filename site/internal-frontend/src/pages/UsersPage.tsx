import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteUser, getUsers, updateUser } from "../api/users";
import { getErrorMessage } from "../api/error";
import { getOrganizationReferences } from "../api/organizations";
import ErrorMessage from "../components/ErrorMessage";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { OrganizationReference, StaffUser, UserRole } from "../types";

const USER_ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "ROLE_ADMIN", label: "Admin" },
  { value: "ROLE_REALTOR", label: "Realtor" },
  { value: "ROLE_BANK_EMPLOYEE", label: "Bank employee" },
  { value: "ROLE_MARKETPLACE_USER", label: "Marketplace user" }
];
const PAGE_SIZE = 20;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { showSuccess } = useToast();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationReference[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    phone: "",
    avatar: "",
    role: "ROLE_REALTOR" as UserRole,
    organizationId: 0,
    enabled: true
  });
  const [error, setError] = useState<string | null>(null);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [enabledFilter, setEnabledFilter] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");
  const [organizationFilter, setOrganizationFilter] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const selectedUser = useMemo(
    () => users.find((candidate) => candidate.id === selectedUserId) ?? null,
    [selectedUserId, users]
  );

  const loadReferences = useCallback(async () => {
    setLoadingReferences(true);
    try {
      setOrganizations(await getOrganizationReferences());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingReferences(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError(null);
    try {
      const usersPage = await getUsers({
        page,
        size: PAGE_SIZE,
        role: roleFilter === "ALL" ? undefined : roleFilter,
        enabled: enabledFilter === "ALL" ? undefined : enabledFilter === "ENABLED",
        query: searchValue || undefined,
        organizationId: organizationFilter || undefined,
      });
      setUsers(usersPage.content);
      setTotalPages(usersPage.totalPages);
      setTotalElements(usersPage.totalElements);
      setSelectedUserId((current) => {
        if (current && usersPage.content.some((user) => user.id === current)) {
          return current;
        }
        return usersPage.content[0]?.id ?? null;
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingUsers(false);
    }
  }, [enabledFilter, organizationFilter, page, roleFilter, searchValue]);

  useEffect(() => {
    void loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    setForm({
      fullName: selectedUser.fullName ?? "",
      username: selectedUser.username ?? "",
      phone: selectedUser.phone ?? "",
      avatar: selectedUser.avatar ?? "",
      role: selectedUser.role,
      organizationId: selectedUser.organizationId ?? 0,
      enabled: selectedUser.enabled
    });
  }, [selectedUser]);

  const requiresOrganization = form.role === "ROLE_REALTOR" || form.role === "ROLE_BANK_EMPLOYEE";

  const handleSave = async () => {
    if (!selectedUser) {
      return;
    }

    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!form.username.trim()) {
      setError("Username is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await updateUser(selectedUser.id, {
        fullName: form.fullName,
        username: form.username || undefined,
        phone: form.phone || undefined,
        avatar: form.avatar || undefined,
        role: form.role,
        organizationId: requiresOrganization ? form.organizationId : undefined,
        enabled: form.enabled
      });
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
      showSuccess("User updated");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await deleteUser(selectedUser.id);
      showSuccess("User deleted");
      if (users.length === 1 && page > 0) {
        setPage((current) => Math.max(0, current - 1));
      } else {
        void loadUsers();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loadingReferences || (loadingUsers && !users.length)) {
    return <Loader text="Loading users..." />;
  }

  const hasPreviousPage = page > 0;
  const hasNextPage = page + 1 < totalPages;

  return (
    <div className="page-grid wide-grid">
      <section className="panel">
        <div className="panel-title">
          <h2>Users</h2>
          <div className="table-actions">
            <label className="inline-field">
              Role
              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value as UserRole | "ALL");
                  setPage(0);
                }}
              >
                <option value="ALL">ALL</option>
                {USER_ROLE_OPTIONS.map((roleOption) => (
                  <option key={roleOption.value} value={roleOption.value}>
                    {roleOption.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-field">
              Status
              <select
                value={enabledFilter}
                onChange={(event) => {
                  setEnabledFilter(event.target.value as "ALL" | "ENABLED" | "DISABLED");
                  setPage(0);
                }}
              >
                <option value="ALL">ALL</option>
                <option value="ENABLED">Enabled</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </label>
            <label className="inline-field">
              Organization
              <select
                value={organizationFilter}
                onChange={(event) => {
                  setOrganizationFilter(Number(event.target.value));
                  setPage(0);
                }}
              >
                <option value={0}>ALL</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-field">
              Search
              <input
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                  setPage(0);
                }}
                placeholder="Name, email, organization..."
              />
            </label>
            <button type="button" className="ghost-btn" onClick={() => void loadUsers()}>
              Refresh
            </button>
          </div>
        </div>
        <ErrorMessage message={error} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Organization</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={selectedUserId === user.id ? "is-selected-row" : undefined}
                  onClick={() => setSelectedUserId(user.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <strong>{user.fullName}</strong>
                    <div className="muted">{user.email}</div>
                  </td>
                  <td>{user.role}</td>
                  <td>{user.organizationName ?? "No organization"}</td>
                  <td>{user.enabled ? "Enabled" : "Disabled"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-controls">
          <button type="button" className="ghost-btn" disabled={!hasPreviousPage || loadingUsers} onClick={() => setPage((current) => Math.max(0, current - 1))}>
            Previous
          </button>
          <span className="muted">
            Page {totalPages === 0 ? 0 : page + 1} / {Math.max(totalPages, 1)} · {totalElements} total
          </span>
          <button type="button" className="ghost-btn" disabled={!hasNextPage || loadingUsers} onClick={() => setPage((current) => current + 1)}>
            Next
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>User Detail</h2>
          {selectedUser && <span className="muted">ID #{selectedUser.id}</span>}
        </div>
        {!selectedUser ? (
          <p className="muted">Select a user to edit.</p>
        ) : (
          <div className="form-grid">
            <label>
              Full name
              <input value={form.fullName} onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))} />
            </label>
            <label>
              Username
              <input value={form.username} onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))} />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} />
            </label>
            <label>
              Avatar URL
              <input value={form.avatar} onChange={(e) => setForm((current) => ({ ...current, avatar: e.target.value }))} />
            </label>
            <label>
              Role
              <select value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value as UserRole }))}>
                {USER_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Organization
              <select
                value={form.organizationId}
                onChange={(e) => setForm((current) => ({ ...current, organizationId: Number(e.target.value) }))}
                disabled={!requiresOrganization}
              >
                {!requiresOrganization && <option value={0}>Not required</option>}
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((current) => ({ ...current, enabled: e.target.checked }))}
              />
              Enabled
            </label>

            <div className="panel-actions">
              <button type="button" onClick={() => void handleSave()} disabled={saving || (requiresOrganization && !form.organizationId)}>
                {saving ? "Saving..." : "Save user"}
              </button>
              <button
                type="button"
                className="ghost-btn danger-btn"
                disabled={saving || selectedUser.id === currentUser?.id}
                onClick={() => void handleDelete()}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
