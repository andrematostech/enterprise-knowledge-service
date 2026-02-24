import Panel from "../components/Panel.jsx";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { formatDateTime, formatFileType } from "../lib/format.js";

export default function Documents({
  documents,
  loading,
  error,
  onUploadFiles,
  onDelete,
  onIngest,
  uploading,
  ingesting,
  search,
  setSearch,
  lastIngestAt,
  disabled,
  fileInputRef
}) {
  return (
    <div className="documents_layout">
      <Panel
        title="Documents"
        subtitle="Upload, review, and ingest your knowledge base files."
        action={
          <div className="documents_actions">
            <Button variant="secondary" size="sm" onClick={onIngest} disabled={disabled || ingesting}>
              {ingesting ? "Ingesting..." : "Ingest"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        }
      >
        <div className="documents_panel_body">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            accept=".pdf,.doc,.docx,.txt,.md,.rtf,.csv"
            onChange={(e) => onUploadFiles(e.target.files)}
          />
          <div className="documents_filters">
            <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents" />
            <div className="status_pill">Last indexed: {lastIngestAt || "-"}</div>
          </div>
          {error ? <div className="empty_state">{error}</div> : null}
          {loading ? (
            <EmptyState title="Loading documents" description="Please wait while we fetch your files." />
          ) : documents.length ? (
            <div className="list">
              {documents.map((doc) => (
                <div key={doc.key} className="list_row">
                  <div>
                    <strong>{doc.name}</strong>
                    <div className="panel_subtitle">{doc.status || "Ready"} - {formatDateTime(doc.createdAt)}</div>
                  </div>
                  <div className="documents_meta">
                    <span className="badge">{formatFileType(doc.name)}</span>
                    <span className="panel_subtitle">{doc.chunks} chunks</span>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(doc.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No documents yet" description="Upload files to start building your knowledge base." />
          )}
        </div>
      </Panel>
    </div>
  );
}
