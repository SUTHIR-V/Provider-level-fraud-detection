import { useState } from "react";
import api from "../api";

export default function OrganizedCrime() {
  const [providerId, setProviderId] = useState("");
  const [daysWindow, setDaysWindow] = useState(30);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  async function run(e) {
    e?.preventDefault();
    setErr("");
    setData(null);
    const id = providerId.trim();
    if (!id) { setErr("Please enter a Provider ID."); return; }
    try {
      setLoading(true);
      const res = await api.get(`/fraud-cluster/${encodeURIComponent(id)}?daysWindow=${daysWindow}`);
      setData(res.data);
    } catch (e) {
      setErr(e?.response?.data?.error || "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="title">Organized Crime</h2>
          <p className="muted">Check provider rings via shared beneficiaries within a time window.</p>
        </div>
      </div>

      <div className="card oc-panel">
        <form className="oc-form" onSubmit={run}>
          <div className="form-row">
            <label htmlFor="oc-provider">Provider ID</label>
            <input id="oc-provider" className="control" placeholder="PRV00312"
                   value={providerId} onChange={(e)=>setProviderId(e.target.value)} />
          </div>
          <div className="form-row">
            <label htmlFor="oc-days">Days window</label>
            <input id="oc-days" className="control" type="number" min="1" max="365"
                   value={daysWindow} onChange={(e)=>setDaysWindow(e.target.value)} />
          </div>
          <div className="btn-group">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Checking…" : "Check Cluster"}
            </button>
            <button className="btn btn-ghost" type="button"
                    onClick={()=>{ setProviderId(""); setData(null); setErr(""); }}>
              Clear
            </button>
          </div>
        </form>
        {err && <div className="auth-message error" style={{marginTop:12}}>{err}</div>}
      </div>

      {data && (
        <div className="oc-grid">
          <div className="card">
            <div className="between mb-xs">
              <h4 className="small" style={{fontSize:16, margin:0}}>Summary</h4>
              <span className={`pill ${data.inRing ? "pill-danger" : "pill-good"}`}>
                {data.inRing ? "Suspicious Ring Found" : "No Ring"}
              </span>
            </div>

            <div className="oc-stats">
              <div className="oc-stat"><div className="stat-label">Provider</div><div className="stat-value mono">{data.providerId}</div></div>
              <div className="oc-stat"><div className="stat-label">Cluster Size</div><div className="stat-value">{data.clusterSize ?? 0}</div></div>
              <div className="oc-stat"><div className="stat-label">Window</div><div className="stat-value">{daysWindow} d</div></div>
            </div>

            {!data.inRing && data.reason && <div className="muted" style={{marginTop:8}}>{data.reason}</div>}
          </div>

          {data.inRing && (
            <>
              <div className="card">
                <div className="between mb-xs">
                  <h4 className="small" style={{fontSize:16, margin:0}}>Providers in Cluster</h4>
                  <span className="pill pill-info">{data.providersInCluster?.length || 0} providers</span>
                </div>
                <div className="oc-tags">
                  {(data.providersInCluster || []).map(p => (
                    <span key={p} className={`tag ${p === data.providerId ? "tag-accent" : ""}`}>{p}</span>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="between mb-xs">
                  <h4 className="small" style={{fontSize:16, margin:0}}>Suspicious Links</h4>
                  <span className="pill pill-warn">{data.suspiciousLinks?.length || 0} links</span>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>Provider 1</th><th>Provider 2</th><th className="num">Shared Bene Count</th></tr>
                    </thead>
                    <tbody>
                      {(data.suspiciousLinks || []).map((e,i)=>(
                        <tr key={i}>
                          <td className="mono">{e.provider1}</td>
                          <td className="mono">{e.provider2}</td>
                          <td className="num">{e.sharedCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
