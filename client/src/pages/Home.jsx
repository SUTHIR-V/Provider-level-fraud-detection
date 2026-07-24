import { Link } from "react-router-dom";

function getUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(atob(payload));
    return { email: json.email, role: json.role, providerId: json.providerId || null };
  } catch { return null; }
}

export default function Home() {
  const user = getUser();
  return (
    <div className="page">
      <div className="hero-section">
        <h1 className="hero-title">Welcome to the Claims Portal</h1>
        <p className="hero-subtitle">
          {user
            ? `Welcome back, ${user.email}! Manage your healthcare claims with ease.`
            : "Your all-in-one solution for submitting and managing healthcare claims. Whether you're a provider or an administrator, our platform is designed to be intuitive and efficient."
          }
        </p>

        <div className="action-buttons">
          {!user && (
            <>
              <a href="/login" className="action-btn action-btn-primary">
                <span className="nav-icon">🚀</span>
                Get Started
              </a>
              <a href="/signup" className="action-btn action-btn-secondary">
                <span className="nav-icon">📝</span>
                Create Account
              </a>
            </>
          )}
          {user?.role === "admin" && (
            <Link to="/admin" className="action-btn action-btn-primary">
              <span className="nav-icon">⚙️</span>
              Admin Dashboard
            </Link>
          )}
          {user?.role === "provider" && (
            <>
              <Link to="/provider" className="action-btn action-btn-primary">
                <span className="nav-icon">📊</span>
                View Dashboard
              </Link>
              <Link to="/submit" className="action-btn action-btn-secondary">
                <span className="nav-icon">➕</span>
                Submit New Claim
              </Link>
            </>
          )}
        </div>
      </div>

      {!user && (
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🏥</div>
            <h3 className="feature-title">Healthcare Providers</h3>
            <p className="feature-description">
              Submit and track insurance claims efficiently. Monitor reimbursement status and manage your practice's financial workflow.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👨‍💼</div>
            <h3 className="feature-title">Admin Management</h3>
            <p className="feature-description">
              Comprehensive oversight of all claims processing. Review, approve, and manage the entire claims lifecycle with advanced analytics.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3 className="feature-title">Real-time Analytics</h3>
            <p className="feature-description">
              Get insights into claim patterns, approval rates, and financial metrics. Make data-driven decisions for better outcomes.
            </p>
          </div>
        </div>
      )}
{/* 
      {!user && (
        // <div className="card" style={{ marginTop: 32, maxWidth: 600, margin: "32px auto 0" }}>
        //   <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        //     <span style={{ fontSize: "20px" }}>💡</span>
        //     <strong>Developer Tip</strong>
        //   </div>
          <p style={{ margin: "0 0 12px", color: "var(--muted)" }}>
            If you can't log in, you can seed an admin account using:
          </p>
          <pre className="code-scroll small">
{`ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=Admin@12345 node server/tools/create-admin.mjs`}
          </pre>
        </div>
      )} */}
    </div>
  );
}
