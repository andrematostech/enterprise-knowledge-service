import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { cx } from "../lib/classnames.js";

export default function Sidebar({
  brand,
  navItems,
  activeId,
  onSelect,
  collapsed,
  onToggle,
  account,
  isOpen,
  footerAction
}) {
  return (
    <aside className={cx("sidebar", { "is-open": isOpen })}>
      <div className="sidebar_header">
        <div className="brand">
          {brand?.logo ? <img className="brand_logo" src={brand.logo} alt="Kivo logo" /> : null}
          {!collapsed ? <span>{brand?.label || "KIVO"}</span> : null}
        </div>
        <button className="sidebar_toggle" type="button" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>
      <nav className="sidebar_nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={cx("nav_item", { active: activeId === item.id })}
            type="button"
            onClick={() => onSelect(item.id)}
          >
            {item.icon}
            {!collapsed ? <span>{item.label}</span> : null}
          </button>
        ))}
      </nav>
      <div className="sidebar_footer">
        {footerAction ? (
          <button
            className={cx("nav_item", { active: activeId === footerAction.id })}
            type="button"
            onClick={() => onSelect(footerAction.id)}
          >
            {footerAction.icon}
            {!collapsed ? <span>{footerAction.label}</span> : null}
          </button>
        ) : (
          <button
            className="sidebar_profile sidebar_profile_button"
            type="button"
            onClick={() => onSelect("account")}
          >
            <div className="avatar">
              {account?.avatar ? <img src={account.avatar} alt="Avatar" /> : account?.initials || "?"}
            </div>
            {!collapsed ? (
              <div className="meta">
                <span>{account?.name || "Account"}</span>
                <span>{account?.subtitle || ""}</span>
              </div>
            ) : null}
          </button>
        )}
      </div>
    </aside>
  );
}
