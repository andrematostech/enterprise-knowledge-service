import Button from "./Button.jsx";

export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty_state">
      <strong>{title}</strong>
      {description ? <div>{description}</div> : null}
      {action ? (
        <div style={{ marginTop: "12px" }}>
          <Button variant={action.variant || "primary"} size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
