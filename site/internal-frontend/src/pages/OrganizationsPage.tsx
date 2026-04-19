import { FormEvent, useCallback, useEffect, useState } from "react";
import { createOrganization, getOrganizations } from "../api/organizations";
import { getErrorMessage } from "../api/error";
import ErrorMessage from "../components/ErrorMessage";
import Loader from "../components/Loader";
import { useToast } from "../context/ToastContext";
import type { Organization } from "../types";

export default function OrganizationsPage() {
  const { showSuccess } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadOrganizations = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const page = await getOrganizations();
      setOrganizations(page.content);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      setCreating(true);
      const created = await createOrganization({ name });
      setOrganizations((current) => [created, ...current]);
      setName("");
      showSuccess("Organization created");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-grid">
      <section className="panel" id="create">
        <h2>Create Organization</h2>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} type="text" required />
          </label>
          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
        {creating && <Loader text="Creating organization..." />}
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Organizations</h2>
          <button type="button" className="ghost-btn" onClick={() => void loadOrganizations()}>
            Refresh
          </button>
        </div>

        <ErrorMessage message={error} />

        {loading ? (
          <Loader text="Loading organizations..." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((organization) => (
                  <tr key={organization.id}>
                    <td>{organization.id}</td>
                    <td>{organization.name}</td>
                    <td>{new Date(organization.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {organizations.length === 0 && (
                  <tr>
                    <td colSpan={3}>No organizations found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
