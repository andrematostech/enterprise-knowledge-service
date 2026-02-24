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
  isAdmin
}) {
  const filtered = messages.filter((message) => {
    if (filter === "broadcast") return message.scope === "broadcast";
    if (filter === "direct") return message.scope === "direct";
    return true;
  });

  return (
    <div className="grid_two">
      <Panel
        title="Inbox"
        subtitle="Direct messages and broadcasts."
        action={
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        }
      >
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
        {!token ? (
          <EmptyState title="Login required" description="Sign in to view your inbox." />
        ) : filtered.length ? (
          <div className="list">
            {filtered.map((message) => (
              <button
                key={message.id}
                className="list_row"
                type="button"
                onClick={() => onSelect(message)}
              >
                <div style={{ display: "flex", gap: "12px" }}>
                  <div className="avatar">
                    {message.sender_avatar_url ? (
                      <img src={message.sender_avatar_url} alt="Avatar" />
                    ) : (
                      getInitials(message.sender_name || message.sender_email || "")
                    )}
                  </div>
                  <div>
                    <strong>{message.subject || (message.scope === "broadcast" ? "Announcement" : "Direct message")}</strong>
                    <div className="panel_subtitle">{message.body}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>{message.sender_name || message.sender_email || "Unknown"}</div>
                  <div className="panel_subtitle">{formatDateTime(message.created_at)}</div>
                  {message.scope === "direct" && !message.read_at ? <span className="badge">Unread</span> : null}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="No messages" description="You are all caught up." />
        )}
      </Panel>

      <div className="list">
        <Panel title="Message" subtitle="Selected message">
          {selected ? (
            <div className="list">
              <strong>{selected.subject || "Message"}</strong>
              <div>{selected.body}</div>
              <div className="panel_subtitle">From: {selected.sender_email || "System"}</div>
              {selected.scope === "direct" && !selected.read_at ? (
                <Button variant="ghost" size="sm" onClick={() => onMarkRead(selected.id)}>Mark as read</Button>
              ) : null}
            </div>
          ) : (
            <EmptyState title="Select a message" description="Choose a message from the list." />
          )}
        </Panel>

        <Panel title="Compose" subtitle="Send a direct message or broadcast." variant="sunken">
          {!token ? (
            <EmptyState title="Login required" description="Sign in to send messages." />
          ) : (
            <div className="list">
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
        </Panel>
      </div>
    </div>
  );
}
