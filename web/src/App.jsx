import { useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiHome, FiSettings } from "react-icons/fi";

const defaultBaseUrl = "http://127.0.0.1:8000";

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="section_header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
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

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [apiKey, setApiKey] = useState("changeme");
  const [kbId, setKbId] = useState("");
  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState(5);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const headers = useMemo(() => {
    return {
      "Content-Type": "application/json",
      "X-API-Key": apiKey
    };
  }, [apiKey]);

  const runQuery = async () => {
    setError("");
    setResponse(null);
    if (!kbId) {
      setError("Please provide a knowledge base id.");
      return;
    }
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/v1/knowledge-bases/${kbId}/query`, {
        method: "POST",
        headers,
        body: JSON.stringify({ question, top_k: Number(topK) || 5 })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Request failed");
      }
      setResponse(data);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app_shell">
      <aside className={`sidebar ${sidebarCollapsed ? "is-collapsed" : ""}`}>
        <div className="sidebar_header">
          <div className="sidebar_brand">
            {sidebarCollapsed ? (
              <span className="brand_ai">ai</span>
            ) : (
              <>
                EKS. <span className="brand_ai">ai</span>
              </>
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
          <TabButton
            active={activeTab === "home"}
            onClick={() => setActiveTab("home")}
            collapsed={sidebarCollapsed}
          >
            <FiHome className="nav_icon" />
            <span className="nav_label">Home</span>
          </TabButton>
          <TabButton
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            collapsed={sidebarCollapsed}
          >
            <FiSettings className="nav_icon" />
            <span className="nav_label">Settings</span>
          </TabButton>
        </nav>
        <div className="sidebar_footer">
          <div className={`user_chip ${sidebarCollapsed ? "collapsed" : ""}`}>
            <div className="avatar">A</div>
            <div className="user_details">
              <p>Admin</p>
              <span>Operations</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main_content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Enterprise Knowledge Service</p>
            <h1>EKS Console</h1>
            <p className="lead">Query private knowledge bases with grounded answers and citations.</p>
          </div>
        </header>

        {activeTab === "home" ? (
          <section className="grid home_grid">
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
                  <label>Top K</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={topK}
                    onChange={(e) => setTopK(e.target.value)}
                  />
                </div>
                <button className="primary" onClick={runQuery} disabled={loading} type="button">
                  {loading ? "Querying..." : "Run Query"}
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

        {activeTab === "settings" ? (
          <section className="grid">
            <div className="panel wide">
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
                <div className="field">
                  <label>Knowledge base id</label>
                  <input value={kbId} onChange={(e) => setKbId(e.target.value)} placeholder="UUID" />
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
      </main>
    </div>
  );
}
