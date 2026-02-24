import { FiArrowDownLeft, FiArrowUpRight } from "react-icons/fi";
import Panel from "../components/Panel.jsx";
import Button from "../components/Button.jsx";
import Tabs from "../components/Tabs.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Input from "../components/Input.jsx";
import { formatDateTime, getInitials } from "../lib/format.js";

export default function Inbox({
  token,
  messages,
  loading,
  error,
  onRefresh,
  selected,
  onSelect,
  onMarkRead,
  onDelete,
  filter,
  onFilter,
  composeScope,
  setComposeScope,
  composeRecipient,
  setComposeRecipient,
  composeSubject,
  setComposeSubject,
  composeBody,
  setComposeBody,
  onSend,
  isAdmin,
  currentUserEmail
}) {
  const filtered = messages.filter((message) => {
    if (filter === "broadcast") return message.scope === "broadcast";
    if (filter === "direct") return message.scope === "direct";
    return true;
  });

  return (
    <div className="grid_two inbox_layout inbox_page">
      <Panel
        title="Inbox"
        subtitle="Direct messages and broadcasts."
        className="inbox_list_panel"
        action={
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        }
      >
        <div className="inbox_panel_body">
          <Tabs
            items={[
              { value: "all", label: "All" },
              { value: "broadcast", label: "Broadcast" },
              { value: "direct", label: "Direct" }
            ]}
            value={filter}
            onChange={onFilter}
          />
          {error ? <div className="empty_state">{error}</div> : null}
          <div className="inbox_list_scroll">
            {!token ? (
              <EmptyState title="Login required" description="Sign in to view your inbox." />
            ) : filtered.length ? (
              <div className="list inbox_cards">
                {filtered.map((message) => (
                  <button
                    key={message.id}
                    className="list_row inbox_card"
                    type="button"
                    onClick={() => onSelect(message)}
                  >
                    <div className="inbox_header">
                      <div className="inbox_sender">
                        <div className="avatar">
                          {message.sender_avatar_url ? (
                            <img src={message.sender_avatar_url} alt="Avatar" />
                          ) : (
                            getInitials(message.sender_name || message.sender_email || "")
                          )}
                        </div>
                        <span>{message.sender_name || message.sender_email || "Unknown"}</span>
                      </div>
                      <div className="inbox_meta_right">
                        <span className="inbox_time">{formatDateTime(message.created_at)}</span>
                        {message.sender_email === currentUserEmail ? (
                          <span className="badge badge--icon" title="Sent">
                            <FiArrowUpRight />
                          </span>
                        ) : (
                          <span className="badge badge--icon" title="Received">
                            <FiArrowDownLeft />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="inbox_subject">
                      <strong>{message.subject || (message.scope === "broadcast" ? "Announcement" : "Direct message")}</strong>
                    </div>
                    <div className="panel_subtitle inbox_preview">{message.body}</div>
                    {message.scope === "direct" && !message.read_at ? <span className="badge">Unread</span> : null}
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="No messages" description="You are all caught up." />
            )}
          </div>
        </div>
      </Panel>

      <div className="list inbox_layout">
        <Panel title="Message" subtitle="Selected message" className="inbox_message_panel">
          <div className="inbox_panel_body">
            {selected ? (
              <div className="list inbox_message_body">
                <div className="panel_subtitle inbox_from_line">From: {selected.sender_email || "System"}</div>
                <strong>{selected.subject || "Message"}</strong>
                <div className="inbox_message_text">{selected.body}</div>
                <div className="inbox_message_actions">
                  {selected.scope === "direct" && !selected.read_at ? (
                    <Button variant="ghost" size="sm" onClick={() => onMarkRead(selected.id)}>Mark as read</Button>
                  ) : null}
                  {(isAdmin || selected.sender_email === currentUserEmail || selected.recipient_email === currentUserEmail) ? (
                    <Button variant="ghost" size="sm" onClick={() => onDelete(selected.id)}>Delete</Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <EmptyState title="Select a message" description="Choose a message from the list." />
            )}
          </div>
        </Panel>

        <Panel title="Compose" subtitle="Send a direct message or broadcast." variant="sunken" className="inbox_compose_panel">
          <div className="inbox_panel_body">
            {!token ? (
              <EmptyState title="Login required" description="Sign in to send messages." />
            ) : (
              <div className="list inbox_compose_body">
                <label className="field">
                  <span className="field_label">Scope</span>
                  <select className="select" value={composeScope} onChange={(e) => setComposeScope(e.target.value)}>
                    <option value="direct">Direct</option>
                    {isAdmin ? <option value="broadcast">Broadcast</option> : null}
                  </select>
                </label>
                {composeScope === "direct" ? (
                  <Input label="Recipient email" value={composeRecipient} onChange={(e) => setComposeRecipient(e.target.value)} />
                ) : null}
                <Input label="Subject" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} />
                <label className="field">
                  <span className="field_label">Message</span>
                  <textarea className="textarea" rows={4} value={composeBody} onChange={(e) => setComposeBody(e.target.value)} />
                </label>
                <Button variant="primary" onClick={onSend}>Send message</Button>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
