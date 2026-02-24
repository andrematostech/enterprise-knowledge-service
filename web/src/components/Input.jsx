import { cx } from "../lib/classnames.js";

export default function Input({ label, className, ...props }) {
  return (
    <label className={cx("field", className)}>
      {label ? <span className="field_label">{label}</span> : null}
      <input className="input" {...props} />
    </label>
  );
}
