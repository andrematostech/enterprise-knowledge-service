import { cx } from "../lib/classnames.js";

export default function Select({ label, options = [], className, ...props }) {
  return (
    <label className={cx("field", className)}>
      {label ? <span className="field_label">{label}</span> : null}
      <select className="select" {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
