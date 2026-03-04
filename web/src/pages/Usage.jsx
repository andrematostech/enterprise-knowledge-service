import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Panel from "../components/Panel.jsx";
import MetricCard from "../components/MetricCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { formatDateTime } from "../lib/format.js";

export default function Usage({
  metrics,
  recentQueriesRaw,
  recentIngestsRaw,
  retrievalSnapshot = [],
  recentQueries = []
}) {
  const [activeView, setActiveView] = useState("usage");

  const recentQueriesList = (recentQueriesRaw || []).map((item) => ({
    question: item.query_text?.slice(0, 48) || "-",
    latency: item.latency_ms ? `${item.latency_ms} ms` : "-",
    time: item.created_at ? formatDateTime(item.created_at) : "-"
  }));

  const latencySeries = (recentQueriesRaw || [])
    .map((item) => ({
      time: item.created_at ? formatDateTime(item.created_at) : "-",
      latency: item.latency_ms ?? 0
    }))
    .reverse();

  const ingestSeries = (recentIngestsRaw || [])
    .map((item) => ({
      time: item.finished_at ? formatDateTime(item.finished_at) : formatDateTime(item.created_at),
      chunks: item.chunks_created ?? 0
    }))
    .reverse();

  return (
    <div className="list usage_layout">
      <div className="usage_toggle segmented_control">
        <button
          className={`segmented_button ${activeView === "usage" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveView("usage")}
        >
          Usage
        </button>
        <button
          className={`segmented_button ${activeView === "retrieval" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveView("retrieval")}
        >
          Retrieval
        </button>
      </div>

      {activeView === "usage" ? (
        <>
          <Panel title="Usage" subtitle="Client-side metrics" variant="raised">
            <div className="usage_panel_body">
              <div className="metric_grid">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} label={metric.label} value={metric.value} sublabel={metric.sub} />
                ))}
              </div>
            </div>
          </Panel>
          <Panel title="Latency" subtitle="Recent queries" variant="sunken">
            <div className="usage_panel_body">
              {latencySeries.length ? (
                <div className="chart_panel">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={latencySeries}>
                      <defs>
                        <linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent-9)" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="var(--accent-9)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={52}
                        domain={[0, 12000]}
                        ticks={[0, 3000, 6000, 9000, 12000]}
                        tickMargin={6}
                      />
                      <Tooltip
                        contentStyle={{ background: "var(--surface-3)", border: "1px solid var(--stroke-1)" }}
                        labelStyle={{ color: "var(--text-2)" }}
                        formatter={(value) => [`${value} ms`, "Latency"]}
                      />
                      <Area type="monotone" dataKey="latency" stroke="var(--accent-9)" fill="url(#latencyFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState title="No latency data yet" subtitle="Run queries to populate latency telemetry." />
              )}
              {recentQueriesList.length ? (
                <div className="list">
                  {recentQueriesList.map((item, index) => (
                    <div key={`${item.question}-${index}`} className="list_row">
                      <div>
                        <strong>{item.question}</strong>
                        <div className="panel_subtitle">{item.time}</div>
                      </div>
                      <div className="panel_subtitle">{item.latency}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No recent queries" subtitle="Run a query to see activity." />
              )}
            </div>
          </Panel>
          <Panel title="Indexing" subtitle="Ingestion history" variant="sunken">
            <div className="usage_panel_body">
              {ingestSeries.length ? (
                <div className="chart_panel">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ingestSeries}>
                      <defs>
                        <linearGradient id="ingestFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent-7)" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="var(--accent-7)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={52}
                        domain={[0, 12000]}
                        ticks={[0, 3000, 6000, 9000, 12000]}
                        tickMargin={6}
                      />
                      <Tooltip
                        contentStyle={{ background: "var(--surface-3)", border: "1px solid var(--stroke-1)" }}
                        labelStyle={{ color: "var(--text-2)" }}
                        formatter={(value) => [`${value} chunks`, "Chunks"]}
                      />
                      <Area type="monotone" dataKey="chunks" stroke="var(--accent-7)" fill="url(#ingestFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState title="No indexing data yet" subtitle="Run ingestion to populate history." />
              )}
              {recentIngestsRaw?.length ? (
                <table className="table usage_table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Chunks</th>
                      <th>Finished</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentIngestsRaw.map((run, index) => (
                      <tr key={`${run.finished_at || run.created_at}-${index}`}>
                        <td>{run.status || "-"}</td>
                        <td>{run.chunks_created ?? "-"}</td>
                        <td>{run.finished_at ? formatDateTime(run.finished_at) : formatDateTime(run.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState title="No ingestion history" subtitle="Ingest documents to see history." />
              )}
            </div>
          </Panel>
        </>
      ) : (
        <Panel title="Retrieval" subtitle="Index diagnostics" variant="sunken" className="retrieval_panel">
          <div className="retrieval_panel_body">
            <div className="retrieval_summary">
              {retrievalSnapshot.map((item) => (
                <div key={item.label} className="retrieval_summary_row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            <div className="retrieval_recent">
              <div className="panel_title">Recent queries</div>
              {recentQueries.length ? (
                <div className="list">
                  {recentQueries.map((item, index) => (
                    <div key={`${item.question}-${index}`} className="list_row">
                      <div>
                        <strong>{item.question}</strong>
                        <div className="panel_subtitle">{item.time}</div>
                      </div>
                      <div className="panel_subtitle">{item.latency}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No retrieval activity" subtitle="Run a query to populate retrieval metrics." />
              )}
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
