import { FiActivity, FiClock, FiDatabase, FiSearch } from "react-icons/fi";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Panel from "../components/Panel.jsx";
import MetricCard from "../components/MetricCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Table from "../components/Table.jsx";

export default function Dashboard({
  metrics,
  queryVolume,
  queryRange,
  onQueryRangeChange,
  queryVolumeEmpty,
  queryVolumeLoading,
  retrievalSnapshot,
  recentQueries,
  recentIngests,
  recentQueriesEmpty,
  recentIngestsEmpty
}) {
  const iconMap = {
    "Docs Indexed": <FiDatabase />,
    "Queries (7d)": <FiSearch />,
    "Avg Latency": <FiActivity />,
    "Last Ingest": <FiClock />
  };

  return (
    <div className="dashboard_layout">
      <div className="dashboard_section">
        <div className="dashboard_section_header">
          <div>
            <div className="panel_title">System pulse</div>
            <div className="panel_subtitle">Workspace overview</div>
          </div>
        </div>
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
      </div>

      <div className="dashboard_section dashboard_row">
        <Panel
          title="Query volume"
          subtitle={`Last ${queryRange}`}
          variant="sunken"
          action={
            <div className="segmented_control">
              {["7d", "30d"].map((range) => (
                <button
                  key={range}
                  className={`segmented_button ${range === queryRange ? "is-active" : ""}`}
                  type="button"
                  onClick={() => onQueryRangeChange?.(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          }
        >
          {queryVolumeLoading ? (
            <div className="chart_placeholder">Loading telemetry…</div>
          ) : queryVolumeEmpty ? (
            <EmptyState title="Select a knowledge base" subtitle="Choose a workspace to view telemetry." />
          ) : queryVolume?.length ? (
            <div className="chart_panel">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={queryVolume}>
                  <defs>
                    <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-9)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--accent-9)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface-3)", border: "1px solid var(--stroke-1)" }}
                    labelStyle={{ color: "var(--text-2)" }}
                    formatter={(value, _name, props) => [
                      `${value} queries`,
                      `Avg ${props?.payload?.avg_latency_ms ?? "-"} ms`
                    ]}
                  />
                  <Area type="monotone" dataKey="count" stroke="var(--accent-9)" fill="url(#volumeFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="Connect telemetry" subtitle="Run queries to populate this chart." />
          )}
        </Panel>
        <Panel title="Retrieval snapshot" subtitle="Runtime configuration" variant="sunken">
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

      <div className="dashboard_section dashboard_tables">
        <Panel title="Recent queries" subtitle="Latest activity" variant="sunken">
          {recentQueries?.length ? (
            <Table
              columns={[
                { key: "question", label: "Query" },
                { key: "latency", label: "Latency" },
                { key: "time", label: "Time" }
              ]}
              rows={recentQueries}
            />
          ) : recentQueriesEmpty ? (
            <EmptyState title="Select a knowledge base" subtitle="Choose a workspace to view queries." />
          ) : (
            <EmptyState title="No queries yet" subtitle="Run your first query to populate history." />
          )}
        </Panel>
        <Panel title="Recent ingests" subtitle="Pipeline runs" variant="sunken">
          {recentIngests?.length ? (
            <Table
              columns={[
                { key: "status", label: "Status" },
                { key: "chunks", label: "Chunks" },
                { key: "time", label: "Finished" }
              ]}
              rows={recentIngests}
            />
          ) : recentIngestsEmpty ? (
            <EmptyState title="Select a knowledge base" subtitle="Choose a workspace to view ingests." />
          ) : (
            <EmptyState title="No ingests yet" subtitle="Ingest documents to populate history." />
          )}
        </Panel>
      </div>
    </div>
  );
}
