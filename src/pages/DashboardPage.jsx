import { useState, useEffect } from "react";
import { getDashboardStats } from "../api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const SCOPE_COLORS = { "Scope 1": "#ef4444", "Scope 2": "#f59e0b", "Scope 3": "#3b82f6" };

const MOCK_STATS = {
  total_co2e_kg: 284500,
  records_pending: 14,
  records_approved: 203,
  records_flagged: 6,
  by_scope: [
    { scope: "Scope 1", co2e_kg: 112000 },
    { scope: "Scope 2", co2e_kg: 98000 },
    { scope: "Scope 3", co2e_kg: 74500 },
  ],
  by_source: [
    { source: "SAP", count: 118 },
    { source: "Utility", count: 62 },
    { source: "Travel", count: 43 },
  ],
  recent_jobs: [
    { id: "J-0041", source: "SAP", filename: "MB51_export_Q1.csv", status: "completed", records: 118, created_at: "2024-03-14" },
    { id: "J-0040", source: "Utility", filename: "elec_jan_mar.csv", status: "completed", records: 62, created_at: "2024-03-13" },
    { id: "J-0039", source: "Travel", filename: "navan_q1.json", status: "failed", records: 0, created_at: "2024-03-13" },
  ],
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`stat-card ${accent || ""}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => setStats(MOCK_STATS))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-root"><div className="page-loading">Loading…</div></div>;

  const s = stats;
  const totalCo2eTonnes = (s.total_co2e_kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 });

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-sub">Aggregated emissions across all ingested data for this reporting period.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total CO₂e" value={`${totalCo2eTonnes} tCO₂e`} sub="All scopes combined" accent="accent-green" />
        <StatCard label="Pending Review" value={s.records_pending} sub="Records awaiting approval" accent={s.records_pending > 0 ? "accent-amber" : ""} />
        <StatCard label="Approved" value={s.records_approved} sub="Locked for audit" accent="accent-blue" />
        <StatCard label="Flagged" value={s.records_flagged} sub="Need attention" accent={s.records_flagged > 0 ? "accent-red" : ""} />
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3 className="chart-title">Emissions by Scope (tCO₂e)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={s.by_scope} barSize={40}>
              <XAxis dataKey="scope" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}t`} />
              <Tooltip formatter={(v) => [`${(v / 1000).toFixed(1)} tCO₂e`]} />
              <Bar dataKey="co2e_kg" radius={[4, 4, 0, 0]}>
                {s.by_scope.map((entry) => (
                  <Cell key={entry.scope} fill={SCOPE_COLORS[entry.scope] || "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Records by Source</h3>
          <div className="source-bars">
            {s.by_source.map((src) => {
              const max = Math.max(...s.by_source.map((x) => x.count));
              return (
                <div key={src.source} className="source-bar-row">
                  <span className="source-bar-label">{src.source}</span>
                  <div className="source-bar-track">
                    <div
                      className={`source-bar-fill src-${src.source.toLowerCase()}`}
                      style={{ width: `${(src.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="source-bar-count">{src.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="section-header">
        <h3>Recent Ingestion Jobs</h3>
        <a href="/upload" className="btn-ghost btn-sm">+ New upload</a>
      </div>

      <div className="jobs-table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Source</th>
              <th>File</th>
              <th>Status</th>
              <th>Records</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {s.recent_jobs.map((job) => (
              <tr key={job.id}>
                <td className="mono">{job.id}</td>
                <td><span className={`source-tag src-${job.source.toLowerCase()}`}>{job.source}</span></td>
                <td className="file-cell">{job.filename}</td>
                <td>
                  <span className={`status-badge ${job.status === "completed" ? "status-approved" : job.status === "failed" ? "status-rejected" : "status-pending"}`}>
                    {job.status}
                  </span>
                </td>
                <td className="mono">{job.records}</td>
                <td>{job.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
