import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadFile } from "../api";

const SOURCES = [
  {
    id: "sap",
    label: "SAP Export",
    scope: "Scope 1",
    scopeClass: "s1",
    description: "Fuel & procurement data from SAP flat-file or IDoc export",
    accepts: { "text/csv": [".csv"], "text/plain": [".txt"], "application/xml": [".xml"] },
    acceptLabel: ".csv  .txt  .xml",
    hints: [
      "SAP ME21N / MB51 flat-file exports",
      "IDoc MATDOC or custom BAPI extract",
      "Expects: plant code, material, quantity, unit, posting date",
    ],
  },
  {
    id: "utility",
    label: "Utility Bill",
    scope: "Scope 2",
    scopeClass: "s2",
    description: "Electricity data from utility portal CSV export",
    accepts: { "text/csv": [".csv"], "application/pdf": [".pdf"] },
    acceptLabel: ".csv  .pdf",
    hints: [
      "Portal CSV export (Green Button, ESPI format preferred)",
      "PDF utility invoices also accepted",
      "Expects: meter ID, billing period start/end, kWh consumed, tariff",
    ],
  },
  {
    id: "travel",
    label: "Travel Data",
    scope: "Scope 3",
    scopeClass: "s3",
    description: "Flights, hotels, and ground transport from Concur / Navan",
    accepts: { "text/csv": [".csv"], "application/json": [".json"] },
    acceptLabel: ".csv  .json",
    hints: [
      "Concur Travel & Expense CSV export",
      "Navan API JSON response or manual export",
      "Expects: traveler ID, trip type, origin, destination, travel date",
    ],
  },
];

function UploadZone({ source, onUploaded }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [jobId, setJobId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: source.accepts,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setProgress(0);
    setErrorMsg("");
    try {
      const res = await uploadFile(source.id, file, setProgress);
      setJobId(res.data.job_id);
      setStatus("success");
      onUploaded && onUploaded(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Upload failed. Check file format and try again.");
      setStatus("error");
    }
  };

  const reset = () => {
    setFile(null);
    setProgress(0);
    setStatus("idle");
    setJobId(null);
    setErrorMsg("");
  };

  return (
    <div className={`upload-card ${status === "success" ? "upload-success" : ""}`}>
      <div className="upload-card-header">
        <div>
          <span className={`scope-badge ${source.scopeClass}`}>{source.scope}</span>
          <h3>{source.label}</h3>
          <p className="upload-desc">{source.description}</p>
        </div>
      </div>

      <div className="upload-hints">
        {source.hints.map((h, i) => (
          <div key={i} className="hint-row">
            <span className="hint-dot" />
            <span>{h}</span>
          </div>
        ))}
      </div>

      {status === "success" ? (
        <div className="upload-done">
          <div className="upload-done-icon">✓</div>
          <div>
            <strong>Ingestion job queued</strong>
            <div className="job-id">Job ID: {jobId}</div>
            <div className="upload-done-sub">Records will appear in the Review Dashboard once processing completes.</div>
          </div>
          <button className="btn-ghost btn-sm" onClick={reset}>Upload another</button>
        </div>
      ) : (
        <>
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? "dropzone-active" : ""} ${file ? "dropzone-has-file" : ""}`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="dropzone-file-info">
                <span className="file-icon">📄</span>
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ) : (
              <div className="dropzone-placeholder">
                <div className="drop-icon">↑</div>
                <div>
                  {isDragActive ? "Drop it here" : "Drag & drop or click to browse"}
                </div>
                <div className="drop-accepts">{source.acceptLabel}</div>
              </div>
            )}
          </div>

          {status === "uploading" && (
            <div className="progress-bar-wrap">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
              <span className="progress-label">{progress}%</span>
            </div>
          )}

          {status === "error" && (
            <div className="upload-error">{errorMsg}</div>
          )}

          <div className="upload-actions">
            {file && status !== "uploading" && (
              <button className="btn-ghost btn-sm" onClick={() => setFile(null)}>
                Clear
              </button>
            )}
            <button
              className="btn-primary"
              onClick={handleUpload}
              disabled={!file || status === "uploading"}
            >
              {status === "uploading" ? "Uploading…" : "Upload & Ingest"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function UploadPage() {
  const [uploaded, setUploaded] = useState([]);

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Ingestion</h1>
          <p className="page-sub">Upload raw exports from each data source. Files are parsed, normalized, and queued for analyst review.</p>
        </div>
      </div>

      {uploaded.length > 0 && (
        <div className="upload-toast">
          {uploaded.length} job{uploaded.length > 1 ? "s" : ""} queued — view status in{" "}
          <a href="/jobs" className="toast-link">Ingestion Jobs</a>
        </div>
      )}

      <div className="upload-grid">
        {SOURCES.map((src) => (
          <UploadZone
            key={src.id}
            source={src}
            onUploaded={(data) => setUploaded((p) => [...p, data])}
          />
        ))}
      </div>
    </div>
  );
}
