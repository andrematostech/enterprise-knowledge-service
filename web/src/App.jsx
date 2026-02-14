import { useMemo, useState } from "react";

const defaultBaseUrl = "http://127.0.0.1:8000";

function SectionHeader({ title, subtitle }) {
  return (
    <div className="section_header">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

export default function App() {
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [apiKey, setApiKey] = useState("changeme");
  const [kbId, setKbId] = useState("");
  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState(5);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="app">
      <div className="bg_orb orb_one" />
      <div className="bg_orb orb_two" />
      <header className="hero">
        <div className="hero_text">
          <p className="eyebrow">Enterprise Knowledge Service</p>
          <h1>EKS Console</h1>
          <p className="lead">
            A focused control panel for querying private knowledge bases with grounded answers and citations.
          </p>
        </div>
        <div className="hero_card">
          <div className="field">
            <label>API base URL</label>
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={defaultBaseUrl} />
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
      </header>

      <main className="content">
        <section className="panel">
          <SectionHeader
            title="Ask a question"
            subtitle="Use the RAG endpoint to retrieve grounded answers with citations."
          />
          <div className="field">
            <label>Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What is our onboarding process?"
              rows={4}
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
            <button className="primary" onClick={runQuery} disabled={loading}>
              {loading ? "Querying..." : "Run Query"}
            </button>
          </div>
          {error ? <div className="alert error">{error}</div> : null}
        </section>

        <section className="panel response_panel">
          <SectionHeader title="Response" subtitle="Raw answer with source metadata." />
          {response ? (
            <div className="response">
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
        </section>
      </main>

      <footer className="footer">
        <p>
          API Docs: <span>{baseUrl}/docs</span>
        </p>
      </footer>
    </div>
  );
}
