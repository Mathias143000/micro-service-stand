import { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../api/error";
import { listMarketplaceDealsPage, updateMarketplaceDealStatus } from "../api/marketplaceDeals";
import { getSupportConversation, listSupportConversationsPage, sendSupportConversationMessage } from "../api/support";
import ErrorMessage from "../components/ErrorMessage";
import Loader from "../components/Loader";
import { useToast } from "../context/ToastContext";
import { formatDateTime, formatMoney } from "../lib/format";
import type {
  MarketplaceDealStatus,
  MarketplaceLead,
  SupportConversationDetail,
  SupportConversationSummary,
} from "../types";

const MARKETPLACE_STATUSES: MarketplaceDealStatus[] = [
  "REQUESTED",
  "IN_REVIEW",
  "VIEWING",
  "NEGOTIATION",
  "APPROVED",
  "DECLINED",
  "CLOSED",
];
const OPEN_MARKETPLACE_STATUSES: MarketplaceDealStatus[] = ["REQUESTED", "IN_REVIEW", "VIEWING", "NEGOTIATION"];
const PAGE_SIZE = 20;

function matchConversationForLead(
  lead: MarketplaceLead | null,
  conversations: SupportConversationSummary[],
): number | null {
  if (!lead?.customer?.id) {
    return null;
  }

  return conversations.find((conversation) => conversation.customer?.id === lead.customer?.id)?.conversationId ?? null;
}

export default function ClientsPage() {
  const { showSuccess } = useToast();
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);
  const [conversations, setConversations] = useState<SupportConversationSummary[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<SupportConversationDetail | null>(null);
  const [savingLeadId, setSavingLeadId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState<MarketplaceDealStatus | "ALL">("ALL");
  const [sending, setSending] = useState(false);
  const [leadPage, setLeadPage] = useState(0);
  const [leadTotalPages, setLeadTotalPages] = useState(0);
  const [leadTotalElements, setLeadTotalElements] = useState(0);
  const [conversationSearch, setConversationSearch] = useState("");
  const [conversationPage, setConversationPage] = useState(0);
  const [conversationTotalPages, setConversationTotalPages] = useState(0);
  const [conversationTotalElements, setConversationTotalElements] = useState(0);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  );

  const summary = useMemo(
    () => ({
      totalLeads: leadTotalElements,
      openLeadsOnPage: leads.filter((lead) => OPEN_MARKETPLACE_STATUSES.includes(lead.status)).length,
      supportThreads: conversationTotalElements,
    }),
    [conversationTotalElements, leadTotalElements, leads],
  );

  const loadLeads = useCallback(async () => {
    setLoadingLeads(true);
    setError(null);

    try {
      const leadsPage = await listMarketplaceDealsPage({
        page: leadPage,
        size: PAGE_SIZE,
        status: leadStatusFilter === "ALL" ? undefined : leadStatusFilter,
        query: leadSearch || undefined,
      });
      setLeads(leadsPage.content);
      setLeadTotalPages(leadsPage.totalPages);
      setLeadTotalElements(leadsPage.totalElements);
      setSelectedLeadId((current) => {
        if (current && leadsPage.content.some((lead) => lead.id === current)) {
          return current;
        }
        return leadsPage.content[0]?.id ?? null;
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingLeads(false);
    }
  }, [leadPage, leadSearch, leadStatusFilter]);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setError(null);

    try {
      const conversationsPage = await listSupportConversationsPage({
        page: conversationPage,
        size: PAGE_SIZE,
        query: conversationSearch || undefined,
      });
      setConversations(conversationsPage.content);
      setConversationTotalPages(conversationsPage.totalPages);
      setConversationTotalElements(conversationsPage.totalElements);
      setSelectedConversationId((current) => {
        if (current && conversationsPage.content.some((conversation) => conversation.conversationId === current)) {
          return current;
        }
        return conversationsPage.content[0]?.conversationId ?? null;
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingConversations(false);
    }
  }, [conversationPage, conversationSearch]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedConversationId) {
      setSelectedConversation(null);
      return;
    }

    let cancelled = false;
    setError(null);

    getSupportConversation(selectedConversationId)
      .then((conversation) => {
        if (!cancelled) {
          setSelectedConversation(conversation);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedConversationId]);

  const handleLeadStatus = async (leadId: number, status: MarketplaceDealStatus) => {
    try {
      setSavingLeadId(leadId);
      setError(null);
      const updated = await updateMarketplaceDealStatus(leadId, status);
      setLeads((current) => current.map((lead) => (lead.id === leadId ? updated : lead)));
      showSuccess(`Lead #${leadId} updated`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingLeadId(null);
    }
  };

  const handleLeadSelect = (lead: MarketplaceLead) => {
    setSelectedLeadId(lead.id);
    const matchingConversationId = matchConversationForLead(lead, conversations);
    if (matchingConversationId) {
      setSelectedConversationId(matchingConversationId);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversationId || !messageText.trim()) {
      return;
    }

    if (messageText.trim().length < 3) {
      setError("Support reply must contain at least 3 characters.");
      return;
    }

    try {
      setSending(true);
      setError(null);
      const updatedConversation = await sendSupportConversationMessage(selectedConversationId, messageText.trim());
      setSelectedConversation(updatedConversation);
      setMessageText("");
      showSuccess("Reply sent");
      void loadConversations();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if ((loadingLeads && !leads.length) || (loadingConversations && !conversations.length)) {
    return <Loader text="Loading client pipeline..." />;
  }

  const canLeadsPrev = leadPage > 0;
  const canLeadsNext = leadPage + 1 < leadTotalPages;
  const canConversationsPrev = conversationPage > 0;
  const canConversationsNext = conversationPage + 1 < conversationTotalPages;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Clients</h2>
          <p className="muted">Work through marketplace deal requests and answer support chat from one purple ops desk.</p>
        </div>
        <button
          className="ghost-btn"
          type="button"
          onClick={() => {
            void loadLeads();
            void loadConversations();
          }}
        >
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Deal requests</span>
          <strong className="stat-value">{summary.totalLeads}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Open pipeline (page)</span>
          <strong className="stat-value">{summary.openLeadsOnPage}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Support threads</span>
          <strong className="stat-value">{summary.supportThreads}</strong>
        </article>
      </div>

      <ErrorMessage message={error} />

      <div className="page-grid wide-grid">
        <section className="panel">
          <div className="panel-title">
            <h3>Marketplace Deal Requests</h3>
            <div className="table-actions">
              <label className="inline-field">
                Search
                <input
                  value={leadSearch}
                  onChange={(event) => {
                    setLeadSearch(event.target.value);
                    setLeadPage(0);
                  }}
                  placeholder="Customer, email, property..."
                />
              </label>
              <label className="inline-field">
                Status
                <select
                  value={leadStatusFilter}
                  onChange={(event) => {
                    setLeadStatusFilter(event.target.value as MarketplaceDealStatus | "ALL");
                    setLeadPage(0);
                  }}
                >
                  <option value="ALL">ALL</option>
                  {MARKETPLACE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {leads.length === 0 ? (
            <p className="muted">No client deal requests yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Property</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={selectedLeadId === lead.id ? "is-selected-row" : undefined}
                      onClick={() => handleLeadSelect(lead)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>#{lead.id}</td>
                      <td>
                        <strong>{lead.customer?.username ?? "Customer"}</strong>
                        {lead.customer?.mobile_number && <div className="muted">{lead.customer.mobile_number}</div>}
                      </td>
                      <td>
                        <strong>{lead.postTitle ?? lead.postAddress}</strong>
                        <div className="muted">{lead.postAddress}</div>
                      </td>
                      <td>{lead.type === "rent" ? "Rent" : "Sale"}</td>
                      <td>{formatMoney(lead.price)}</td>
                      <td>
                        <select
                          value={lead.status}
                          onChange={(event) => void handleLeadStatus(lead.id, event.target.value as MarketplaceDealStatus)}
                          disabled={savingLeadId === lead.id}
                        >
                          {MARKETPLACE_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{formatDateTime(lead.updatedAt ?? lead.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pagination-controls">
            <button type="button" className="ghost-btn" disabled={!canLeadsPrev || loadingLeads} onClick={() => setLeadPage((current) => Math.max(0, current - 1))}>
              Previous
            </button>
            <span className="muted">
              Page {leadTotalPages === 0 ? 0 : leadPage + 1} / {Math.max(leadTotalPages, 1)} · {leadTotalElements} total
            </span>
            <button type="button" className="ghost-btn" disabled={!canLeadsNext || loadingLeads} onClick={() => setLeadPage((current) => current + 1)}>
              Next
            </button>
          </div>

          {selectedLead && (
            <div className="client-detail-card">
              <div className="panel-title">
                <h3>Selected Lead</h3>
              </div>
              <div className="client-detail-grid">
                <div>
                  <strong>Customer</strong>
                  <p>{selectedLead.customer?.username ?? "Customer"}</p>
                  <span className="muted">{selectedLead.customer?.email ?? "Email hidden"}</span>
                </div>
                <div>
                  <strong>Assigned realtor</strong>
                  <p>{selectedLead.assignedRealtor?.username ?? "Auto-assigned later"}</p>
                </div>
                <div>
                  <strong>Property</strong>
                  <p>{selectedLead.postTitle ?? selectedLead.postAddress}</p>
                </div>
                <div>
                  <strong>Status</strong>
                  <p>{selectedLead.status.replace(/_/g, " ")}</p>
                </div>
              </div>
              {selectedLead.note && (
                <div className="lead-note">
                  <strong>Client note</strong>
                  <p>{selectedLead.note}</p>
                </div>
              )}
              <div className="audit-timeline">
                <h4>Lead timeline</h4>
                <ol>
                  <li>Created: {formatDateTime(selectedLead.createdAt)}</li>
                  <li>Current status: {selectedLead.status.replace(/_/g, " ")}</li>
                  <li>Last update: {formatDateTime(selectedLead.updatedAt ?? selectedLead.createdAt)}</li>
                </ol>
              </div>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-title">
            <h3>Support Inbox</h3>
            <label className="inline-field">
              Search
              <input
                value={conversationSearch}
                onChange={(event) => {
                  setConversationSearch(event.target.value);
                  setConversationPage(0);
                }}
                placeholder="Customer or email..."
              />
            </label>
          </div>

          <div className="support-layout">
            <div className="support-conversations">
              {conversations.length === 0 ? (
                <p className="muted">No support conversations yet.</p>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.conversationId}
                    type="button"
                    className={selectedConversationId === conversation.conversationId ? "conversation-item active" : "conversation-item"}
                    onClick={() => setSelectedConversationId(conversation.conversationId)}
                  >
                    <strong>{conversation.customer?.username ?? "Customer"}</strong>
                    <span>{conversation.lastMessagePreview ?? "No messages yet"}</span>
                    <small>{formatDateTime(conversation.updatedAt)}</small>
                  </button>
                ))
              )}

              <div className="pagination-controls">
                <button type="button" className="ghost-btn" disabled={!canConversationsPrev || loadingConversations} onClick={() => setConversationPage((current) => Math.max(0, current - 1))}>
                  Previous
                </button>
                <span className="muted">
                  {conversationTotalPages === 0 ? 0 : conversationPage + 1} / {Math.max(conversationTotalPages, 1)}
                </span>
                <button type="button" className="ghost-btn" disabled={!canConversationsNext || loadingConversations} onClick={() => setConversationPage((current) => current + 1)}>
                  Next
                </button>
              </div>
            </div>

            <div className="support-thread">
              {!selectedConversation ? (
                <p className="muted">Choose a conversation to open the thread.</p>
              ) : (
                <>
                  <div className="support-thread-header">
                    <div>
                      <strong>{selectedConversation.customer?.username ?? "Customer"}</strong>
                      <div className="muted">{selectedConversation.customer?.email ?? "Marketplace customer"}</div>
                    </div>
                    <div className="muted">
                      Assigned to {selectedConversation.assignedRealtor?.username ?? "RomanEstate"}
                    </div>
                  </div>

                  <div className="chat-shell support-thread-shell">
                    {selectedConversation.messages.length === 0 ? (
                      <p className="muted">No messages in this thread yet.</p>
                    ) : (
                      selectedConversation.messages.map((message) => (
                        <div key={message.id} className={message.mine ? "chat-bubble mine" : "chat-bubble"}>
                          <div className="chat-message-role">{message.senderLabel}</div>
                          <div>{message.text}</div>
                          <div className="chat-message-meta">{formatDateTime(message.sentAt)}</div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="chat-input-row support-reply-row">
                    <input
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      placeholder="Reply to the customer..."
                    />
                    <button type="button" onClick={() => void handleSendMessage()} disabled={sending || !messageText.trim()}>
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
