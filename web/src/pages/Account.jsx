import Panel from "../components/Panel.jsx";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";

export default function Account({
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
  loading
}) {
  return (
    <div className="grid_two">
      <Panel title="Login" subtitle="Access your account." variant="raised">
        <Input label="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
        <label className="field">
          <span className="field_label">Password</span>
          <div style={{ display: "flex", gap: "8px" }}>
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
      </Panel>
      <Panel title="Register" subtitle="Create a new account." variant="raised">
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
          <div style={{ display: "flex", gap: "8px" }}>
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
      </Panel>
    </div>
  );
}
