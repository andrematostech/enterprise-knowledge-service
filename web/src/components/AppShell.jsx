import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import RightRail from "./RightRail.jsx";
import Toasts from "./Toasts.jsx";

export default function AppShell({
  sidebarProps,
  topbarProps,
  rightRailProps,
  children,
  toasts,
  onDismissToast,
  sidebarOpen,
  onCloseSidebar
}) {
  const layoutClass = rightRailProps ? "app_shell" : "app_shell app_shell--no-rail";
  return (
    <div className={layoutClass}>
      {sidebarOpen ? <div className="sidebar_overlay" onClick={onCloseSidebar} role="presentation" /> : null}
      <Sidebar {...sidebarProps} isOpen={sidebarOpen} />
      {rightRailProps ? (
        <div className="main_layout">
          <Topbar {...topbarProps} />
          <div className="main_column">
            <div className="content_scroll">{children}</div>
          </div>
          <RightRail {...rightRailProps} />
        </div>
      ) : (
        <div className="main_column">
          <Topbar {...topbarProps} />
          <div className="content_scroll">{children}</div>
        </div>
      )}
      <Toasts items={toasts} onDismiss={onDismissToast} />
    </div>
  );
}
