import { FiBell, FiMenu, FiMoon, FiSearch, FiSidebar, FiSun, FiUser } from "react-icons/fi";
import Button from "./Button.jsx";
import Select from "./Select.jsx";

export default function Topbar({
  title,
  brandLogo,
  workspaceLabel,
  workspaceItems,
  workspaceValue,
  onWorkspaceChange,
  searchValue,
  onSearchChange,
  onAlerts,
  alertsActive,
  avatar,
  initials,
  onMobileMenu,
  onSystemDrawer,
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
        {brandLogo ? <img className="topbar_logo" src={brandLogo} alt="Logo" /> : null}
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
          <span className="topbar_search_icon" aria-hidden="true">
            <FiSearch />
          </span>
          <input
            className="input topbar_search_input"
            placeholder="Search"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
        </div>
        <button
          className={`topbar_icon_button ${alertsActive ? "topbar_icon_button--alert" : ""}`}
          type="button"
          onClick={onAlerts}
          aria-label="Alerts"
        >
          <FiBell />
        </button>
        {onSystemDrawer ? (
          <button
            className="topbar_icon_button topbar_system_button"
            type="button"
            onClick={onSystemDrawer}
            aria-label="System"
          >
            <FiSidebar />
          </button>
        ) : null}
        {onToggleTheme ? (
          <button
            className={`theme_pill ${themeMode === "light" ? "is-light" : "is-dark"}`}
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            <span className="theme_pill_track" />
            <span className="theme_pill_thumb">
              {themeMode === "light" ? <FiSun /> : <FiMoon />}
            </span>
          </button>
        ) : null}
        <button className="avatar avatar_button" type="button" aria-label="User menu">
          {avatar ? <img src={avatar} alt="Avatar" /> : initials ? initials : <FiUser /> }
        </button>
      </div>
    </header>
  );
}
