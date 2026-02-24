import Panel from "../components/Panel.jsx";
import MetricCard from "../components/MetricCard.jsx";

export default function Usage({ metrics }) {
  return (
    <div className="list">
      <Panel title="Usage" subtitle="Client-side metrics" variant="raised">
        <div className="metric_grid">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} sublabel={metric.sub} />
          ))}
        </div>
      </Panel>
      <Panel title="Latency" subtitle="Chart placeholder" variant="sunken">
        <div className="chart_placeholder">Latency chart placeholder</div>
      </Panel>
      <Panel title="Indexing" subtitle="Ingestion history" variant="sunken">
        <div className="chart_placeholder">Ingestion chart placeholder</div>
      </Panel>
    </div>
  );
}
