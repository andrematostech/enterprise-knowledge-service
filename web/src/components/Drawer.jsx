export default function Drawer({ title, open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="drawer_overlay" role="presentation" onClick={onClose}>
      <aside
        className="drawer_panel"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer_header">
          <div className="panel_title">{title}</div>
          <button className="btn btn--ghost btn--sm" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="drawer_body">{children}</div>
      </aside>
    </div>
  );
}
