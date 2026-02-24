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
    <div className="grid_two">
      <Panel title="Ask" subtitle="Retrieve grounded answers." variant="raised" action={
        <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
      }>
        <Input label="Question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What is our onboarding process?" />
        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
          <Input label="Retrieval depth" type="number" min={1} max={20} value={topK} onChange={(e) => setTopK(e.target.value)} />
          <Button variant="primary" onClick={onRun} disabled={loading}>
            {loading ? "Asking..." : "Ask"}
          </Button>
        </div>
        {error ? <div className="empty_state">{error}</div> : null}
        {latency ? <div className="panel_subtitle">Latency: {latency} ms</div> : null}
      </Panel>
      <Panel title="Response" subtitle="Answer and citations" variant="sunken">
        {!response ? (
          <EmptyState title="No response" description="Run a query to see results." />
        ) : (
          <div className="list">
            <div>
              <strong>Answer</strong>
              <div>{response.answer}</div>
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
                {(response.sources || []).map((source, index) => (
                  <div key={`${source.chunk_id || index}`} className="list_row">
                    <div>
                      <div>{source.filename || "document"}</div>
                      <div className="panel_subtitle">{source.text || source.content || ""}</div>
                    </div>
                    <span className="badge">score {Math.round((source.score || 0) * 100)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
