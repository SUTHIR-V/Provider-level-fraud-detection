import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Card({ children }) {
  return <div className="card">{children}</div>;
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

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [providerId, setProviderId] = useState("");
  const [rawClaim, setRawClaim] = useState(null);
  const [aggregatedData, setAggregatedData] = useState(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [summaryResponse, claimResponse] = await Promise.all([
        api.get("/claims/admin-summary"),
        api.get("/claims/CLM9125498")  // Fetch specific claim data
      ]);
      setSummary(summaryResponse.data);
      setRawClaim(claimResponse.data);
      // Mock aggregated data for now - this should come from your API
      setAggregatedData({
        "vector": [
          0,
          5,
          41956.833333333336,
          99000,
          26448.686624819,
          12.5,
          6,
          47.16666666666664,
          0.8333333333333334,
          0.16666666666666666,
          1.2,
          0,
          5.5
        ]
      });
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const overall =
    summary?.overall || { total: 0, pending: 0, approved: 0, rejected: 0 };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await fetch("https://example.com/external-backend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ providerId }),
      });
      if (!response.ok) {
        throw new Error("Failed to send data");
      }
      alert("Provider ID sent successfully!");
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2 className="title">Admin Dashboard</h2>
          <p className="muted">
            Overview of the claims processing system.
          </p>
        </div>
        <div className="header-actions">
          <Button variant="ghost" onClick={load}>
            Refresh
          </Button>
          <Link to="/admin/review" className="btn">
            Review Queue
          </Link>
        </div>
      </header>

      {err && <div className="error">{err}</div>}

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

      <div className="card">
        <h3>Welcome, Admin</h3>
        <p>
          Use the Review Queue to approve or reject pending claims. You can also
          view the summary of all claims on this dashboard.
        </p>
      </div>

      <div className="card">
        <h3>Organized Crime</h3>
        <form onSubmit={handleSubmit}>
          <label htmlFor="providerId">Provider ID:</label>
          <input
            type="text"
            id="providerId"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-success">
            Submit
          </button>
        </form>
      </div>

      <div className="review-container">
        <h2>Review - CLM9125498</h2>
        <div className="claims-review-container">
          <div className="claims-review-section">
            <h3>Raw Claim</h3>
            <div className="json-viewer">
              <pre>{JSON.stringify(rawClaim, null, 2)}</pre>
            </div>
          </div>
          
          <div className="claims-review-section">
            <h3>Aggregated Data</h3>
            <div className="json-viewer">
              <pre>{JSON.stringify(aggregatedData, null, 2)}</pre>
            </div>
          </div>
          
          <div className="claims-review-section">
            <h3>ML Result</h3>
            <div className="ml-result">
              <div className="fraud-score">
                <span className="score-label">Not Fraud</span>
                <span className="score">10.9%</span>
              </div>
              <div className="ai-explanation">
                <h4>AI Explanation</h4>
                <p>Here is a concise explanation of the fraud detection model's prediction for further understanding:</p>
                <p>- The model predicts a low likelihood of fraud for Provider PVR009900, with the probability being 0.11 or 11%.</p>
                <p>- Key factors include a high max claim amount and average...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
