import Panel from "../components/Panel.jsx";
import MetricCard from "../components/MetricCard.jsx";
import Button from "../components/Button.jsx";

export default function Home({ metrics, onGoQuery, onGoDocuments, statusHint }) {
  return (
    <div className="home_layout">
      <Panel title="Overview" subtitle="Workspace pulse" variant="raised">
        <div className="metric_grid">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} sublabel={metric.sub} />
          ))}
        </div>
      </Panel>
      <Panel title="Quick actions" subtitle={statusHint} variant="sunken">
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Button variant="primary" onClick={onGoQuery}>Ask a question</Button>
          <Button variant="secondary" onClick={onGoDocuments}>Upload documents</Button>
        </div>
      </Panel>
    </div>
  );
}
