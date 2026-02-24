import { FiActivity, FiClock, FiDatabase, FiSearch } from "react-icons/fi";
import Panel from "../components/Panel.jsx";
import MetricCard from "../components/MetricCard.jsx";
import Button from "../components/Button.jsx";

export default function Home({ metrics, onGoQuery, onGoDocuments, statusHint }) {
  return (
    <div className="home_layout">
      <Panel title="Overview" subtitle="Workspace pulse" variant="raised">
        <div className="home_panel_body">
          <div className="metric_grid metric_grid--compact">
            {metrics.map((metric) => {
              const iconMap = {
                Documents: <FiDatabase />,
                Queries: <FiSearch />,
                "Last indexed": <FiClock />,
                Latency: <FiActivity />
              };
              return (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  sublabel={metric.sub}
                  icon={iconMap[metric.label]}
                />
              );
            })}
          </div>
        </div>
      </Panel>
      <Panel title="Quick actions" subtitle={statusHint} variant="sunken">
        <div className="home_panel_body">
          <div className="home_actions">
            <Button variant="primary" onClick={onGoQuery}>Ask a question</Button>
            <Button variant="secondary" onClick={onGoDocuments}>Upload documents</Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
