import Panel from "../components/Panel.jsx";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import Select from "../components/Select.jsx";

export default function Settings({
  baseUrl,
  apiKey,
  onBaseUrl,
  onApiKey,
  kbItems,
  kbId,
  onKbSelect,
  kbLoading,
  kbError,
  onRefreshKb,
  kbName,
  kbDescription,
  onKbName,
  onKbDescription,
  onCreateKb,
  kbCreating,
  healthStatus,
  healthLoading,
  onHealthCheck
}) {
  return (
    <div className="list">
      <Panel
        title="Connection"
        subtitle="Point the console to the correct API and knowledge base."
        action={
          <Button variant="secondary" size="sm" onClick={onHealthCheck} disabled={healthLoading}>
            {healthLoading ? "Testing..." : "Test connection"}
          </Button>
        }
      >
        <div className="status_pill">Status: {healthStatus}</div>
        <div className="grid_two">
          <Input label="API base URL" value={baseUrl} onChange={(e) => onBaseUrl(e.target.value)} />
          <Input label="X-API-Key" value={apiKey} onChange={(e) => onApiKey(e.target.value)} />
        </div>
      </Panel>

      <Panel
        title="Knowledge Bases"
        subtitle="Select an existing knowledge base or create a new one."
        action={
          <Button variant="ghost" size="sm" onClick={onRefreshKb} disabled={kbLoading}>
            {kbLoading ? "Refreshing..." : "Refresh"}
          </Button>
        }
      >
        <Select
          label="Active knowledge base"
          value={kbId}
          onChange={(e) => onKbSelect(e.target.value)}
          options={[{ value: "", label: "Select knowledge base" }, ...kbItems]}
        />
        {kbError ? <div className="panel_subtitle">{kbError}</div> : null}
        <Input label="Knowledge base ID" value={kbId} readOnly />
        <div className="nav_divider" />
        <Input label="Name" value={kbName} onChange={(e) => onKbName(e.target.value)} placeholder="Finance KB" />
        <Input label="Description" value={kbDescription} onChange={(e) => onKbDescription(e.target.value)} placeholder="Policies and reports" />
        <Button variant="primary" onClick={onCreateKb} disabled={kbCreating || !kbName.trim()}>
          {kbCreating ? "Creating..." : "Create knowledge base"}
        </Button>
      </Panel>
    </div>
  );
}
