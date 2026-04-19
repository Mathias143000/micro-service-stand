import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import SafeImage from "../safeImage/SafeImage";
import { useLanguage } from "../../context/LanguageContext";
import "./SupportChatWidget.scss";

function SupportChatWidget() {
  const { currentUser } = useContext(AuthContext);
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [lastSeenMessageId, setLastSeenMessageId] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!open || !currentUser) {
      return;
    }

    const loadConversation = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiRequest.get("/api/support-chat");
        setConversation(response.data);
        const latestMessageId = response.data?.messages?.at(-1)?.id || 0;
        setLastSeenMessageId((previous) => Math.max(previous, latestMessageId));
      } catch (requestError) {
        setError(requestError.response?.data?.message || t("support.loadError"));
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [currentUser, language, open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, open]);

  useEffect(() => {
    if (!currentUser) {
      setConversation(null);
      setText("");
      setLastSeenMessageId(0);
    }
  }, [currentUser]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!text.trim()) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await apiRequest.post("/api/support-chat/messages", {
        text,
      });
      setConversation(response.data);
      const latestMessageId = response.data?.messages?.at(-1)?.id || 0;
      setLastSeenMessageId((previous) => Math.max(previous, latestMessageId));
      setText("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("support.sendError"));
    } finally {
      setSending(false);
    }
  };

  const assignedRealtor = conversation?.assignedRealtor;
  const messages = conversation?.messages || [];
  const unreadCount = messages.filter((message) => !message.mine && (message.id || 0) > lastSeenMessageId).length;

  useEffect(() => {
    if (!open || !messages.length) {
      return;
    }
    const latestMessageId = messages.at(-1)?.id || 0;
    setLastSeenMessageId((previous) => Math.max(previous, latestMessageId));
  }, [messages, open]);

  const formatMessageTime = (value) => {
    if (!value) {
      return "";
    }

    try {
      return new Date(value).toLocaleString(language === "ru" ? "ru-RU" : "en-US", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  return (
    <div className={`supportChatWidget${open ? " open" : ""}`}>
      {open && (
        <div className="panel">
          <div className="panelHeader">
            <div className="agentSummary">
              <SafeImage
                src={assignedRealtor?.avatar}
                fallback="/noavatar.jpg"
                alt={assignedRealtor?.username || "RomanEstate"}
              />
              <div>
                <strong>{assignedRealtor?.username || t("support.title")}</strong>
                <span>{t("support.subtitle")}</span>
              </div>
            </div>
            <button type="button" className="ghostClose" onClick={() => setOpen(false)}>
              {t("support.close")}
            </button>
          </div>

          {!currentUser ? (
            <div className="guestState">
              <h3>{t("support.guestTitle")}</h3>
              <p>{t("support.guestDescription")}</p>
              <Link to="/login" className="ctaLink" onClick={() => setOpen(false)}>
                {t("support.openLogin")}
              </Link>
            </div>
          ) : (
            <>
              <div className="messages">
                {loading && (<div className="chatSkeleton" aria-label={t("support.loading")}>{Array.from({ length: 3 }).map((_, index) => <span key={`skeleton-${index}`} />)}</div>)}
                {!loading && messages.length === 0 && (
                  <p className="stateText">{t("support.empty")}</p>
                )}
                {!loading &&
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`messageBubble${message.mine ? " mine" : ""}`}
                    >
                      <div className="meta">
                        <span>{message.senderLabel}</span>
                        <time>{formatMessageTime(message.sentAt)}</time>
                      </div>
                      <p>{message.text}</p>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="composer" onSubmit={handleSend}>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={t("support.placeholder")}
                  rows={3}
                />
                <div className="composerActions">
                  {error && <span className="errorText">{error}</span>}
                  <button type="submit" disabled={sending || !text.trim()}>
                    {sending ? t("support.sending") : t("support.send")}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        className="launcher"
        onClick={() => setOpen((previous) => !previous)}
        aria-label={open ? t("support.closeAria") : t("support.openAria")}
      >
        <span>{open ? t("support.launcherOpen") : t("support.launcherClosed")}</span>
        {!open && unreadCount > 0 && (
          <b className="unreadBadge">{unreadCount > 9 ? "9+" : unreadCount}</b>
        )}
      </button>
    </div>
  );
}

export default SupportChatWidget;

