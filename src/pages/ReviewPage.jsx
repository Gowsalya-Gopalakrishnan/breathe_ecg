import { useState, useEffect, useCallback } from "react";
import { getEmissionRecords, approveRecord, rejectRecord, bulkApprove, bulkReject } from "../api";

const SCOPE_LABELS = { 1: "Scope 1", 2: "Scope 2", 3: "Scope 3" };
const SOURCE_LABELS = { sap: "SAP", utility: "Utility", travel: "Travel" };
const STATUS_META = {
  pending:   { label: "Pending",   cls: "status-pending"  },
  approved:  { label: "Approved",  cls: "status-approved" },
  rejected:  { label: "Rejected",  cls: "status-rejected" },
  flagged:   { label: "Flagged",   cls: "status-flagged"  },
};

function RejectModal({ onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Reject record</h3>
        <p>Provide a reason (required for audit trail):</p>
        <textarea
          className="modal-textarea"
          placeholder="e.g. Unit mismatch — quantity appears to be in gallons, not litres"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          autoFocus
        />
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className="btn-danger"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "pending", source_type: "", scope: "" });
  const [selected, setSelected] = useState(new Set());
  const [rejectTarget, setRejectTarget] = useState(null); // single id or "bulk"
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (filters.status) params.status = filters.status;
      if (filters.source_type) params.source_type = filters.source_type;
      if (filters.scope) params.scope = filters.scope;
      const res = await getEmissionRecords(params);
      setRecords(res.data.results || res.data);
      setTotalCount(res.data.count || res.data.length);
    } catch {
      setError("Failed to load records. Is the Django backend running?");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === records.length) setSelected(new Set());
    else setSelected(new Set(records.map((r) => r.id)));
  };

  const handleApprove = async (id) => {
    try {
      await approveRecord(id);
      fetchRecords();
    } catch { setError("Approve failed."); }
  };

  const handleReject = async (id, reason) => {
    try {
      await rejectRecord(id, reason);
      setRejectTarget(null);
      fetchRecords();
    } catch { setError("Reject failed."); }
  };

  const handleBulkApprove = async () => {
    try {
      await bulkApprove([...selected]);
      setSelected(new Set());
      fetchRecords();
    } catch { setError("Bulk approve failed."); }
  };

  const handleBulkReject = async (reason) => {
    try {
      await bulkReject([...selected], reason);
      setSelected(new Set());
      setRejectTarget(null);
      fetchRecords();
    } catch { setError("Bulk reject failed."); }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="page-root">
      {rejectTarget && (
        <RejectModal
          onConfirm={(reason) =>
            rejectTarget === "bulk"
              ? handleBulkReject(reason)
              : handleReject(rejectTarget, reason)
          }
          onCancel={() => setRejectTarget(null)}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Review Dashboard</h1>
          <p className="page-sub">Inspect normalized emission records before they are locked for audit.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select
          value={filters.status}
          onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
          className="filter-select"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={filters.source_type}
          onChange={(e) => { setFilters({ ...filters, source_type: e.target.value }); setPage(1); }}
          className="filter-select"
        >
          <option value="">All sources</option>
          <option value="sap">SAP</option>
          <option value="utility">Utility</option>
          <option value="travel">Travel</option>
        </select>

        <select
          value={filters.scope}
          onChange={(e) => { setFilters({ ...filters, scope: e.target.value }); setPage(1); }}
          className="filter-select"
        >
          <option value="">All scopes</option>
          <option value="1">Scope 1</option>
          <option value="2">Scope 2</option>
          <option value="3">Scope 3</option>
        </select>

        <button className="btn-ghost btn-sm" onClick={fetchRecords}>↻ Refresh</button>

        <div className="filter-spacer" />
        <span className="record-count">{totalCount} record{totalCount !== 1 ? "s" : ""}</span>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <span>{selected.size} selected</span>
          <button className="btn-approve btn-sm" onClick={handleBulkApprove}>
            ✓ Approve all
          </button>
          <button className="btn-danger btn-sm" onClick={() => setRejectTarget("bulk")}>
            ✕ Reject all
          </button>
          <button className="btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
            Clear selection
          </button>
        </div>
      )}

      {error && <div className="page-error">{error}</div>}

      {/* Table */}
      <div className="table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selected.size === records.length && records.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th>Source</th>
              <th>Scope</th>
              <th>Activity</th>
              <th>Raw Value</th>
              <th>Normalized (kg CO₂e)</th>
              <th>Period</th>
              <th>Status</th>
              <th>Flags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="table-empty">
                  <div className="loading-rows">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 80}ms` }} />
                    ))}
                  </div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={10} className="table-empty">
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <div>No records match the current filters.</div>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((rec) => (
                <tr
                  key={rec.id}
                  className={`record-row ${selected.has(rec.id) ? "row-selected" : ""} ${rec.flags?.length ? "row-flagged" : ""}`}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(rec.id)}
                      onChange={() => toggleSelect(rec.id)}
                    />
                  </td>
                  <td>
                    <span className={`source-tag src-${rec.source_type}`}>
                      {SOURCE_LABELS[rec.source_type] || rec.source_type}
                    </span>
                  </td>
                  <td>
                    <span className={`scope-badge s${rec.scope}`}>
                      {SCOPE_LABELS[rec.scope]}
                    </span>
                  </td>
                  <td className="activity-cell">
                    <div className="activity-main">{rec.activity_description}</div>
                    {rec.facility && <div className="activity-sub">{rec.facility}</div>}
                  </td>
                  <td className="mono">
                    {rec.raw_value} {rec.raw_unit}
                  </td>
                  <td className="mono co2-cell">
                    {rec.co2e_kg != null ? Number(rec.co2e_kg).toLocaleString() : "—"}
                  </td>
                  <td className="period-cell">
                    {rec.period_start ? (
                      <>
                        <div>{rec.period_start}</div>
                        <div className="period-end">→ {rec.period_end}</div>
                      </>
                    ) : "—"}
                  </td>
                  <td>
                    <span className={`status-badge ${STATUS_META[rec.status]?.cls || ""}`}>
                      {STATUS_META[rec.status]?.label || rec.status}
                    </span>
                  </td>
                  <td className="flags-cell">
                    {rec.flags?.length > 0 ? (
                      <span className="flag-count" title={rec.flags.join("\n")}>
                        ⚑ {rec.flags.length}
                      </span>
                    ) : null}
                  </td>
                  <td className="actions-cell">
                    {rec.status === "pending" || rec.status === "flagged" ? (
                      <>
                        <button
                          className="btn-approve btn-xs"
                          onClick={() => handleApprove(rec.id)}
                          title="Approve"
                        >✓</button>
                        <button
                          className="btn-danger btn-xs"
                          onClick={() => setRejectTarget(rec.id)}
                          title="Reject"
                        >✕</button>
                      </>
                    ) : (
                      <span className="action-locked" title="Record is locked">🔒</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn-ghost btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >← Prev</button>
          <span className="page-info">Page {page} of {totalPages}</span>
          <button
            className="btn-ghost btn-sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >Next →</button>
        </div>
      )}
    </div>
  );
}
