import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDeal, listDeals, updateDealStatus, type Deal, type DealCreateRequest, type DealStatus, type DealType } from "../api/deals";
import { getOrganizationReferences } from "../api/organizations";
import { getProperties } from "../api/properties";
import type { OrganizationReference, Property } from "../types";
import ErrorMessage from "../components/ErrorMessage";
import Loader from "../components/Loader";
import DealChatPanel from "../components/DealChatPanel";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../lib/format";

const DEAL_STATUSES: DealStatus[] = ["CREATED", "IN_PROGRESS", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"];
const PAGE_SIZE = 20;

export default function DealsPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [organizations, setOrganizations] = useState<OrganizationReference[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [statusFilter, setStatusFilter] = useState<DealStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<DealType | "ALL">("ALL");
  const [dealSearch, setDealSearch] = useState("");

  const [form, setForm] = useState<DealCreateRequest>({
    type: "RENT",
    propertyId: 0,
    buyerOrganizationId: 0,
    creditRequired: false,
    creditAmount: ""
  });

  const canSeeFinance = hasRole("ADMIN");

  const loadReferences = useCallback(async () => {
    setLoadingReferences(true);
    setError(null);
    try {
      const [orgRefs, propsPage] = await Promise.all([
        getOrganizationReferences(),
        getProperties(0, 200)
      ]);
      setOrganizations(orgRefs);
      setProperties(propsPage.content);
      setForm((prev) => ({
        ...prev,
        propertyId: prev.propertyId || propsPage.content[0]?.id || 0,
        buyerOrganizationId: prev.buyerOrganizationId || orgRefs[0]?.id || 0
      }));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load reference data");
    } finally {
      setLoadingReferences(false);
    }
  }, []);

  const loadDeals = useCallback(async () => {
    setLoadingDeals(true);
    setError(null);
    try {
      const dealsPage = await listDeals({
        page,
        size: PAGE_SIZE,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        type: typeFilter === "ALL" ? undefined : typeFilter,
        query: dealSearch || undefined,
      });
      setDeals(dealsPage.content);
      setTotalPages(dealsPage.totalPages);
      setTotalElements(dealsPage.totalElements);
      if (selectedDeal) {
        const nextSelected = dealsPage.content.find((deal) => deal.id === selectedDeal.id) ?? null;
        setSelectedDeal(nextSelected);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load deals");
    } finally {
      setLoadingDeals(false);
    }
  }, [dealSearch, page, selectedDeal, statusFilter, typeFilter]);

  useEffect(() => {
    void loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

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
      setForm((prev) => ({
        ...prev,
        buyerOrganizationId: buyerOrganizations[0].id
      }));
    }
  }, [buyerOrganizations, form.buyerOrganizationId]);

  const canSubmit = useMemo(() => {
    if (!form.propertyId || !form.buyerOrganizationId) {
      return false;
    }

    if (form.creditRequired && !form.creditAmount) {
      return false;
    }

    return true;
  }, [form]);

  const handleCreate = async () => {
    setError(null);

    if (form.creditRequired) {
      const nextCreditAmount = Number(form.creditAmount);
      if (!Number.isFinite(nextCreditAmount) || nextCreditAmount <= 0) {
        setError("Credit amount must be a positive number.");
        return;
      }
    }

    try {
      const payload: DealCreateRequest = {
        ...form,
        creditAmount: form.creditRequired ? form.creditAmount || null : null
      };
      const created = await createDeal(payload);
      setSelectedDeal(created);
      if (page !== 0) {
        setPage(0);
      } else {
        void loadDeals();
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to create deal");
    }
  };

  const handleDealStatus = async (id: number, status: DealStatus) => {
    setError(null);
    try {
      await updateDealStatus(id, status);
      setDeals((current) => current.map((deal) => (deal.id === id ? { ...deal, status } : deal)));
      if (selectedDeal?.id === id) {
        setSelectedDeal((current) => (current ? { ...current, status } : current));
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to update status");
    }
  };

  if (loadingReferences || (loadingDeals && !deals.length)) {
    return <Loader text="Loading deals..." />;
  }

  const hasPreviousPage = page > 0;
  const hasNextPage = page + 1 < totalPages;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Deals</h2>
          <p className="muted">Coordinate buyer and seller organizations, keep status moving, and open chat when negotiation starts.</p>
        </div>
        <button
          className="ghost-btn"
          onClick={() => {
            void loadReferences();
            void loadDeals();
          }}
          type="button"
        >
          Refresh
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="page-grid wide-grid">
        <section className="panel">
          <div className="panel-title">
            <h3>Create Deal</h3>
          </div>
          <div className="form-grid">
            <label>
              Type
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as DealType }))}>
                <option value="RENT">Rent</option>
                <option value="SALE">Sale</option>
              </select>
            </label>

            <label>
              Property
              <select value={form.propertyId} onChange={(e) => setForm((p) => ({ ...p, propertyId: Number(e.target.value) }))}>
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
                onChange={(e) => setForm((p) => ({ ...p, buyerOrganizationId: Number(e.target.value) }))}
              >
                {buyerOrganizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.creditRequired}
                onChange={(e) => setForm((p) => ({ ...p, creditRequired: e.target.checked }))}
              />
              Credit required
            </label>

            {form.creditRequired && (
              <label>
                Credit amount
                <input
                  placeholder="1500000"
                  value={form.creditAmount ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, creditAmount: e.target.value }))}
                />
              </label>
            )}
          </div>

          <button className="primary-btn" type="button" disabled={!canSubmit} onClick={() => void handleCreate()}>
            Create deal
          </button>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h3>Pipeline</h3>
            <div className="table-actions">
              <label className="inline-field">
                Status
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as DealStatus | "ALL");
                    setPage(0);
                  }}
                >
                  <option value="ALL">All</option>
                  {DEAL_STATUSES.map((status) => (
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
                  onChange={(e) => {
                    setTypeFilter(e.target.value as DealType | "ALL");
                    setPage(0);
                  }}
                >
                  <option value="ALL">All</option>
                  <option value="SALE">Sale</option>
                  <option value="RENT">Rent</option>
                </select>
              </label>
              <label className="inline-field">
                Search
                <input
                  value={dealSearch}
                  onChange={(event) => {
                    setDealSearch(event.target.value);
                    setPage(0);
                  }}
                  placeholder="Deal ID, property, buyer..."
                />
              </label>
            </div>
          </div>

          {deals.length === 0 ? (
            <p className="muted">No deals match the current filters.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Property</th>
                    <th>Buyer</th>
                    <th>Credit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => (
                    <tr
                      key={deal.id}
                      onClick={() => setSelectedDeal(deal)}
                      className={selectedDeal?.id === deal.id ? "is-selected-row" : undefined}
                      style={{ cursor: "pointer" }}
                    >
                      <td>#{deal.id}</td>
                      <td>{deal.type}</td>
                      <td>
                        <select value={deal.status} onChange={(e) => void handleDealStatus(deal.id, e.target.value as DealStatus)}>
                          {DEAL_STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td>{deal.property?.address ? deal.property.address : deal.property?.id ?? "-"}</td>
                      <td>{deal.buyerOrganization?.name ?? deal.buyerOrganization?.id ?? "-"}</td>
                      <td>
                        {deal.creditApplication ? (
                          <div>
                            <div><b>{deal.creditApplication.status}</b> ({formatMoney(deal.creditApplication.amount)})</div>
                            {deal.creditApplication.bankComment && <div className="muted">{deal.creditApplication.bankComment}</div>}
                          </div>
                        ) : (
                          <span className="muted">No credit</span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="ghost-btn" type="button" onClick={() => setSelectedDeal(deal)}>
                            Open chat
                          </button>
                          {canSeeFinance && (
                            <button className="ghost-btn" type="button" onClick={() => navigate(`/credits?dealId=${deal.id}`)}>
                              Credits
                            </button>
                          )}
                          {canSeeFinance && (
                            <button className="ghost-btn" type="button" onClick={() => navigate(`/payments?dealId=${deal.id}`)}>
                              Payments
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pagination-controls">
            <button type="button" className="ghost-btn" disabled={!hasPreviousPage || loadingDeals} onClick={() => setPage((current) => Math.max(0, current - 1))}>
              Previous
            </button>
            <span className="muted">
              Page {totalPages === 0 ? 0 : page + 1} / {Math.max(totalPages, 1)} · {totalElements} total
            </span>
            <button type="button" className="ghost-btn" disabled={!hasNextPage || loadingDeals} onClick={() => setPage((current) => current + 1)}>
              Next
            </button>
          </div>
        </section>
      </div>

      <DealChatPanel deal={selectedDeal} />
      {selectedDeal && (
        <section className="panel">
          <div className="panel-title">
            <h3>Deal audit timeline</h3>
          </div>
          <div className="audit-timeline">
            <ol>
              <li>Deal created: {selectedDeal.createdAt ? new Date(selectedDeal.createdAt).toLocaleString() : "N/A"}</li>
              <li>Current status: {selectedDeal.status}</li>
              <li>Type: {selectedDeal.type}</li>
              <li>Credit: {selectedDeal.creditApplication ? selectedDeal.creditApplication.status : "No credit application"}</li>
            </ol>
          </div>
        </section>
      )}
    </div>
  );
}
