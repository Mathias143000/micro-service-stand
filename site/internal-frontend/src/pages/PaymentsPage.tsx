import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listDealReferences, type DealReference } from "../api/deals";
import { getErrorMessage } from "../api/error";
import { getOrganizationReferences } from "../api/organizations";
import { createPayment, listPayments, updatePaymentStatus, type PaymentRecord, type PaymentStatus } from "../api/payments";
import ErrorMessage from "../components/ErrorMessage";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDateTime, formatMoney } from "../lib/format";
import type { OrganizationReference } from "../types";

const PAYMENT_STATUSES: PaymentStatus[] = ["CREATED", "CONFIRMED", "FAILED"];

export default function PaymentsPage() {
  const { hasRole, user } = useAuth();
  const { showSuccess } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [deals, setDeals] = useState<DealReference[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDealId, setCreateDealId] = useState(0);
  const [amount, setAmount] = useState("100000");
  const [bankOrganizationId, setBankOrganizationId] = useState(0);
  const [statusDrafts, setStatusDrafts] = useState<Record<number, PaymentStatus>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const isAdmin = hasRole("ADMIN");
  const dealFilter = Number(searchParams.get("dealId") ?? "") || 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [paymentsPage, dealRefs] = await Promise.all([
        listPayments(0, 100, dealFilter || undefined),
        listDealReferences()
      ]);

      setPayments(paymentsPage.content);
      setDeals(dealRefs);
      setStatusDrafts(Object.fromEntries(paymentsPage.content.map((payment) => [payment.id, payment.status])));

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

  useEffect(() => {
    if (createDealId) {
      return;
    }

    const defaultDealId = dealFilter || deals[0]?.id || 0;
    if (defaultDealId) {
      setCreateDealId(defaultDealId);
    }
  }, [createDealId, dealFilter, deals]);

  const summary = useMemo(
    () => ({
      total: payments.length,
      confirmed: payments.filter((payment) => payment.status === "CONFIRMED").length,
      failed: payments.filter((payment) => payment.status === "FAILED").length,
      totalAmount: payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    }),
    [payments]
  );

  const handleCreate = async () => {
    if (!createDealId || !amount || (isAdmin && !bankOrganizationId)) {
      return;
    }

    try {
      setSavingId(-1);
      setError(null);
      await createPayment({
        dealId: createDealId,
        amount,
        bankOrganizationId: isAdmin ? bankOrganizationId : undefined
      });
      showSuccess("Payment created");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdate = async (paymentId: number) => {
    try {
      setSavingId(paymentId);
      setError(null);
      await updatePaymentStatus(paymentId, statusDrafts[paymentId]);
      showSuccess(`Payment #${paymentId} updated`);
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
    return <Loader text="Loading payments..." />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Payments</h2>
          <p className="muted">Track deal payments and confirmations inside the current bank organization scope.</p>
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
          <span className="stat-label">Confirmed</span>
          <strong className="stat-value">{summary.confirmed}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Failed</span>
          <strong className="stat-value">{summary.failed}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Loaded amount</span>
          <strong className="stat-value">{formatMoney(summary.totalAmount)}</strong>
        </article>
      </div>

      <ErrorMessage message={error} />

      <div className="page-grid wide-grid">
        <section className="panel">
          <div className="panel-title">
            <h3>Create Payment</h3>
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
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    #{deal.id} - {deal.propertyAddress}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Amount
              <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="100000" />
            </label>
            <button type="button" onClick={() => void handleCreate()} disabled={!createDealId || !amount || savingId === -1}>
              {savingId === -1 ? "Creating..." : "Create payment"}
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h3>Payments Journal</h3>
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

          {payments.length === 0 ? (
            <p className="muted">No payments found for the selected filter.</p>
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
                    <th>Paid At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>#{payment.id}</td>
                      <td>#{payment.dealId}</td>
                      <td>{payment.propertyAddress}</td>
                      <td>{payment.buyerOrganizationName}</td>
                      <td>{payment.bankOrganizationName ?? "Unassigned"}</td>
                      <td>{formatMoney(payment.amount)}</td>
                      <td>
                        <select
                          value={statusDrafts[payment.id] ?? payment.status}
                          onChange={(event) =>
                            setStatusDrafts((current) => ({
                              ...current,
                              [payment.id]: event.target.value as PaymentStatus
                            }))
                          }
                        >
                          {PAYMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{formatDateTime(payment.paymentDate ?? payment.createdAt)}</td>
                      <td>
                        <button type="button" className="ghost-btn" onClick={() => void handleUpdate(payment.id)}>
                          {savingId === payment.id ? "Saving..." : "Save"}
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
