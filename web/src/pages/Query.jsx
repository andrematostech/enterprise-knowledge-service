import { useEffect, useRef, useState } from "react";
import Panel from "../components/Panel.jsx";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function Query({
  question,
  setQuestion,
  topK,
  setTopK,
  response,
  error,
  loading,
  onRun,
  onClear,
  latency,
  historyItems = [],
  onSelectHistory
}) {
  const [activeView, setActiveView] = useState("query");
  const [activeCitation, setActiveCitation] = useState(null);
  const sourceRefs = useRef([]);

  useEffect(() => {
    if (activeCitation === null) return undefined;
    const timeoutId = window.setTimeout(() => setActiveCitation(null), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [activeCitation]);

  useEffect(() => {
    sourceRefs.current = [];
    setActiveCitation(null);
  }, [response]);

  const formatLatency = (value) => {
    if (!value && value !== 0) return null;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
    return `${value}ms`;
  };

  const handleCitationClick = (citationNumber) => {
    const sourceIndex = Number(citationNumber) - 1;
    const sourceCard = sourceRefs.current[sourceIndex];
    if (!sourceCard) return;
    setActiveCitation(sourceIndex);
    sourceCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    sourceCard.focus({ preventScroll: true });
  };

  const renderAnswerWithCitations = (text) => {
    if (!text) return null;
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      if (part.match(/^\[\d+\]$/)) {
        const citationNumber = part.replace(/\[|\]/g, "");
        return (
          <button
            key={`${part}-${index}`}
            className="citation_pill"
            type="button"
            onClick={() => handleCitationClick(citationNumber)}
            aria-label={`Jump to citation ${citationNumber} in retrieved context`}
          >
            {part}
          </button>
        );
      }
      return <span key={`text-${index}`}>{part}</span>;
    });
  };

  const renderHistory = () => (
    <Panel
      title="History"
      subtitle="Local history stored in this browser"
      variant="sunken"
      className="conversations_panel"
    >
      {historyItems.length ? (
        <div className="list conversations_list">
          {historyItems.map((item) => (
            <button
              key={item.id}
              className="list_row conversation_row conversation_button"
              type="button"
              onClick={() => onSelectHistory?.(item.id)}
            >
              <div className="conversation_meta">
                <strong>{item.question}</strong>
                <span>{item.kbName}</span>
                <span>{item.createdAt}</span>
              </div>
              <p className="conversation_answer">{item.answer}</p>
              <div className="conversation_footer">
                <span>{item.latency}</span>
                <span>{item.sources}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="No conversations yet" subtitle="Run a query in Ask to capture it here." />
      )}
    </Panel>
  );

  return (
    <div className="query_shell">
      <div className="query_toggle segmented_control">
        <button
          className={`segmented_button ${activeView === "query" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveView("query")}
        >
          Query
        </button>
        <button
          className={`segmented_button ${activeView === "history" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveView("history")}
        >
          History
        </button>
      </div>

      {activeView === "query" ? (
        <div className="grid_two query_layout">
          <Panel
            title="Ask"
            subtitle="Retrieve grounded answers."
            variant="raised"
            className="query_ask_panel"
            action={(
              <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
            )}
          >
            <div className="query_panel_body">
              <Input
                label="Question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What is our onboarding process?"
              />
              <div className="query_actions">
                <Input
                  label="Retrieval depth"
                  type="number"
                  min={1}
                  max={20}
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                />
                <div className="query_action_stack">
                  <Button variant="primary" size="lg" className="query_ask_btn" onClick={onRun} disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner" />
                        Asking...
                      </>
                    ) : (
                      "Ask"
                    )}
                  </Button>
                  {latency ? <div className="query_latency">Latency: {formatLatency(latency)}</div> : null}
                </div>
              </div>
              {error ? <div className="empty_state">{error}</div> : null}
            </div>
          </Panel>
          <Panel
            title="Answer"
            subtitle="Answer and citations"
            variant="sunken"
            className="query_answer_panel"
            action={<span className="rag_badge">RAG - grounded</span>}
          >
            <div className="query_panel_body query_response">
              {!response ? (
                <EmptyState title="No response" description="Run a query to see results." />
              ) : (
                <div className="list">
                  <div>
                    <div className="query_answer_text">{renderAnswerWithCitations(response.answer)}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(response.answer || "")}
                    >
                      Copy answer
                    </Button>
                  </div>
                  <div className="rag_sources">
                    <div className="rag_sources_header">Retrieved Context</div>
                    <div className="rag_sources_grid">
                      {(response.sources || []).map((source, index) => {
                        const snippet = source.excerpt || source.text || source.content || source.snippet || "";
                        const trimmed = snippet ? snippet.slice(0, 220) : "";
                        const preview = snippet && snippet.length > 220 ? `${trimmed}...` : trimmed;
                        const chunkId = source.chunk_id || source.chunkId || "";
                        const scoreValue = typeof source.score === "number" ? source.score : 0;
                        const scoreLabel = scoreValue ? scoreValue.toFixed(2) : "0.00";
                        return (
                          <div
                            key={`${source.chunk_id || index}`}
                            ref={(element) => {
                              sourceRefs.current[index] = element;
                            }}
                            className={`rag_source_card ${activeCitation === index ? "is-active" : ""}`}
                            tabIndex={-1}
                          >
                            <div className="rag_source_header">
                              <div className="rag_source_title">{source.filename || source.source || "document"}</div>
                              <span className="rag_source_score">Score {scoreLabel}</span>
                            </div>
                            <div className="rag_source_meta">
                              {chunkId ? <span className="rag_source_chip">Chunk {chunkId}</span> : null}
                              {source.page ? <span className="rag_source_chip">Page {source.page}</span> : null}
                            </div>
                            <div className="rag_source_preview">
                              <span className="rag_source_preview_label">Preview</span>
                              <span className="rag_source_preview_text">{preview || "No preview available."}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>
      ) : (
        renderHistory()
      )}
    </div>
  );
}

