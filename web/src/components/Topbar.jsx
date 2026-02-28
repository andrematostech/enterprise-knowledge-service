import { FiBell, FiMenu, FiUser } from "react-icons/fi";
import Button from "./Button.jsx";
import Select from "./Select.jsx";

export default function Topbar({
  title,
  workspaceLabel,
  workspaceItems,
  workspaceValue,
  onWorkspaceChange,
  searchValue,
  onSearchChange,
  onAlerts,
  avatar,
  initials,
  onMobileMenu,
  themeMode,
  onToggleTheme
}) {
  return (
    <header className="topbar">
      <div className="topbar_left">
        {onMobileMenu ? (
          <Button className="topbar_menu_button" variant="ghost" size="sm" onClick={onMobileMenu}>
            <FiMenu />
          </Button>
        ) : null}
        <div className="page_title">{title}</div>
      </div>
      <div className="topbar_right">
        {workspaceItems?.length ? (
          <Select
            className="workspace_select"
            label={workspaceLabel}
            value={workspaceValue}
            onChange={onWorkspaceChange}
            options={workspaceItems}
          />
        ) : null}
        <div className="topbar_search">
          <input
            className="input"
            placeholder="Search"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
        </div>
        <button className="topbar_icon_button" type="button" onClick={onAlerts} aria-label="Alerts">
          <FiBell />
        </button>
        {onToggleTheme ? (
          <button
            className={`theme_pill ${themeMode === "light" ? "is-light" : "is-dark"}`}
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            <span className="theme_pill_track" />
            <span className="theme_pill_thumb" />
          </button>
        ) : null}
        <button className="avatar avatar_button" type="button" aria-label="User menu">
          {avatar ? <img src={avatar} alt="Avatar" /> : initials ? initials : <FiUser /> }
        </button>
      </div>
    </header>
  );
}
