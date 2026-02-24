export default function MetricCard({ label, value, sublabel }) {
  return (
    <div className="metric_card">
      <span className="metric_label">{label}</span>
      <span className="metric_value">{value}</span>
      {sublabel ? <span className="metric_sub">{sublabel}</span> : null}
    </div>
  );
}
