import { FiActivity, FiClock, FiDatabase, FiSearch } from "react-icons/fi";
import Panel from "../components/Panel.jsx";
import MetricCard from "../components/MetricCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Table from "../components/Table.jsx";

export default function Dashboard({
  metrics,
  queryVolume,
  retrievalSnapshot,
  recentQueries,
  recentIngests
}) {
  const iconMap = {
    "Docs Indexed": <FiDatabase />,
    "Queries (7d)": <FiSearch />,
    "Avg Latency": <FiActivity />,
    "Last Ingest": <FiClock />
  };

  return (
    <div className="dashboard_layout">
      <Panel title="Overview" subtitle="Workspace pulse" variant="raised">
        <div className="dashboard_metrics">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              sublabel={metric.sub}
              icon={iconMap[metric.label]}
            />
          ))}
        </div>
      </Panel>

      <div className="dashboard_row">
        <Panel title="Query volume" subtitle="Last 7 days" variant="sunken">
          {queryVolume?.length ? (
            <div className="chart_placeholder">Chart placeholder</div>
          ) : (
            <EmptyState title="Connect telemetry" subtitle="Wire analytics to visualize query volume." />
          )}
        </Panel>
        <Panel title="Retrieval snapshot" subtitle="Current configuration" variant="sunken">
          <div className="list">
            {retrievalSnapshot.map((row) => (
              <div key={row.label} className="list_row">
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="dashboard_tables">
        <Panel title="Recent queries" subtitle="Latest questions" variant="sunken">
          {recentQueries?.length ? (
            <Table
              columns={[
                { key: "question", label: "Question" },
                { key: "latency", label: "Latency" },
                { key: "time", label: "Time" }
              ]}
              rows={recentQueries}
            />
          ) : (
            <EmptyState title="No queries yet" subtitle="Run your first query to populate history." />
          )}
        </Panel>
        <Panel title="Recent ingests" subtitle="Latest runs" variant="sunken">
          {recentIngests?.length ? (
            <Table
              columns={[
                { key: "name", label: "Document" },
                { key: "status", label: "Status" },
                { key: "time", label: "Time" }
              ]}
              rows={recentIngests}
            />
          ) : (
            <EmptyState title="No ingests yet" subtitle="Ingest documents to populate history." />
          )}
        </Panel>
      </div>
    </div>
  );
}
