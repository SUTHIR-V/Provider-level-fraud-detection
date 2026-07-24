import { useEffect, useState } from "react";
import api from "../api";

export default function ProviderDashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/claims/provider-stats");
        setStats(data);
      } catch (e) {
        setErr(e?.response?.data?.error || e.message);
      }
    })();
  }, []);

  return (
    <div className="page">
      <h2 className="title">Provider Dashboard</h2>
      <p className="muted">Overview of your submitted claims and current statuses.</p>

      {err && (
        <div style={{marginTop:10}} className="pill pill-danger">{err}</div>
      )}

      <div className="grid-cards" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="stat">
            <span className="stat-label">Total reimbursed</span>
            <span className="stat-value">{stats?.totalReimbursed ?? 0}</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="stat-label">Average reimbursed</span>
            <span className="stat-value">{stats?.avgReimbursed ?? 0}</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{stats?.statusCounts?.Pending ?? 0}</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="stat-label">Approved</span>
            <span className="stat-value">{stats?.statusCounts?.Approved ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="between" style={{ marginBottom: 8 }}>
          <h4>Recent Claims</h4>
          <a className="btn" href="/submit">Submit New Claim</a>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ClaimID</th>
                <th>Start</th>
                <th className="num">Amount</th>
                <th>Dx</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recent || []).map((r) => (
                <tr key={r.ClaimID}>
                  <td className="mono">{r.ClaimID}</td>
                  <td>{r.ClaimStartDt ? new Date(r.ClaimStartDt).toLocaleDateString() : ""}</td>
                  <td className="num">{r.InscClaimAmtReimbursed ?? ""}</td>
                  <td>{r.DiagnosisGroupCode ?? ""}</td>
                  <td><span className="pill pill-info">{r.status || "Pending"}</span></td>
                </tr>
              ))}
              {(!stats?.recent || !stats.recent.length) && (
                <tr><td colSpan={5} className="muted pad-lg">No recent claims.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
