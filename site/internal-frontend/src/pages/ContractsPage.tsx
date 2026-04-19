import { useCallback, useEffect, useMemo, useState } from "react";
import { createContract, getContracts, updateContractStatus } from "../api/contracts";
import { getErrorMessage } from "../api/error";
import { getOrganizationReferences } from "../api/organizations";
import { getProperties } from "../api/properties";
import ErrorMessage from "../components/ErrorMessage";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDateTime, formatMoney } from "../lib/format";
import type { Contract, ContractStatus, ContractType, OrganizationReference, Property } from "../types";

const CONTRACT_STATUSES: ContractStatus[] = ["DRAFT", "SIGNED", "COMPLETED", "CANCELLED"];
const PAGE_SIZE = 20;

export default function ContractsPage() {
  const { hasRole } = useAuth();
  const { showSuccess } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationReference[]>([]);
  const [statusDrafts, setStatusDrafts] = useState<Record<number, ContractStatus>>({});
  const [form, setForm] = useState({
    propertyId: 0,
    buyerOrganizationId: 0,
    type: "SALE" as ContractType,
    price: "0"
  });
  const [error, setError] = useState<string | null>(null);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<ContractType | "ALL">("ALL");
  const [searchValue, setSearchValue] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const isAdmin = hasRole("ADMIN");

  const loadReferences = useCallback(async () => {
    setLoadingReferences(true);
    setError(null);

    try {
      const [propertiesPage, organizationRefs] = await Promise.all([
        getProperties(0, 200),
        getOrganizationReferences()
      ]);
      setProperties(propertiesPage.content);
      setOrganizations(organizationRefs);
      setForm((current) => ({
        ...current,
        propertyId: current.propertyId || propertiesPage.content[0]?.id || 0,
        buyerOrganizationId: current.buyerOrganizationId || organizationRefs[0]?.id || 0
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingReferences(false);
    }
  }, []);

  const loadContracts = useCallback(async () => {
    setLoadingContracts(true);
    setError(null);

    try {
      const contractsPage = await getContracts({
        page,
        size: PAGE_SIZE,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        type: typeFilter === "ALL" ? undefined : typeFilter,
        query: searchValue || undefined,
        organizationId: isAdmin ? organizationFilter || undefined : undefined,
      });
      setContracts(contractsPage.content);
      setStatusDrafts(Object.fromEntries(contractsPage.content.map((contract) => [contract.id, contract.status])));
      setTotalPages(contractsPage.totalPages);
      setTotalElements(contractsPage.totalElements);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingContracts(false);
    }
  }, [isAdmin, organizationFilter, page, searchValue, statusFilter, typeFilter]);

  useEffect(() => {
    void loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === form.propertyId) ?? null,
    [form.propertyId, properties]
  );

  const buyerOrganizations = useMemo(() => {
    const sellerOrganizationId = selectedProperty?.organizationId;
    return organizations.filter((organization) => organization.id !== sellerOrganizationId);
  }, [organizations, selectedProperty?.organizationId]);

  useEffect(() => {
    if (!buyerOrganizations.length) {
      return;
    }

    if (!buyerOrganizations.some((organization) => organization.id === form.buyerOrganizationId)) {
      setForm((current) => ({
        ...current,
        buyerOrganizationId: buyerOrganizations[0].id
      }));
    }
  }, [buyerOrganizations, form.buyerOrganizationId]);

  const handleCreate = async () => {
    if (!selectedProperty?.organizationId || !form.buyerOrganizationId || !form.price) {
      return;
    }

    try {
      setSavingId(-1);
      setError(null);
      await createContract({
        propertyId: form.propertyId,
        sellerOrganizationId: selectedProperty.organizationId,
        buyerOrganizationId: form.buyerOrganizationId,
        type: form.type,
        price: Number(form.price)
      });
      showSuccess("Contract created");
      if (page !== 0) {
        setPage(0);
      } else {
        void loadContracts();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const handleStatusSave = async (contractId: number) => {
    try {
      setSavingId(contractId);
      setError(null);
      const updated = await updateContractStatus(contractId, statusDrafts[contractId]);
      setContracts((current) => current.map((contract) => (contract.id === updated.id ? updated : contract)));
      showSuccess(`Contract #${contractId} updated`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  if (loadingReferences || (loadingContracts && !contracts.length)) {
    return <Loader text="Loading contracts..." />;
  }

  const hasPreviousPage = page > 0;
  const hasNextPage = page + 1 < totalPages;

  return (
    <div className="page-grid wide-grid">
      <section className="panel">
        <div className="panel-title">
          <h2>Create Contract</h2>
        </div>
        <div className="form-grid">
          <label>
            Property
            <select
              value={form.propertyId}
              onChange={(e) => setForm((current) => ({ ...current, propertyId: Number(e.target.value) }))}
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  #{property.id} - {property.address}
                </option>
              ))}
            </select>
          </label>
          <label>
            Seller organization
            <input value={selectedProperty?.organizationName ?? "Select property"} disabled />
          </label>
          <label>
            Buyer organization
            <select
              value={form.buyerOrganizationId}
              onChange={(e) => setForm((current) => ({ ...current, buyerOrganizationId: Number(e.target.value) }))}
            >
              {buyerOrganizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Contract type
            <select value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value as ContractType }))}>
              <option value="SALE">Sale</option>
              <option value="RENT">Rent</option>
            </select>
          </label>
          <label>
            Price
            <input value={form.price} onChange={(e) => setForm((current) => ({ ...current, price: e.target.value }))} type="number" min="1" />
          </label>
          <button type="button" onClick={() => void handleCreate()} disabled={savingId === -1 || !selectedProperty?.organizationId}>
            {savingId === -1 ? "Creating..." : "Create contract"}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Contracts</h2>
          <div className="table-actions">
            <label className="inline-field">
              Status
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as ContractStatus | "ALL");
                  setPage(0);
                }}
              >
                <option value="ALL">ALL</option>
                {CONTRACT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-field">
              Type
              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value as ContractType | "ALL");
                  setPage(0);
                }}
              >
                <option value="ALL">ALL</option>
                <option value="SALE">SALE</option>
                <option value="RENT">RENT</option>
              </select>
            </label>
            {isAdmin && (
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
            )}
            <label className="inline-field">
              Search
              <input
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                  setPage(0);
                }}
                placeholder="ID, property, organizations..."
              />
            </label>
            <button type="button" className="ghost-btn" onClick={() => void loadContracts()}>
              Refresh
            </button>
          </div>
        </div>

        <ErrorMessage message={error} />

        {contracts.length === 0 ? (
          <p className="muted">No contracts found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Property</th>
                  <th>Seller</th>
                  <th>Buyer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>#{contract.id}</td>
                    <td>{contract.propertyAddress}</td>
                    <td>{contract.sellerOrganizationName}</td>
                    <td>{contract.buyerOrganizationName}</td>
                    <td>{contract.type}</td>
                    <td>
                      <select
                        value={statusDrafts[contract.id] ?? contract.status}
                        onChange={(e) =>
                          setStatusDrafts((current) => ({
                            ...current,
                            [contract.id]: e.target.value as ContractStatus
                          }))
                        }
                      >
                        {CONTRACT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{formatMoney(contract.price)}</td>
                    <td>{formatDateTime(contract.updatedAt ?? contract.createdAt)}</td>
                    <td>
                      <button type="button" className="ghost-btn" onClick={() => void handleStatusSave(contract.id)}>
                        {savingId === contract.id ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination-controls">
          <button type="button" className="ghost-btn" disabled={!hasPreviousPage || loadingContracts} onClick={() => setPage((current) => Math.max(0, current - 1))}>
            Previous
          </button>
          <span className="muted">
            Page {totalPages === 0 ? 0 : page + 1} / {Math.max(totalPages, 1)} · {totalElements} total
          </span>
          <button type="button" className="ghost-btn" disabled={!hasNextPage || loadingContracts} onClick={() => setPage((current) => current + 1)}>
            Next
          </button>
        </div>

        <div className="audit-timeline">
          <h4>Contract lifecycle hints</h4>
          <ol>
            <li>DRAFT: document is prepared and shared between organizations.</li>
            <li>SIGNED: both parties accepted and contract became executable.</li>
            <li>COMPLETED or CANCELLED: terminal state with immutable financial history.</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
