import { cx } from "../lib/classnames.js";

export default function Input({ label, className, icon, ...props }) {
  return (
    <label className={cx("field", className, icon ? "field--icon" : "")}>
      {label ? <span className="field_label">{label}</span> : null}
      <span className="input_wrap">
        {icon ? <span className="input_icon" aria-hidden="true">{icon}</span> : null}
        <input className={cx("input", icon ? "input--with-icon" : "")} {...props} />
      </span>
    </label>
  );
}
