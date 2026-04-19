import { useEffect, useMemo, useState } from "react";
import type { Deal } from "../api/deals";
import { getErrorMessage } from "../api/error";
import { getOrCreateChatForDeal, listMessages, sendMessage, type Chat, type Message } from "../api/chat";
import ErrorMessage from "./ErrorMessage";

interface Props {
  deal: Deal | null;
}

export default function DealChatPanel({ deal }: Props) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deal) {
      setChat(null);
      setMessages([]);
      return;
    }

    const load = async () => {
      setError(null);
      setLoading(true);
      try {
        const nextChat = await getOrCreateChatForDeal(deal.id);
        setChat(nextChat);
        const nextMessages = await listMessages(nextChat.id);
        setMessages(nextMessages);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [deal]);

  const canSend = useMemo(() => Boolean(chat && text.trim()), [chat, text]);

  if (!deal) {
    return (
      <section className="card">
        <h3>Deal Chat</h3>
        <p className="muted">Select a deal from the pipeline table to open its collaboration thread.</p>
      </section>
    );
  }

  const handleSend = async () => {
    if (!chat || !text.trim()) {
      return;
    }

    setError(null);

    try {
      const nextMessage = await sendMessage({ chatId: chat.id, text: text.trim() });
      setMessages((prev) => [...prev, nextMessage]);
      setText("");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="card">
      <div className="panel-title">
        <h3>Chat for deal #{deal.id}</h3>
        {loading && <span className="muted">Loading chat...</span>}
      </div>
      <ErrorMessage message={error} />
      <div className="chat-shell">
        {messages.length === 0 ? (
          <p className="muted">No messages yet. Start the internal thread for this deal.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="chat-message">
              {message.roleLabel && <div className="chat-message-role">{message.roleLabel}</div>}
              <div>{message.text}</div>
              {message.sentAt && <div className="chat-message-meta">{new Date(message.sentAt).toLocaleString()}</div>}
            </div>
          ))
        )}
      </div>
      <div className="chat-input-row">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Type a message"
        />
        <button type="button" onClick={() => void handleSend()} disabled={!canSend}>
          Send
        </button>
      </div>
    </section>
  );
}
