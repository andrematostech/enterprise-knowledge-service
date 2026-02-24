import { cx } from "../lib/classnames.js";

export default function Toasts({ items = [], onDismiss }) {
  if (!items.length) return null;
  return (
    <div className="toast_stack">
      {items.map((toast) => (
        <button
          key={toast.id}
          className={cx("toast", `toast--${toast.type}`)}
          type="button"
          onClick={() => onDismiss(toast.id)}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
