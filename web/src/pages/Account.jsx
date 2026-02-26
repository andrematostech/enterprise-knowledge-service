import Panel from "../components/Panel.jsx";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import { formatDateTime } from "../lib/format.js";

export default function Account({
  currentUser,
  adminUsers,
  adminUsersLoading,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  showLoginPassword,
  onToggleLoginPassword,
  registerEmail,
  setRegisterEmail,
  registerPassword,
  setRegisterPassword,
  showRegisterPassword,
  onToggleRegisterPassword,
  registerName,
  setRegisterName,
  registerPosition,
  setRegisterPosition,
  registerAvatarPreview,
  onRegisterAvatar,
  onLogin,
  onRegister,
  onLogout,
  onDeleteAccount,
  onDeleteUser,
  onToggleAdmin,
  onRefreshUsers,
  loading
}) {
  return (
    <div className="grid_two account_layout">
      {currentUser ? (
        <Panel title="Account" subtitle="Your profile details." variant="raised">
          <div className="account_panel_body">
            <div className="account_profile_header">
              <div className="avatar">
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="Avatar" />
                ) : (
                  (currentUser.full_name || currentUser.email || "?")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()
                )}
              </div>
              <div className="account_profile_meta">
                <div className="panel_title">{currentUser.full_name || "Account"}</div>
                <div className="panel_subtitle">{currentUser.email}</div>
              </div>
            </div>
            <Input label="Full name" value={currentUser.full_name || ""} readOnly />
            <Input label="Position" value={currentUser.position || ""} readOnly />
            <Input label="Email" value={currentUser.email || ""} readOnly />
            <Input label="Role" value={currentUser.is_admin ? "Admin" : "Member"} readOnly />
            <Input label="Created" value={formatDateTime(currentUser.created_at)} readOnly />
            <Button variant="ghost" onClick={onLogout}>Log out</Button>
            {currentUser.is_admin || (adminUsers?.length && adminUsers.every((user) => !user.is_admin)) ? (
              <>
                <Button variant="ghost" onClick={onDeleteAccount}>Delete account</Button>
                <div className="account_admin_header">
                  <div>
                    <div className="panel_title">All users</div>
                    <div className="panel_subtitle">Manage registered accounts.</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onRefreshUsers} disabled={adminUsersLoading}>
                    {adminUsersLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
                <div className="list">
                  {(adminUsers || []).map((user) => (
                    <div key={user.id} className="list_row account_user_row">
                      <div>
                        <div>{user.full_name || user.email}</div>
                        <div className="panel_subtitle">{user.email}</div>
                      </div>
                      <div className="account_user_actions">
                        <span className="badge">{user.is_admin ? "Admin" : "Member"}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleAdmin(user.id, !user.is_admin)}
                        >
                          {user.is_admin ? "Remove admin" : "Make admin"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDeleteUser(user.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </Panel>
      ) : (
        <Panel title="Login" subtitle="Access your account." variant="raised">
          <div className="account_panel_body">
            <Input label="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            <label className="field">
              <span className="field_label">Password</span>
              <div className="account_inline">
                <input
                  className="input"
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <Button variant="ghost" size="sm" onClick={onToggleLoginPassword}>Show</Button>
              </div>
            </label>
            <Button variant="primary" onClick={onLogin} disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>
          </div>
        </Panel>
      )}
      <Panel title="Register" subtitle="Create a new account." variant="raised">
        <div className="account_panel_body">
          <Input label="Full name" value={registerName} onChange={(e) => setRegisterName(e.target.value)} />
          <Input label="Position" value={registerPosition} onChange={(e) => setRegisterPosition(e.target.value)} />
          <label className="field">
            <span className="field_label">Avatar photo</span>
            <input className="input" type="file" accept="image/*" onChange={onRegisterAvatar} />
          </label>
          {registerAvatarPreview ? (
            <div className="panel_subtitle">Avatar ready</div>
          ) : null}
          <Input label="Email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} />
          <label className="field">
            <span className="field_label">Password</span>
            <div className="account_inline">
              <input
                className="input"
                type={showRegisterPassword ? "text" : "password"}
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
              />
              <Button variant="ghost" size="sm" onClick={onToggleRegisterPassword}>Show</Button>
            </div>
          </label>
          <Button variant="primary" onClick={onRegister} disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
