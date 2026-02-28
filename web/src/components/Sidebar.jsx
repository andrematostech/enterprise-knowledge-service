import { FiChevronLeft, FiChevronRight, FiUser } from "react-icons/fi";
import { cx } from "../lib/classnames.js";

export default function Sidebar({
  brand,
  navGroups,
  activeId,
  onSelect,
  collapsed,
  onToggle,
  account,
  isOpen,
  utilitiesAction
}) {
  return (
    <aside className={cx("sidebar", { "is-open": isOpen, "is-collapsed": collapsed })}>
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
        {navGroups.map((group) => (
          <div key={group.id} className="sidebar_group">
            <div className="sidebar_group_items">
              {group.items.map((item) => (
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
            </div>
          </div>
        ))}
      </nav>
      <div className="sidebar_footer">
        <div className="nav_divider" />
        {utilitiesAction ? (
          <button
            className={cx("nav_item", "utilities_button", { active: activeId === utilitiesAction.id })}
            type="button"
            onClick={utilitiesAction.onClick}
          >
            {utilitiesAction.icon}
            {!collapsed ? <span>{utilitiesAction.label}</span> : null}
          </button>
        ) : null}
        <button
          className="sidebar_profile sidebar_profile_button"
          type="button"
          onClick={() => onSelect("account")}
        >
          <div className="avatar">
            {account?.avatar ? <img src={account.avatar} alt="Avatar" /> : account?.initials ? account.initials : <FiUser /> }
          </div>
          {!collapsed ? (
            <div className="meta">
              <span>{account?.name || "Account"}</span>
              <span>{account?.subtitle || ""}</span>
            </div>
          ) : null}
        </button>
      </div>
    </aside>
  );
}
