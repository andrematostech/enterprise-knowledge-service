import { FiActivity, FiClock, FiCloud, FiCloudRain, FiDatabase, FiSearch, FiSun } from "react-icons/fi";
import Panel from "../components/Panel.jsx";
import MetricCard from "../components/MetricCard.jsx";
import Button from "../components/Button.jsx";

export default function Home({ metrics, onGoQuery, onGoDocuments, statusHint }) {
  const weeklyWeather = [
    { day: "Mon", condition: "sunny", tempC: 22, tempF: 72 },
    { day: "Tue", condition: "cloudy", tempC: 19, tempF: 66 },
    { day: "Wed", condition: "rain", tempC: 17, tempF: 63 },
    { day: "Thu", condition: "cloudy", tempC: 20, tempF: 68 },
    { day: "Fri", condition: "sunny", tempC: 24, tempF: 75 },
    { day: "Sat", condition: "rain", tempC: 18, tempF: 64 },
    { day: "Sun", condition: "sunny", tempC: 23, tempF: 73 }
  ];
  const iconMap = {
    sunny: <FiSun />,
    cloudy: <FiCloud />,
    rain: <FiCloudRain />
  };

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
      <Panel title="Weekly forecast" subtitle="Current week" variant="sunken">
        <div className="home_panel_body">
          <div className="weekly_forecast">
            {weeklyWeather.map((entry) => (
              <div key={entry.day} className="weekly_forecast_day">
                <div className="weekly_forecast_icon">
                  {iconMap[entry.condition] || <FiCloud />}
                </div>
                <div className="weekly_forecast_label">{entry.day}</div>
                <div className="weekly_forecast_temp">
                  <span>{entry.tempC}°C</span>
                  <span>{entry.tempF}°F</span>
                </div>
              </div>
            ))}
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
