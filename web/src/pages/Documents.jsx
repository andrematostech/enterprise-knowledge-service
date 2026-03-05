import { useState } from "react";
import { FiSearch } from "react-icons/fi";
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
  onRegisterDocument,
  onDelete,
  onIngest,
  uploading,
  ingesting,
  ingestProgress,
  registering,
  runs = [],
  search,
  setSearch,
  lastIngestAt,
  disabled,
  fileInputRef
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeView, setActiveView] = useState("files");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerPath, setRegisterPath] = useState("");
  const [registerFilename, setRegisterFilename] = useState("");
  const [registerType, setRegisterType] = useState("text/csv");
  const [registerError, setRegisterError] = useState("");

  const canUpload = activeView === "files";

  const handleDragOver = (event) => {
    if (!canUpload || disabled || uploading) return;
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (!canUpload || disabled || uploading) return;
    const files = event.dataTransfer.files;
    if (files && files.length) {
      onUploadFiles(files);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!registerPath.trim()) {
      setRegisterError("Relative path is required.");
      return;
    }
    setRegisterError("");
    const ok = await onRegisterDocument?.({
      relativePath: registerPath.trim(),
      filename: registerFilename.trim() || undefined,
      contentType: registerType
    });
    if (ok) {
      setRegisterOpen(false);
      setRegisterPath("");
      setRegisterFilename("");
      setRegisterType("text/csv");
    }
  };

  return (
    <div className="documents_layout">
      <Panel
        title="Documents"
        subtitle="Manage and ingest your files."
        action={
          <div className="documents_action_stack">
            <div className="documents_actions">
              <span className="status_pill status_pill--subtle">Last indexed: {lastIngestAt || "-"}</span>
              {ingesting && ingestProgress ? (
                <span className="status_pill status_pill--subtle">
                  Ingesting: {ingestProgress.documents_processed ?? 0} docs · {ingestProgress.chunks_created ?? 0} chunks
                </span>
              ) : null}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRegisterOpen(true)}
                disabled={disabled || registering}
              >
                Register file
              </Button>
              <Button variant="secondary" size="sm" onClick={onIngest} disabled={disabled || ingesting}>
                {ingesting ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Ingesting...
                  </>
                ) : (
                  "Ingest"
                )}
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
          </div>
        }
      >
        <div
          className="documents_panel_body"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging ? (
            <div className={`documents_dropzone documents_dropzone--overlay${disabled ? " is-disabled" : ""}`}>
              <EmptyState title="Drop files to upload" description="Release to add documents." />
              <div className="documents_dropzone_hint">Drag and drop files anywhere in this panel.</div>
            </div>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            accept=".pdf,.txt,.md,.markdown,.docx,.csv,.xlsx,.tex,.pptx"
            onChange={(e) => onUploadFiles(e.target.files)}
          />

          <div className="documents_toggle segmented_control">
            <button
              className={`segmented_button ${activeView === "files" ? "is-active" : ""}`}
              type="button"
              onClick={() => setActiveView("files")}
            >
              Files
            </button>
            <button
              className={`segmented_button ${activeView === "runs" ? "is-active" : ""}`}
              type="button"
              onClick={() => setActiveView("runs")}
            >
              Runs
            </button>
          </div>

          {activeView === "files" ? (
            <>
              <div className="documents_filters">
                <Input
                  label="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents"
                  icon={<FiSearch />}
                />
              </div>
              {error ? <div className="empty_state">{error}</div> : null}
              {loading ? (
                <EmptyState title="Loading documents" description="Please wait while we fetch your files." />
              ) : documents.length ? (
                <div className="list documents_list">
                  {documents.map((doc) => (
                    <div key={doc.key} className="list_row">
                      <div>
                        <strong>{doc.name}</strong>
                        <div className="panel_subtitle">{doc.status || "Ready"} - {formatDateTime(doc.createdAt)}</div>
                      </div>
                      <div className="documents_meta">
                        <span className="badge badge--muted">{formatFileType(doc.name)}</span>
                        <span className="panel_subtitle">{doc.chunks} chunks</span>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(doc.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`documents_dropzone${isDragging ? " is-dragging" : ""}${disabled ? " is-disabled" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (!disabled && !uploading) fileInputRef.current?.click();
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <EmptyState title="No documents yet" description="Upload files to start building your knowledge base." />
                  <div className="documents_dropzone_hint">Drag and drop files here or click to browse.</div>
                </div>
              )}
            </>
          ) : runs.length ? (
            <table className="table ingestion_table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Chunks</th>
                  <th>Finished</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, index) => (
                  <tr key={`${run.time}-${index}`}>
                    <td>{run.status}</td>
                    <td>{run.chunks}</td>
                    <td>{run.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No ingests yet" subtitle="Run ingestion to see pipeline history here." />
          )}
        </div>
      </Panel>
      {registerOpen ? (
        <div className="modal_overlay" role="presentation" onClick={() => setRegisterOpen(false)}>
          <div className="modal_panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal_header">
              <div className="panel_title">Register file</div>
              <Button variant="ghost" size="sm" onClick={() => setRegisterOpen(false)}>
                Close
              </Button>
            </div>
            <div className="modal_body">
              <Input
                label="Relative path"
                value={registerPath}
                onChange={(e) => setRegisterPath(e.target.value)}
                placeholder="imports/big.csv"
              />
              <Input
                label="Filename (optional)"
                value={registerFilename}
                onChange={(e) => setRegisterFilename(e.target.value)}
                placeholder="big.csv"
              />
              <div className="field">
                <span className="field_label">Type</span>
                <select className="select" value={registerType} onChange={(e) => setRegisterType(e.target.value)}>
                  <option value="text/csv">CSV</option>
                  <option value="text/plain">TXT</option>
                </select>
              </div>
              {registerError ? <div className="panel_subtitle">{registerError}</div> : null}
              <div className="documents_actions" style={{ marginTop: "10px" }}>
                <Button variant="secondary" size="sm" onClick={() => setRegisterOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRegisterSubmit}
                  disabled={registering || disabled}
                >
                  {registering ? "Registering..." : "Register"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
