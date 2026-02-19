import { useEffect, useRef, useState } from "react";
import {
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiHome,
  FiInbox,
  FiMenu,
  FiSearch,
  FiSettings,
  FiUser
} from "react-icons/fi";

const defaultBaseUrl = "http://127.0.0.1:8000";

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="section_header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="section_action">{action}</div> : null}
    </div>
  );
}

function TabButton({ active, children, onClick, collapsed }) {
  return (
    <button className={`nav_item ${active ? "active" : ""} ${collapsed ? "collapsed" : ""}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function Callout({ title, children, action, tone = "info" }) {
  return (
    <div className={`callout ${tone}`}>
      <div>
        <h4>{title}</h4>
        <p>{children}</p>
      </div>
      {action ? <div className="callout_action">{action}</div> : null}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="panel stat_card">
      <p className="stat_label">{label}</p>
      <p className="stat_value">{value}</p>
    </div>
  );
}

function ToastStack({ toasts }) {
  return (
    <div className="toast_stack" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type || "info"}`} role="status">
          <p>{toast.message}</p>
        </div>
      ))}
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function getStorageNumber(key, fallback = 0) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  const num = Number(raw);
  return Number.isFinite(num) ? num : fallback;
}

function extractDetail(data) {
  if (!data) return "";
  const detail = data.detail ?? data.message;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item?.message || item?.detail || JSON.stringify(item))
      .filter(Boolean)
      .join(" ");
  }
  if (typeof detail === "string") return detail;
  if (typeof detail === "object") {
    try {
      return JSON.stringify(detail);
    } catch {
      return "";
    }
  }
  return "";
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem("baseUrl") || defaultBaseUrl);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("apiKey") || "changeme");
  const [token, setToken] = useState(() => localStorage.getItem("kivo_token") || "");
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [kbId, setKbId] = useState(() => localStorage.getItem("kbId") || "");
  const [kbList, setKbList] = useState([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbError, setKbError] = useState("");
  const [kbName, setKbName] = useState("");
  const [kbDescription, setKbDescription] = useState("");
  const [kbCreating, setKbCreating] = useState(false);

  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState(5);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [inboxMessages, setInboxMessages] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [composeScope, setComposeScope] = useState("direct");
  const [composeRecipient, setComposeRecipient] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const [lastIngestAt, setLastIngestAt] = useState(() => localStorage.getItem("lastIngestAt") || "");
  const [queryCount, setQueryCount] = useState(() => getStorageNumber("queryCount", 0));
  const [lastLatencyMs, setLastLatencyMs] = useState(() => getStorageNumber("lastLatencyMs", 0));
  const [avgLatencyMs, setAvgLatencyMs] = useState(() => getStorageNumber("avgLatencyMs", 0));

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("baseUrl", baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    localStorage.setItem("apiKey", apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("kivo_token", token);
    } else {
      localStorage.removeItem("kivo_token");
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem("kbId", kbId || "");
  }, [kbId]);

  useEffect(() => {
    if (lastIngestAt) {
      localStorage.setItem("lastIngestAt", lastIngestAt);
    }
  }, [lastIngestAt]);

  useEffect(() => {
    localStorage.setItem("queryCount", String(queryCount));
  }, [queryCount]);

  useEffect(() => {
    localStorage.setItem("lastLatencyMs", String(lastLatencyMs));
  }, [lastLatencyMs]);

  useEffect(() => {
    localStorage.setItem("avgLatencyMs", String(avgLatencyMs));
  }, [avgLatencyMs]);

  const pushToast = (type, message) => {
    const id = `${Date.now()}-${toastIdRef.current++}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const buildHeaders = ({ json = false, includeAuth = true, includeApiKey = true } = {}) => {
    const headers = {};
    if (json) {
      headers["Content-Type"] = "application/json";
    }
    if (includeApiKey && apiKey) {
      headers["X-API-Key"] = apiKey;
    }
    if (includeAuth && token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchMe = async () => {
    if (!token) return;
    setAuthLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: buildHeaders({ includeApiKey: false })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractDetail(data) || "Authentication failed");
      }
      setCurrentUser(data);
    } catch (err) {
      console.error(err);
      pushToast("error", err.message || "Session expired. Please login again.");
      setToken("");
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      pushToast("error", "Email and password are required.");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: buildHeaders({ json: true, includeAuth: false, includeApiKey: false }),
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractDetail(data) || "Login failed");
      }
      setToken(data.access_token);
      pushToast("success", "Logged in.");
      setLoginPassword("");
    } catch (err) {
      console.error(err);
      pushToast("error", err.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerEmail || !registerPassword) {
      pushToast("error", "Email and password are required.");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: "POST",
        headers: buildHeaders({ json: true, includeAuth: false, includeApiKey: false }),
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          full_name: registerName || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractDetail(data) || "Registration failed");
      }
      pushToast("success", "Account created. Please log in.");
      setRegisterPassword("");
    } catch (err) {
      console.error(err);
      pushToast("error", err.message || "Registration failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    setCurrentUser(null);
    pushToast("info", "Logged out.");
  };

  const fetchInbox = async () => {
    if (!token) return;
    setInboxLoading(true);
    setInboxError("");
    try {
      const res = await fetch(`${baseUrl}/api/v1/messages/inbox`, {
        headers: buildHeaders({ includeApiKey: false })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractDetail(data) || "Failed to load inbox");
      }
      const list = Array.isArray(data) ? data : data.items || [];
      setInboxMessages(list);
    } catch (err) {
      console.error(err);
      setInboxError(err.message || "Failed to load inbox");
      pushToast("error", err.message || "Failed to load inbox");
    } finally {
      setInboxLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!token) {
      pushToast("error", "Login required to send messages.");
      return;
    }
    if (composeScope === "direct" && !composeRecipient) {
      pushToast("error", "Recipient email is required.");
      return;
    }
    if (!composeBody.trim()) {
      pushToast("error", "Message body is required.");
      return;
    }
    try {
      const payload = {
        scope: composeScope,
        recipient_email: composeScope === "direct" ? composeRecipient : undefined,
        subject: composeSubject || undefined,
        body: composeBody
      };
      const res = await fetch(`${baseUrl}/api/v1/messages`, {
        method: "POST",
        headers: buildHeaders({ json: true, includeApiKey: false }),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractDetail(data) || "Failed to send message");
      }
      setComposeSubject("");
      setComposeBody("");
      if (composeScope === "direct") {
        setComposeRecipient("");
      }
      pushToast("success", "Message sent.");
      await fetchInbox();
    } catch (err) {
      console.error(err);
      pushToast("error", err.message || "Failed to send message");
    }
  };

  const handleMarkRead = async (messageId) => {
    if (!token) return;
    try {
      const res = await fetch(`${baseUrl}/api/v1/messages/${messageId}/read`, {
        method: "POST",
        headers: buildHeaders({ includeApiKey: false })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractDetail(data) || "Failed to mark as read");
      }
      await fetchInbox();
    } catch (err) {
      console.error(err);
      pushToast("error", err.message || "Failed to mark as read");
    }
  };

  const fetchKnowledgeBases = async () => {
    if (!baseUrl || !apiKey) return;
    setKbLoading(true);
    setKbError("");
    try {
      const res = await fetch(`${baseUrl}/api/v1/knowledge-bases`, { headers: buildHeaders() });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractDetail(data) || "Failed to load knowledge bases");
      }
      const list = Array.isArray(data) ? data : data.items || [];
      setKbList(list);
      const hasUserSelection = localStorage.getItem("kbSelectedByUser") === "true";
      if (!kbId && list.length && !hasUserSelection) {
        setKbId(list[0].id);
      }
    } catch (err) {
      console.error(err);
      setKbError(err.message || "Failed to load knowledge bases");
      pushToast("error", err.message || "Failed to load knowledge bases");
    } finally {
      setKbLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!baseUrl || !apiKey || !kbId) return;
    setDocsLoading(true);
    setDocsError("");
    try {
      const res = await fetch(`${baseUrl}/api/v1/knowledge-bases/${kbId}/documents`, { headers: buildHeaders() });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractDetail(data) || "Failed to load documents");
      }
      const list = Array.isArray(data) ? data : data.items || [];
      setDocuments(list);
    } catch (err) {
      console.error(err);
      setDocsError(err.message || "Failed to load documents");
      pushToast("error", err.message || "Failed to load documents");
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    if (baseUrl && (apiKey || token)) {
      fetchKnowledgeBases();
    }
  }, [baseUrl, apiKey, token]);

  useEffect(() => {
    if (baseUrl && (apiKey || token) && kbId) {
      fetchDocuments();
    }
  }, [baseUrl, apiKey, token, kbId]);

  useEffect(() => {
    if (token) {
      fetchMe();
      fetchInbox();
    } else {
      setCurrentUser(null);
      setInboxMessages([]);
    }
  }, [token, baseUrl]);

  const runQuery = async () => {
    setError("");
    setResponse(null);
    if (!kbId) {
      setError("Please select a knowledge base in Settings.");
      return;
    }
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(`${baseUrl}/api/v1/knowledge-bases/${kbId}/query`, {
        method: "POST",
        headers: buildHeaders({ json: true }),
        body: JSON.stringify({ question, top_k: Number(topK) || 5 })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractDetail(data) || "Request failed");
      }
      setResponse(data);
      const latency = Math.round(performance.now() - start);
      const nextCount = queryCount + 1;
      const nextAvg = Math.round((avgLatencyMs * queryCount + latency) / nextCount);
      setQueryCount(nextCount);
      setLastLatencyMs(latency);
      setAvgLatencyMs(nextAvg);
      pushToast("success", "Answer ready.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Unknown error");
      pushToast("error", err.message || "Query failed");
    } finally {
      setLoading(false);
    }
  };

  const createKnowledgeBase = async () => {
    if (!kbName.trim()) return;
    setKbCreating(true);
    setKbError("");
    try {
      const res = await fetch(`${baseUrl}/api/v1/knowledge-bases`, {
        method: "POST",
        headers: buildHeaders({ json: true }),
        body: JSON.stringify({ name: kbName.trim(), description: kbDescription.trim() || undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractDetail(data) || "Failed to create knowledge base");
      }
      setKbName("");
      setKbDescription("");
      localStorage.setItem("kbSelectedByUser", "true");
      await fetchKnowledgeBases();
      if (data?.id) {
        setKbId(data.id);
      }
      pushToast("success", "Knowledge base created.");
    } catch (err) {
      console.error(err);
      setKbError(err.message || "Failed to create knowledge base");
      pushToast("error", err.message || "Failed to create knowledge base");
    } finally {
      setKbCreating(false);
    }
  };

  const handleUpload = async (files) => {
    if (!files || !files.length) return;
    if (!kbId) {
      setDocsError("Select or create a knowledge base in Settings.");
      return;
    }
    setUploading(true);
    setDocsError("");
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${baseUrl}/api/v1/knowledge-bases/${kbId}/documents`, {
          method: "POST",
          headers: buildHeaders(),
          body: formData
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(extractDetail(data) || `Failed to upload ${file.name}`);
        }
      }
      await fetchDocuments();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      pushToast("success", "Documents uploaded.");
    } catch (err) {
      console.error(err);
      setDocsError(err.message || "Upload failed");
      pushToast("error", err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!kbId) return;
    const confirmed = window.confirm("Delete this document?");
    if (!confirmed) return;
    setDeletingId(docId);
    try {
      const res = await fetch(`${baseUrl}/api/v1/knowledge-bases/${kbId}/documents/${docId}`, {
        method: "DELETE",
        headers: buildHeaders()
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(extractDetail(data) || "Delete failed");
      }
      await fetchDocuments();
      pushToast("success", "Document deleted.");
    } catch (err) {
      console.error(err);
      setDocsError(err.message || "Delete failed");
      pushToast("error", err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleIngest = async () => {
    if (!kbId) return;
    setIngesting(true);
    setDocsError("");
    try {
      const res = await fetch(`${baseUrl}/api/v1/knowledge-bases/${kbId}/ingest`, {
        method: "POST",
        headers: buildHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractDetail(data) || "Ingestion failed");
      }
      const nowIso = new Date().toISOString();
      setLastIngestAt(nowIso);
      await fetchDocuments();
      pushToast("success", "Ingestion started.");
    } catch (err) {
      console.error(err);
      setDocsError(err.message || "Ingestion failed");
      pushToast("error", err.message || "Ingestion failed");
    } finally {
      setIngesting(false);
    }
  };

  const navItems = [
    { id: "home", label: "Home", icon: <FiHome className="nav_icon" /> },
    { id: "query", label: "Query", icon: <FiSearch className="nav_icon" /> },
    { id: "documents", label: "Documents", icon: <FiFileText className="nav_icon" /> },
    { id: "inbox", label: "Inbox", icon: <FiInbox className="nav_icon" /> },
    { id: "usage", label: "Usage", icon: <FiBarChart2 className="nav_icon" /> },
    { id: "settings", label: "Settings", icon: <FiSettings className="nav_icon" /> }
  ];

  const accountItem = { id: "account", label: "Account", icon: <FiUser className="nav_icon" /> };

  const pageTitleMap = {
    home: "Home",
    query: "Query",
    documents: "Documents",
    inbox: "Inbox",
    usage: "Usage",
    settings: "Settings",
    account: "Account"
  };

  const documentsCount = documents.length;
  const documentsValue = documentsCount === 0 ? "0" : documentsCount;
  const queriesValue = queryCount > 0 ? queryCount : "-";
  const lastLatencyValue = lastLatencyMs > 0 ? `${lastLatencyMs} ms` : "-";
  const avgLatencyValue = avgLatencyMs > 0 ? `${avgLatencyMs} ms` : "-";

  const authReady = Boolean(apiKey || token);
  const settingsIncomplete = !baseUrl || !authReady;
  const kbMissing = !kbId;
  const isAdmin = Boolean(currentUser?.is_admin);
  const broadcastMessages = inboxMessages.filter((message) => message.scope === "broadcast");

  return (
    <div className="app_shell">
      {mobileSidebarOpen ? (
        <div className="sidebar_overlay" onClick={() => setMobileSidebarOpen(false)} role="presentation" />
      ) : null}
      <aside className={`sidebar ${sidebarCollapsed ? "is-collapsed" : ""} ${mobileSidebarOpen ? "is-open" : ""}`}>
        <div className="sidebar_header">
          <div className="sidebar_brand">
            {sidebarCollapsed ? (
              <span className="brand_ai">K</span>
            ) : (
              <>Kivo</>
            )}
          </div>
          <button
            className="sidebar_toggle"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            type="button"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>
        <nav className="sidebar_nav">
          {navItems.slice(0, 3).map((item) => (
            <TabButton
              key={item.id}
              active={activeTab === item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileSidebarOpen(false);
              }}
              collapsed={sidebarCollapsed}
            >
              {item.icon}
              <span className="nav_label">{item.label}</span>
            </TabButton>
          ))}
          <div className="nav_divider" />
          {navItems.slice(3).map((item) => (
            <TabButton
              key={item.id}
              active={activeTab === item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileSidebarOpen(false);
              }}
              collapsed={sidebarCollapsed}
            >
              {item.icon}
              <span className="nav_label">{item.label}</span>
            </TabButton>
          ))}
        </nav>
        <div className="sidebar_footer">
          <TabButton
            active={activeTab === accountItem.id}
            onClick={() => {
              setActiveTab(accountItem.id);
              setMobileSidebarOpen(false);
            }}
            collapsed={sidebarCollapsed}
          >
            {accountItem.icon}
            <span className="nav_label">{accountItem.label}</span>
          </TabButton>
        </div>
      </aside>

      <main className="main_content">
        <header className="topbar">
          <div className="topbar_left">
            <button className="mobile_toggle" type="button" onClick={() => setMobileSidebarOpen(true)} aria-label="Open menu">
              <FiMenu />
            </button>
            <p className="page_title">{pageTitleMap[activeTab] || "Home"}</p>
          </div>
          <div className="topbar_right">
            <div className="user_chip compact">
              <div className="avatar">A</div>
              <div className="user_details">
                <p>Admin</p>
                <span>Operations</span>
              </div>
            </div>
          </div>
        </header>

        {activeTab === "home" ? (
          <section className="dashboard_grid">
            {settingsIncomplete ? (
              <div className="panel wide">
                <Callout
                  title="Complete Settings"
                  action={
                    <button className="primary" type="button" onClick={() => setActiveTab("settings")}>
                      Go to Settings
                    </button>
                  }
                >
                  Complete Settings to connect your backend.
                </Callout>
              </div>
            ) : kbMissing ? (
              <div className="panel wide">
                <Callout
                  title="Select a knowledge base"
                  action={
                    <button className="primary" type="button" onClick={() => setActiveTab("settings")}>
                      Go to Settings
                    </button>
                  }
                >
                  Select or create a knowledge base to unlock metrics.
                </Callout>
              </div>
            ) : null}
            <StatCard label="Documents" value={documentsValue} />
            <StatCard label="Queries" value={queriesValue} />
            <StatCard label="Last indexed" value={formatDateTime(lastIngestAt)} />
            <StatCard label="Latency" value={lastLatencyValue} />
            <div className="panel wide announcement_panel">
              <SectionHeader
                title="Announcements"
                subtitle="Latest broadcast updates."
                action={
                  token ? (
                    <button className="ghost" type="button" onClick={() => setActiveTab("inbox")}>
                      View Inbox
                    </button>
                  ) : null
                }
              />
              {!token ? (
                <div className="empty_state">
                  <p>Login to see announcements.</p>
                  <div className="empty_state_actions">
                    <button className="primary" type="button" onClick={() => setActiveTab("account")}>
                      Go to Account
                    </button>
                  </div>
                </div>
              ) : broadcastMessages.length ? (
                <div className="announcement_list">
                  {broadcastMessages.slice(0, 3).map((message) => (
                    <div key={message.id} className="announcement_item">
                      <h4>{message.subject || "Announcement"}</h4>
                      <p>{message.body}</p>
                      <span>{formatDateTime(message.created_at)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty_state">No announcements yet.</div>
              )}
            </div>
            <div className="panel wide empty_state_panel">
              <h3>Connect your backend and upload documents to see metrics.</h3>
              <div className="row">
                <button className="primary" type="button" onClick={() => setActiveTab("query")}>
                  Go to Query
                </button>
                <button className="ghost" type="button" onClick={() => setActiveTab("documents")}>
                  Manage Documents
                </button>
                {(settingsIncomplete || kbMissing) ? (
                  <button className="ghost" type="button" onClick={() => setActiveTab("settings")}>
                    Go to Settings
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "query" ? (
          <section className="home_panels">
            <div className="panel query_panel">
              <SectionHeader
                title="Ask a question"
                subtitle="Use the RAG endpoint to retrieve grounded answers."
                action={
                  <button className="ghost" onClick={() => setQuestion("")} type="button">
                    Clear
                  </button>
                }
              />
              {settingsIncomplete ? (
                <Callout
                  title="Complete Settings"
                  action={
                    <button className="primary" type="button" onClick={() => setActiveTab("settings")}>
                      Go to Settings
                    </button>
                  }
                >
                  Complete Settings to connect your backend.
                </Callout>
              ) : kbMissing ? (
                <Callout
                  title="Select a knowledge base"
                  action={
                    <button className="primary" type="button" onClick={() => setActiveTab("settings")}>
                      Go to Settings
                    </button>
                  }
                >
                  Select or create a knowledge base before running queries.
                </Callout>
              ) : null}
              {documentsCount === 0 && !settingsIncomplete && !kbMissing ? (
                <div className="hint">Upload and ingest documents for best results.</div>
              ) : null}
              <div className="field">
                <label>Question</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What is our onboarding process?"
                  rows={8}
                />
              </div>
              <div className="row">
                <div className="field compact">
                  <label>Retrieval depth</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={topK}
                    onChange={(e) => setTopK(e.target.value)}
                  />
                </div>
                <button className="primary" onClick={runQuery} disabled={loading} type="button">
                  {loading ? "Asking..." : "Ask"}
                </button>
              </div>
              {error ? <div className="alert error">{error}</div> : null}
            </div>

            <div className="panel response response_panel">
              <SectionHeader title="Response" subtitle="Answer and sources returned by the model." />
              {response ? (
                <div className="response_body">
                  <div className="answer">{response.answer}</div>
                  <div className="sources">
                    {(response.sources || []).map((source, index) => (
                      <div key={`${source.chunk_id}-${index}`} className="source_card">
                        <div className="source_meta">
                          <span className="badge">{source.filename || "document"}</span>
                          <span className="score">{source.score?.toFixed?.(2) ?? "-"}</span>
                        </div>
                        <p className="excerpt">{source.excerpt}</p>
                        <p className="ids">Chunk: {source.chunk_id}</p>
                        <p className="ids">Doc: {source.document_id}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty_state">No response yet. Run a query to see results.</div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "documents" ? (
          <section className="grid">
            <div className="panel wide dark_panel">
              <SectionHeader
                title="Documents"
                subtitle="Upload, review, and ingest your knowledge base files."
              />
              {settingsIncomplete ? (
                <Callout
                  title="Complete Settings"
                  action={
                    <button className="primary" type="button" onClick={() => setActiveTab("settings")}>
                      Go to Settings
                    </button>
                  }
                >
                  Complete Settings to connect your backend.
                </Callout>
              ) : kbMissing ? (
                <Callout
                  title="Select a knowledge base"
                  action={
                    <button className="primary" type="button" onClick={() => setActiveTab("settings")}>
                      Go to Settings
                    </button>
                  }
                >
                  Choose or create a knowledge base to manage documents.
                </Callout>
              ) : null}

              <div className="doc_actions">
                <input
                  ref={fileInputRef}
                  className="file_input"
                  type="file"
                  multiple
                  accept=".pdf,.txt,.md"
                  onChange={(e) => handleUpload(e.target.files)}
                  disabled={uploading || settingsIncomplete || kbMissing}
                />
                <button className="primary" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || settingsIncomplete || kbMissing}>
                  {uploading ? "Uploading..." : "Upload documents"}
                </button>
                <button className="ghost" type="button" onClick={handleIngest} disabled={ingesting || settingsIncomplete || kbMissing}>
                  {ingesting ? "Ingesting..." : "Ingest"}
                </button>
              </div>

              {docsError ? <div className="alert error">{docsError}</div> : null}

              {docsLoading ? (
                <div className="empty_state">Loading documents...</div>
              ) : documents.length ? (
                <div className="doc_list">
                  {documents.map((doc) => {
                    const docKey = doc.id || doc.document_id || doc.filename;
                    const isDeleting = deletingId === (doc.id || doc.document_id);
                    return (
                    <div key={docKey} className="doc_row">
                      <div>
                        <p className="doc_name">{doc.filename || doc.name || "Untitled"}</p>
                        <p className="doc_meta">{doc.status || "Ready"}</p>
                        {doc.created_at ? <p className="doc_meta">{formatDateTime(doc.created_at)}</p> : null}
                      </div>
                      <div className="doc_row_actions">
                        <p className="doc_chunks">{doc.chunks ?? doc.chunk_count ?? "-"} chunks</p>
                        <button className="danger" type="button" onClick={() => handleDelete(doc.id || doc.document_id)} disabled={isDeleting}>
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty_state">
                  <p>No documents uploaded yet.</p>
                  <div className="empty_state_actions">
                    <button className="primary" type="button" onClick={() => fileInputRef.current?.click()} disabled={settingsIncomplete || kbMissing}>
                      Upload documents
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "inbox" ? (
          <section className="inbox_layout">
            {!token ? (
              <div className="panel wide">
                <Callout
                  title="Login required"
                  action={
                    <button className="primary" type="button" onClick={() => setActiveTab("account")}>
                      Go to Account
                    </button>
                  }
                >
                  Login to view your inbox and send messages.
                </Callout>
              </div>
            ) : null}
            <div className="panel inbox_list_panel">
              <SectionHeader
                title="Inbox"
                subtitle="Direct messages and broadcasts."
                action={
                  token ? (
                    <button className="ghost" type="button" onClick={fetchInbox} disabled={inboxLoading}>
                      {inboxLoading ? "Refreshing..." : "Refresh"}
                    </button>
                  ) : null
                }
              />
              {inboxError ? <div className="alert error">{inboxError}</div> : null}
              {inboxLoading ? (
                <div className="empty_state">Loading messages...</div>
              ) : inboxMessages.length ? (
                <div className="message_list">
                  {inboxMessages.map((message) => {
                    const unread = message.scope === "direct" && !message.read_at;
                    return (
                      <button
                        key={message.id}
                        className={`message_row ${unread ? "unread" : ""}`}
                        type="button"
                        onClick={() => setSelectedMessage(message)}
                      >
                        <div>
                          <p className="message_subject">{message.subject || (message.scope === "broadcast" ? "Announcement" : "Direct message")}</p>
                          <p className="message_preview">{message.body}</p>
                        </div>
                        <div className="message_meta">
                          <span>{message.scope === "broadcast" ? "Broadcast" : "Direct"}</span>
                          <span>{formatDateTime(message.created_at)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="empty_state">No messages yet.</div>
              )}
            </div>

            <div className="inbox_side">
              <div className="panel inbox_detail_panel">
                <SectionHeader title="Message" subtitle="Select a message to view details." />
                {selectedMessage ? (
                  <div className="message_detail">
                    <h3>{selectedMessage.subject || (selectedMessage.scope === "broadcast" ? "Announcement" : "Direct message")}</h3>
                    <p className="message_body">{selectedMessage.body}</p>
                    <div className="message_detail_meta">
                      <span>From: {selectedMessage.sender_email || "System"}</span>
                      <span>{formatDateTime(selectedMessage.created_at)}</span>
                    </div>
                    {selectedMessage.scope === "direct" && !selectedMessage.read_at ? (
                      <button className="ghost" type="button" onClick={() => handleMarkRead(selectedMessage.id)}>
                        Mark as read
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="empty_state">Select a message to view details.</div>
                )}
              </div>

              <div className="panel inbox_compose_panel">
                <SectionHeader title="Compose" subtitle="Send a direct message or broadcast." />
                {!token ? (
                  <div className="empty_state">Login to send messages.</div>
                ) : (
                  <div className="compose_form">
                    <div className="field">
                      <label>Scope</label>
                      <select
                        className="select_input"
                        value={composeScope}
                        onChange={(e) => setComposeScope(e.target.value)}
                      >
                        <option value="direct">Direct</option>
                        {isAdmin ? <option value="broadcast">Broadcast</option> : null}
                      </select>
                      {!isAdmin ? <span className="hint">Broadcast is available for the admin account.</span> : null}
                    </div>
                    {composeScope === "direct" ? (
                      <div className="field">
                        <label>Recipient email</label>
                        <input value={composeRecipient} onChange={(e) => setComposeRecipient(e.target.value)} placeholder="name@company.com" />
                      </div>
                    ) : null}
                    <div className="field">
                      <label>Subject</label>
                      <input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Optional subject" />
                    </div>
                    <div className="field">
                      <label>Message</label>
                      <textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} rows={4} />
                    </div>
                    <button className="primary" type="button" onClick={handleSendMessage}>
                      Send message
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "usage" ? (
          <section className="grid">
            {settingsIncomplete ? (
              <div className="panel wide">
                <Callout
                  title="Complete Settings"
                  action={
                    <button className="primary" type="button" onClick={() => setActiveTab("settings")}>
                      Go to Settings
                    </button>
                  }
                >
                  Complete Settings to connect your backend.
                </Callout>
              </div>
            ) : kbMissing ? (
              <div className="panel wide">
                <Callout
                  title="Select a knowledge base"
                  action={
                    <button className="primary" type="button" onClick={() => setActiveTab("settings")}>
                      Go to Settings
                    </button>
                  }
                >
                  Select or create a knowledge base to see usage.
                </Callout>
              </div>
            ) : null}
            <div className="panel wide dark_panel">
              <SectionHeader title="Usage" subtitle="Client-side metrics from your latest activity." />
              <div className="usage_grid">
                <StatCard label="Monthly queries" value={queriesValue} />
                <StatCard label="Average latency" value={avgLatencyValue} />
                <StatCard label="Last latency" value={lastLatencyValue} />
              </div>
              <div className="usage_grid">
                <div className="panel stat_card">
                  <p className="stat_label">Last ingest</p>
                  <p className="stat_value">{formatDateTime(lastIngestAt)}</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "settings" ? (
          <section className="grid">
            <div className="panel wide settings_panel">
              <SectionHeader
                title="Connection"
                subtitle="Point the console to the correct API and knowledge base."
              />
              <div className="form_grid">
                <div className="field">
                  <label>API base URL</label>
                  <input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={defaultBaseUrl}
                  />
                </div>
                <div className="field">
                  <label>X-API-Key</label>
                  <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="changeme" />
                </div>
              </div>

              <div className="settings_block">
                <SectionHeader
                  title="Knowledge Bases"
                  subtitle="Select an existing knowledge base or create a new one."
                  action={
                    <button className="ghost" type="button" onClick={fetchKnowledgeBases} disabled={kbLoading || settingsIncomplete}>
                      {kbLoading ? "Refreshing..." : "Refresh"}
                    </button>
                  }
                />
                <div className="form_grid">
                  <div className="field">
                    <label>Active knowledge base</label>
                    <select
                      className="select_input"
                      value={kbId}
                      onChange={(e) => {
                        setKbId(e.target.value);
                        localStorage.setItem("kbSelectedByUser", "true");
                      }}
                      disabled={kbLoading || settingsIncomplete}
                    >
                      <option value="">Select knowledge base</option>
                      {kbList.map((kb) => (
                        <option key={kb.id} value={kb.id}>
                          {kb.name} ({kb.id.slice(0, 6)})
                        </option>
                      ))}
                    </select>
                    {kbLoading ? <span className="hint">Loading knowledge bases...</span> : null}
                    {kbError ? <span className="hint error">{kbError}</span> : null}
                  </div>
                  <div className="field">
                    <label>Knowledge base ID</label>
                    <input value={kbId} readOnly placeholder="Select a knowledge base" />
                  </div>
                </div>

                <div className="create_kb">
                  <SectionHeader title="Create knowledge base" subtitle="Give it a name and optional description." />
                  <div className="form_grid">
                    <div className="field">
                      <label>Name</label>
                      <input value={kbName} onChange={(e) => setKbName(e.target.value)} placeholder="Finance KB" />
                    </div>
                    <div className="field">
                      <label>Description</label>
                      <input value={kbDescription} onChange={(e) => setKbDescription(e.target.value)} placeholder="Policies and reports" />
                    </div>
                  </div>
                  <div className="row">
                    <button className="primary" type="button" onClick={createKnowledgeBase} disabled={kbCreating || !kbName.trim() || settingsIncomplete}>
                      {kbCreating ? "Creating..." : "Create knowledge base"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings_footer">
                <p>
                  API Docs: <span>{baseUrl}/docs</span>
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "account" ? (
          <section className="grid">
            <div className="panel wide dark_panel">
              <SectionHeader title="Account" subtitle="Login or register to unlock messaging." />
              {!token ? (
                <div className="account_forms">
                  <div className="panel account_panel">
                    <SectionHeader title="Login" subtitle="Access your account." />
                    <div className="field">
                      <label>Email</label>
                      <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@company.com" />
                    </div>
                    <div className="field">
                      <label>Password</label>
                      <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <button className="primary" type="button" onClick={handleLogin} disabled={authLoading}>
                      {authLoading ? "Signing in..." : "Login"}
                    </button>
                  </div>
                  <div className="panel account_panel">
                    <SectionHeader title="Register" subtitle="Create a new account." />
                    <div className="field">
                      <label>Full name</label>
                      <input value={registerName} onChange={(e) => setRegisterName(e.target.value)} placeholder="Your name" />
                    </div>
                    <div className="field">
                      <label>Email</label>
                      <input value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} placeholder="you@company.com" />
                    </div>
                    <div className="field">
                      <label>Password</label>
                      <input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <button className="primary" type="button" onClick={handleRegister} disabled={authLoading}>
                      {authLoading ? "Creating..." : "Register"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="account_grid">
                  <div className="panel profile_card">
                    <p className="stat_label">Name</p>
                    <p className="stat_value">{currentUser?.full_name || "—"}</p>
                    <p className="stat_label">Email</p>
                    <p className="stat_value">{currentUser?.email || "—"}</p>
                  </div>
                  <div className="panel profile_card">
                    <p className="stat_label">Role</p>
                    <p className="stat_value">{isAdmin ? "Admin" : "Member"}</p>
                    <p className="stat_label">Status</p>
                    <p className="stat_value">{currentUser?.is_active ? "Active" : "Inactive"}</p>
                    <button className="ghost" type="button" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}
      </main>
      <ToastStack toasts={toasts} />
    </div>
  );
}
