import { useState } from "react";
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
  runs = [],
  search,
  setSearch,
  lastIngestAt,
  disabled,
  fileInputRef
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeView, setActiveView] = useState("files");

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

  return (
    <div className="documents_layout">
      <Panel
        title="Documents"
        subtitle="Upload, review, and ingest your knowledge base files."
        action={
          <div className="documents_actions">
            <span className="status_pill status_pill--subtle">Last indexed: {lastIngestAt || "-"}</span>
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
    </div>
  );
}
