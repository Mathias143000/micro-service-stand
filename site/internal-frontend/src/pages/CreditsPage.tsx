import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createCreditForDeal, listCredits, updateCreditStatus, type CreditApplication, type CreditStatus } from "../api/credits";
import { listDealReferences, type DealReference } from "../api/deals";
import { getErrorMessage } from "../api/error";
import { getOrganizationReferences } from "../api/organizations";
import ErrorMessage from "../components/ErrorMessage";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDateTime, formatMoney } from "../lib/format";
import type { OrganizationReference } from "../types";

const CREDIT_STATUSES: CreditStatus[] = ["CREATED", "APPROVED", "REJECTED", "ISSUED"];

export default function CreditsPage() {
  const { hasRole, user } = useAuth();
  const { showSuccess } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [credits, setCredits] = useState<CreditApplication[]>([]);
  const [deals, setDeals] = useState<DealReference[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDealId, setCreateDealId] = useState(0);
  const [amount, setAmount] = useState("1500000");
  const [bankOrganizationId, setBankOrganizationId] = useState(0);
  const [statusDrafts, setStatusDrafts] = useState<Record<number, CreditStatus>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const isAdmin = hasRole("ADMIN");
  const dealFilter = Number(searchParams.get("dealId") ?? "") || 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const requests = [listCredits(0, 100, dealFilter || undefined), listDealReferences()] as const;
      const [creditsPage, dealRefs] = await Promise.all(requests);
      setCredits(creditsPage.content);
      setDeals(dealRefs);
      setStatusDrafts(Object.fromEntries(creditsPage.content.map((credit) => [credit.id, credit.status])));
      setCommentDrafts(Object.fromEntries(creditsPage.content.map((credit) => [credit.id, credit.bankComment ?? ""])));

      if (isAdmin) {
        const organizationRefs = await getOrganizationReferences();
        setOrganizations(organizationRefs);
        if (!bankOrganizationId) {
          setBankOrganizationId(organizationRefs[0]?.id ?? 0);
        }
      } else {
        setOrganizations([]);
        setBankOrganizationId(user?.organizationId ?? 0);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [bankOrganizationId, dealFilter, isAdmin, user?.organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const availableDealsForCredit = useMemo(() => deals.filter((deal) => !deal.hasCreditApplication), [deals]);

  useEffect(() => {
    if (createDealId) {
      return;
    }

    const defaultDealId = dealFilter || availableDealsForCredit[0]?.id || 0;
    if (defaultDealId) {
      setCreateDealId(defaultDealId);
    }
  }, [availableDealsForCredit, createDealId, dealFilter]);

  const summary = useMemo(
    () => ({
      total: credits.length,
      approved: credits.filter((credit) => credit.status === "APPROVED").length,
      issued: credits.filter((credit) => credit.status === "ISSUED").length,
      rejected: credits.filter((credit) => credit.status === "REJECTED").length
    }),
    [credits]
  );

  const handleCreate = async () => {
    if (!createDealId || !amount || (isAdmin && !bankOrganizationId)) {
      return;
    }

    try {
      setSavingId(-1);
      setError(null);
      await createCreditForDeal(createDealId, amount, isAdmin ? bankOrganizationId : undefined);
      showSuccess("Credit application created");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdate = async (creditId: number) => {
    try {
      setSavingId(creditId);
      setError(null);
      await updateCreditStatus(creditId, statusDrafts[creditId], commentDrafts[creditId]);
      showSuccess(`Credit #${creditId} updated`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const setDealFilter = (nextDealId: number) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextDealId) {
      nextParams.set("dealId", String(nextDealId));
    } else {
      nextParams.delete("dealId");
    }

    setSearchParams(nextParams, { replace: true });
  };

  if (loading) {
    return <Loader text="Loading credits..." />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Credits</h2>
          <p className="muted">Bank workspace for credit applications, scoped to the current bank organization.</p>
        </div>
        <button className="ghost-btn" onClick={() => void load()} type="button">
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Total</span>
          <strong className="stat-value">{summary.total}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Approved</span>
          <strong className="stat-value">{summary.approved}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Issued</span>
          <strong className="stat-value">{summary.issued}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Rejected</span>
          <strong className="stat-value">{summary.rejected}</strong>
        </article>
      </div>

      <ErrorMessage message={error} />

      <div className="page-grid wide-grid">
        <section className="panel">
          <div className="panel-title">
            <h3>Create Credit</h3>
          </div>
          <div className="form-grid">
            {isAdmin ? (
              <label>
                Bank organization
                <select value={bankOrganizationId} onChange={(event) => setBankOrganizationId(Number(event.target.value))}>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                Bank organization
                <input value={user?.organizationName ?? "Assigned by role"} disabled />
              </label>
            )}
            <label>
              Deal
              <select value={createDealId} onChange={(event) => setCreateDealId(Number(event.target.value))}>
                <option value={0}>Select deal</option>
                {availableDealsForCredit.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    #{deal.id} - {deal.propertyAddress}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Amount
              <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="1500000" />
            </label>
            <button type="button" onClick={() => void handleCreate()} disabled={!createDealId || !amount || savingId === -1}>
              {savingId === -1 ? "Creating..." : "Create credit"}
            </button>
          </div>
          <p className="muted">
            {availableDealsForCredit.length === 0
              ? "Every visible deal already has a credit application."
              : "Choose a deal without an attached credit application."}
          </p>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h3>Credit Queue</h3>
            <label className="inline-field">
              Deal filter
              <select value={dealFilter} onChange={(event) => setDealFilter(Number(event.target.value))}>
                <option value={0}>All deals</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    #{deal.id}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {credits.length === 0 ? (
            <p className="muted">No credits found for the selected filter.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Deal</th>
                    <th>Property</th>
                    <th>Buyer</th>
                    <th>Bank</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Comment</th>
                    <th>Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {credits.map((credit) => (
                    <tr key={credit.id}>
                      <td>#{credit.id}</td>
                      <td>#{credit.dealId}</td>
                      <td>{credit.propertyAddress}</td>
                      <td>{credit.buyerOrganizationName}</td>
                      <td>{credit.bankOrganizationName ?? "Unassigned"}</td>
                      <td>{formatMoney(credit.amount)}</td>
                      <td>
                        <select
                          value={statusDrafts[credit.id] ?? credit.status}
                          onChange={(event) =>
                            setStatusDrafts((current) => ({
                              ...current,
                              [credit.id]: event.target.value as CreditStatus
                            }))
                          }
                        >
                          {CREDIT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          value={commentDrafts[credit.id] ?? ""}
                          onChange={(event) =>
                            setCommentDrafts((current) => ({
                              ...current,
                              [credit.id]: event.target.value
                            }))
                          }
                          placeholder="Bank comment"
                        />
                      </td>
                      <td>{formatDateTime(credit.updatedAt ?? credit.createdAt)}</td>
                      <td>
                        <button type="button" className="ghost-btn" onClick={() => void handleUpdate(credit.id)}>
                          {savingId === credit.id ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
