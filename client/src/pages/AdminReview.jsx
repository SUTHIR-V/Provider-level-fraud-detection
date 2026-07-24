// client/src/pages/AdminReview.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";

/* ---------- tiny UI pieces ---------- */
function Pill({ tone = "neutral", children }) {
  const map = {
    neutral: "pill pill-neutral",
    good: "pill pill-good",
    warn: "pill pill-warn",
    danger: "pill pill-danger",
    info: "pill pill-info",
  };
  return <span className={map[tone] || map.neutral}>{children}</span>;
}

function Button({ variant = "primary", children, ...props }) {
  const cls = `btn ${variant === "ghost" ? "btn-ghost" : ""} ${
    variant === "danger" ? "btn-danger" : ""
  } ${variant === "success" ? "btn-success" : ""}`;
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}

function Card({ children }) {
  return <div className="card">{children}</div>;
}

function ErrorBanner({ msg }) {
  if (!msg) return null;
  return (
    <div
      style={{
        margin: "10px 0 0",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #472329",
        background: "#2b1417",
        color: "#ffb0b8",
      }}
    >
      {msg}
    </div>
  );
}

/* ---------- page ---------- */
export default function AdminReview() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState(null); // { claim, scoring, busy }
  const [err, setErr] = useState("");
  const loadedRef = useRef(false); // avoid StrictMode double-run alerts/loads

  async function load() {
    setLoading(true);
    setErr("");
    try {
      // load pending + summary in parallel; don't fail page if one errors
      const pendingP = api.get("/claims/pending");
      const summaryP = api.get("/claims/admin-summary");
      const [pendRes, sumRes] = await Promise.allSettled([pendingP, summaryP]);

      if (pendRes.status === "fulfilled") {
        setItems(pendRes.value.data || []);
      } else {
        setItems([]);
        const msg =
          pendRes.reason?.response?.data?.error ||
          pendRes.reason?.message ||
          "Failed to load pending claims";
        setErr((e) => e || msg);
      }

      if (sumRes.status === "fulfilled") {
        setSummary(sumRes.value.data || null);
      } else {
        const msg =
          sumRes.reason?.response?.data?.error ||
          sumRes.reason?.message ||
          "Failed to load admin summary";
        setErr((e) => e || msg);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loadedRef.current) return; // guard StrictMode re-run
    loadedRef.current = true;
    load();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((it) =>
      [it.ClaimID, it.Provider, it.DiagnosisGroupCode]
        .map((s) => String(s ?? "").toLowerCase())
        .some((s) => s.includes(t))
    );
  }, [q, items]);

  async function openReview(claim) {
    setPanel({ claim, scoring: { loading: true }, busy: false });
    try {
      // IMPORTANT: use relative path so api baseURL (/api) is used, and no double "/api"
      const { data } = await api.get(`admin-score/score/${claim.ClaimID}`);

      const mlResponse = {
        label: data?.label ?? "UNKNOWN",
        prediction: data?.prediction,
        score: data?.probability,
        probability: data?.probability,
        topFeatures: data?.topFeatures || [],
        aiExplanation: data?.aiExplanation,
        raw: data?.raw,
      };

      setPanel({
        claim: data?.rawClaim || claim,
        scoring: {
          loading: false,
          mlResponse,
          payloadSent: data?.payloadSent,
          aggregatedData: data?.aggregatedData,
        },
        busy: false,
      });
    } catch (e) {
      console.error("Error in openReview:", e);
      setPanel({
        claim,
        scoring: {
          loading: false,
          error: e?.response?.data?.error || e?.response?.data?.detail || e.message || "Scoring failed",
        },
        busy: false,
      });
    }
  }

  async function decide(decision) {
    if (!panel) return;
    setPanel((p) => ({ ...p, busy: true }));
    try {
      const score = panel?.scoring?.mlResponse?.score;
      const label = panel?.scoring?.mlResponse?.label;

      const payload = {
        decision,
        ...(typeof score === "number" && score !== 0 ? { score } : {}),
        ...(label ? { label } : {}),
      };

      await api.post(`/claims/${panel.claim.ClaimID}/review`, payload);

      setPanel(null);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to persist decision");
      setPanel((p) => ({ ...p, busy: false }));
    }
  }

  // close panel on ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setPanel(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const overall =
    summary?.overall || { total: 0, pending: 0, approved: 0, rejected: 0 };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2 className="title">Admin • Pending Claims</h2>
          <p className="muted">
            Review and take action. Scoring runs only when you open a claim.
          </p>
        </div>
        <div className="header-actions">
          <Button variant="ghost" onClick={load}>
            Refresh
          </Button>
        </div>
      </header>

      <ErrorBanner msg={err} />

      {/* Summary cards */}
      <section className="grid-cards">
        <Card>
          <div className="stat">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{overall.pending ?? 0}</span>
          </div>
        </Card>
        <Card>
          <div className="stat">
            <span className="stat-label">Approved</span>
            <span className="stat-value">{overall.approved ?? 0}</span>
          </div>
        </Card>
        <Card>
          <div className="stat">
            <span className="stat-label">Rejected</span>
            <span className="stat-value">{overall.rejected ?? 0}</span>
          </div>
        </Card>
        <Card>
          <div className="stat">
            <span className="stat-label">Total</span>
            <span className="stat-value">{overall.total ?? 0}</span>
          </div>
        </Card>
      </section>

      {/* Search row */}
      <div className="toolbar">
        <div className="search">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            placeholder="Search by ClaimID / Provider / Dx"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              className="search-clear"
              onClick={() => setQ("")}
              aria-label="Clear"
            >
              ×
            </button>
          )}
        </div>
        <div className="toolbar-gap" />
        <Button variant="ghost" onClick={load}>
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="card table-card">
        {loading ? (
          <div className="skeleton-list">
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ClaimID</th>
                  <th>Provider</th>
                  <th>Start</th>
                  <th className="num">Amount</th>
                  <th>Dx</th>
                  <th>Status</th>
                  <th className="action-col"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => (
                  <tr key={it.ClaimID}>
                    <td className="mono">{it.ClaimID}</td>
                    <td className="mono">{it.Provider}</td>
                    <td>
                      {it.ClaimStartDt
                        ? new Date(it.ClaimStartDt).toLocaleDateString()
                        : ""}
                    </td>
                    <td className="num">{it.InscClaimAmtReimbursed}</td>
                    <td>{it.DiagnosisGroupCode}</td>
                    <td>
                      <Pill tone="info">{it.status || "Pending"}</Pill>
                    </td>
                    <td className="action-col">
                      <Button onClick={() => openReview(it)}>Review</Button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan="7" className="muted pad-lg">
                      No pending claims.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Drawer */}
      {panel && (
        <div
          className="drawer-backdrop"
          onClick={(e) => e.target === e.currentTarget && setPanel(null)}
        >
          <div className="drawer">
            <div className="drawer-head">
              <h3>
                Review • <span className="mono">{panel.claim.ClaimID}</span>
              </h3>
              <Button variant="ghost" onClick={() => setPanel(null)}>
                Close
              </Button>
            </div>

            <div className="drawer-grid">
              <Card>
                <div className="card-head between">
                  <h4>ML Result</h4>
                  <div className="score-display">
                    {panel.scoring?.mlResponse?.label && (
                      <Pill tone={panel.scoring.mlResponse.label === "Fraud" ? "danger" : "good"}>
                        {panel.scoring.mlResponse.label}
                      </Pill>
                    )}
                    {typeof panel?.scoring?.mlResponse?.probability === "number" && (
                      <span className="score-value">
                        {(panel.scoring.mlResponse.probability * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                {panel.scoring?.loading && (
                  <div className="muted">Scoring…</div>
                )}
                {panel.scoring?.error && (
                  <div className="error">{panel.scoring.error}</div>
                )}

                {panel.scoring?.mlResponse && (
                  <>
                    {/* AI Explanation */}
                    {panel.scoring.mlResponse.aiExplanation && (
                      <div className="mt">
                        <div className="muted mb-xs">AI Explanation</div>
                        <div className="ai-explanation" style={{
                          background: '#1a1a2e',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #16213e',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {panel.scoring.mlResponse.aiExplanation}
                        </div>
                      </div>
                    )}

                    {/* Top Features */}
                    {panel.scoring.mlResponse.topFeatures && panel.scoring.mlResponse.topFeatures.length > 0 && (
                      <div className="mt">
                        <div className="muted mb-xs">Top Contributing Features</div>
                        <div className="feature-list">
                          {panel.scoring.mlResponse.topFeatures.map((feature, idx) => (
                            <div key={idx} className="feature-item" style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              margin: '4px 0',
                              background: '#0f1419',
                              borderRadius: '6px',
                              border: '1px solid #1e2328'
                            }}>
                              <span className="feature-name">{feature.feature}</span>
                              <div className="feature-details">
                                <span className="feature-value">Value: {typeof feature.value === 'number' ? feature.value.toFixed(2) : feature.value}</span>
                                <span className="feature-impact" style={{
                                  marginLeft: '12px',
                                  color: feature.impact > 0 ? '#ff6b6b' : '#51cf66'
                                }}>
                                  Impact: {feature.impact.toFixed(4)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw Response Toggle */}
                    {panel.scoring?.mlResponse?.raw && (
                      <div className="mt">
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setPanel((p) => ({ ...p, showRaw: !p.showRaw }))
                          }
                        >
                          {panel.showRaw ? "Hide" : "Show"} Raw Response
                        </Button>
                        {panel.showRaw && (
                          <pre className="code-scroll small">
                            {JSON.stringify(
                              panel.scoring.mlResponse.raw,
                              null,
                              2
                            )}
                          </pre>
                        )}
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>

            <div className="drawer-actions">
              <Button
                variant="danger"
                disabled={panel.busy}
                onClick={() => decide("Rejected")}
              >
                Reject
              </Button>
              <Button
                variant="success"
                disabled={panel.busy}
                onClick={() => decide("Approved")}
              >
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
