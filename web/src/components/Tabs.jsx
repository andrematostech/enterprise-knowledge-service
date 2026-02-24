import { cx } from "../lib/classnames.js";

export default function Tabs({ items, value, onChange }) {
  return (
    <div className="filter_tabs">
      {items.map((item) => (
        <button
          key={item.value}
          className={cx("filter_tab", { active: value === item.value })}
          type="button"
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
