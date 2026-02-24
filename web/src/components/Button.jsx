import { cx } from "../lib/classnames.js";

export default function Button({ variant = "secondary", size = "md", className, children, ...props }) {
  return (
    <button className={cx("btn", `btn--${variant}`, `btn--${size}`, className)} {...props}>
      {children}
    </button>
  );
}
