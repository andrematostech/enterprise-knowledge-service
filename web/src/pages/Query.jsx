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
  latency
}) {
  return (
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
          <Input label="Question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What is our onboarding process?" />
          <div className="query_actions">
            <Input label="Retrieval depth" type="number" min={1} max={20} value={topK} onChange={(e) => setTopK(e.target.value)} />
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
          </div>
          {error ? <div className="empty_state">{error}</div> : null}
          {latency ? <div className="panel_subtitle">Latency: {latency} ms</div> : null}
        </div>
      </Panel>
      <Panel title="Answer" subtitle="Answer and citations" variant="sunken" className="query_answer_panel">
        <div className="query_panel_body query_response">
          {!response ? (
            <EmptyState title="No response" description="Run a query to see results." />
          ) : (
            <div className="list">
              <div>
                <div className="query_answer_text">{response.answer}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(response.answer || "")}
                >
                  Copy answer
                </Button>
              </div>
              <div>
                <strong>Sources</strong>
                <div className="list">
                  {(response.sources || []).map((source, index) => {
                    const snippet = source.text || source.content || source.snippet || "";
                    const trimmed = snippet ? snippet.slice(0, 150) : "";
                    const preview = snippet && snippet.length > 150 ? `${trimmed}…` : trimmed;
                    const fallback = source.page ? `Page ${source.page}` : (source.chunk_id ? `Chunk ${source.chunk_id}` : "No preview available");
                    return (
                      <div key={`${source.chunk_id || index}`} className="list_row">
                        <div>
                          <div>{source.filename || source.source || "document"}</div>
                          <div className="panel_subtitle">{preview || fallback}</div>
                        </div>
                        <span className="badge">score {Math.round((source.score || 0) * 100)}</span>
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
  );
}
