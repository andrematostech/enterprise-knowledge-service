import { cx } from "../lib/classnames.js";

export default function Panel({ title, subtitle, action, variant = "raised", className, children }) {
  return (
    <section className={cx("panel", `panel--${variant}`, className)}>
      {title ? (
        <div className="panel_header">
          <div>
            <div className="panel_title">{title}</div>
            {subtitle ? <div className="panel_subtitle">{subtitle}</div> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
