export default function MetricCard({ label, value, sublabel, icon }) {
  return (
    <div className="metric_card">
      <div className="metric_header">
        {icon ? <span className="metric_icon">{icon}</span> : null}
        <span className="metric_label">{label}</span>
      </div>
      <span className="metric_value">{value}</span>
      {sublabel ? <span className="metric_sub">{sublabel}</span> : null}
    </div>
  );
}
