import { FiMenu, FiMoon, FiSun } from "react-icons/fi";
import Button from "./Button.jsx";
import Select from "./Select.jsx";

export default function Topbar({
  title,
  workspaceLabel,
  workspaceItems,
  workspaceValue,
  onWorkspaceChange,
  actions,
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
        {actions?.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ))}
        {onToggleTheme ? (
          <Button
            className="theme_toggle"
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {themeMode === "light" ? <FiMoon /> : <FiSun />}
          </Button>
        ) : null}
        <div className="avatar">
          {avatar ? <img src={avatar} alt="Avatar" /> : initials || "?"}
        </div>
      </div>
    </header>
  );
}
