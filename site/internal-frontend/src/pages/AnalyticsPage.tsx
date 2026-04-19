import { useCallback, useEffect, useState } from "react";
import {
  exportOrganizationAnalyticsDashboard,
  getOrganizationAnalyticsDashboard,
  getRealtorAnalytics
} from "../api/analytics";
import { getErrorMessage } from "../api/error";
import { getOrganizationReferences } from "../api/organizations";
import ErrorMessage from "../components/ErrorMessage";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../lib/format";
import type {
  AnalyticsExportPreset,
  OrganizationAnalyticsDashboardResponse,
  OrganizationReference,
  RealtorAnalyticsResponse
} from "../types";

interface MetricCardProps {
  label: string;
  value: number | string;
  hint: string;
}

const EXPORT_PRESETS: Array<{ value: AnalyticsExportPreset; label: string }> = [
  { value: "EXECUTIVE_SUMMARY", label: "Executive summary" },
  { value: "DEAL_PIPELINE", label: "Deal pipeline" },
  { value: "FINANCE_CONTROL", label: "Finance control" },
];

function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <article className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-hint">{hint}</span>
    </article>
  );
}

export default function AnalyticsPage() {
  const { hasRole, user } = useAuth();
  const isAdmin = hasRole("ADMIN");
  const [analytics, setAnalytics] = useState<RealtorAnalyticsResponse | null>(null);
  const [organizationDashboard, setOrganizationDashboard] = useState<OrganizationAnalyticsDashboardResponse | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationReference[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(0);
  const [exportPreset, setExportPreset] = useState<AnalyticsExportPreset>("EXECUTIVE_SUMMARY");
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let cancelled = false;
    getOrganizationReferences()
      .then((items) => {
        if (cancelled) {
          return;
        }
        setOrganizations(items);
        setSelectedOrganizationId((current) => current || items[0]?.id || 0);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const load = useCallback(async () => {
    if (isAdmin && !selectedOrganizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const organizationId = isAdmin ? selectedOrganizationId : user?.organizationId ?? undefined;
      const [nextAnalytics, nextDashboard] = await Promise.all([
        getRealtorAnalytics(),
        getOrganizationAnalyticsDashboard(organizationId),
      ]);
      setAnalytics(nextAnalytics);
      setOrganizationDashboard(nextDashboard);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedOrganizationId, user?.organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleExport = async () => {
    const organizationId = isAdmin ? selectedOrganizationId : user?.organizationId ?? organizationDashboard?.organizationId;
    if (!organizationId) {
      setError("Select organization before exporting analytics.");
      return;
    }

    try {
      setExporting(true);
      setError(null);
      const blob = await exportOrganizationAnalyticsDashboard(organizationId, exportPreset);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `organization-${organizationId}-${exportPreset.toLowerCase()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading analytics..." />;
  }

  if (!analytics) {
    return (
      <div className="page">
        <ErrorMessage message={error ?? "Analytics is unavailable right now."} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Analytics</h2>
          <p className="muted">Operational snapshot with organization dashboards and export presets.</p>
        </div>
        <button className="ghost-btn" onClick={() => void load()} type="button">
          Refresh
        </button>
      </div>

      <ErrorMessage message={error} />

      <div className="stats-grid analytics-grid">
        <MetricCard label="Deals" value={analytics.totalDeals} hint={`${analytics.activeDeals} active`} />
        <MetricCard label="Properties" value={analytics.totalProperties} hint={`${analytics.availableProperties} available`} />
        <MetricCard label="Contracts" value={analytics.totalContracts} hint={`${analytics.signedContracts} signed`} />
        <MetricCard label="Credits" value={analytics.totalCredits} hint={`${analytics.issuedCredits} issued`} />
        <MetricCard label="Payments" value={analytics.totalPayments} hint={`${analytics.confirmedPayments} confirmed`} />
      </div>

      <section className="panel">
        <div className="panel-title">
          <h3>Organization Dashboard</h3>
          <div className="table-actions">
            {isAdmin && (
              <label className="inline-field">
                Organization
                <select value={selectedOrganizationId} onChange={(event) => setSelectedOrganizationId(Number(event.target.value))}>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="inline-field">
              Export preset
              <select value={exportPreset} onChange={(event) => setExportPreset(event.target.value as AnalyticsExportPreset)}>
                {EXPORT_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="ghost-btn" disabled={exporting} onClick={() => void handleExport()}>
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>

        {!organizationDashboard ? (
          <p className="muted">Organization dashboard is not available for the selected scope.</p>
        ) : (
          <>
            <div className="stats-grid analytics-grid">
              <MetricCard
                label="Deals"
                value={organizationDashboard.totalDeals}
                hint={`${organizationDashboard.activeDeals} active · ${organizationDashboard.completedDeals} completed`}
              />
              <MetricCard
                label="Contracts"
                value={organizationDashboard.totalContracts}
                hint={`${organizationDashboard.signedContracts} signed · ${organizationDashboard.completedContracts} completed`}
              />
              <MetricCard
                label="Credits"
                value={organizationDashboard.totalCredits}
                hint={`${organizationDashboard.createdCredits} created · ${organizationDashboard.issuedCredits} issued`}
              />
              <MetricCard
                label="Payments"
                value={organizationDashboard.totalPayments}
                hint={`${organizationDashboard.confirmedPayments} confirmed · ${organizationDashboard.failedPayments} failed`}
              />
            </div>

            <div className="insights-grid" style={{ marginTop: "0.8rem" }}>
              <div className="insight-card">
                <span className="stat-label">Contract volume</span>
                <strong className="stat-value">{formatMoney(organizationDashboard.contractVolume)}</strong>
                <span className="muted">{organizationDashboard.organizationName}</span>
              </div>
              <div className="insight-card">
                <span className="stat-label">Issued credit volume</span>
                <strong className="stat-value">{formatMoney(organizationDashboard.issuedCreditVolume)}</strong>
                <span className="muted">{organizationDashboard.issuedCredits} issued applications</span>
              </div>
              <div className="insight-card">
                <span className="stat-label">Confirmed payment volume</span>
                <strong className="stat-value">{formatMoney(organizationDashboard.confirmedPaymentVolume)}</strong>
                <span className="muted">{organizationDashboard.confirmedPayments} confirmed payments</span>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
