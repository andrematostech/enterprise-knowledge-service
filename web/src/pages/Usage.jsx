import Panel from "../components/Panel.jsx";
import MetricCard from "../components/MetricCard.jsx";

export default function Usage({ metrics }) {
  return (
    <div className="list usage_layout">
      <Panel title="Usage" subtitle="Client-side metrics" variant="raised">
        <div className="usage_panel_body">
          <div className="metric_grid">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} label={metric.label} value={metric.value} sublabel={metric.sub} />
            ))}
          </div>
        </div>
      </Panel>
      <Panel title="Latency" subtitle="Chart placeholder" variant="sunken">
        <div className="usage_panel_body">
          <div className="chart_placeholder">Latency chart placeholder</div>
        </div>
      </Panel>
      <Panel title="Indexing" subtitle="Ingestion history" variant="sunken">
        <div className="usage_panel_body">
          <div className="chart_placeholder">Ingestion chart placeholder</div>
        </div>
      </Panel>
    </div>
  );
}
