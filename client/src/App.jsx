import { useMemo } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import AdminReview from "./pages/AdminReview.jsx";
import ClaimForm from "./pages/ClaimForm.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import OrganizedCrime from "./pages/OrganizedCrime.jsx";
import ProviderDashboard from "./pages/ProviderDashboard.jsx";
import Signup from "./pages/signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";  // Add ForgotPassword page
import ResetPassword from "./pages/ResetPassword.jsx";  // Add ResetPassword page
import "./styles.css";

function getUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(atob(payload));
    return { email: json.email, role: json.role, providerId: json.providerId || null };
  } catch {
    return null;
  }
}

function Header({ user }) {
  return (
    <header className="header-nav">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <div className="brand-icon">🏥</div>
            <span className="brand-text">Claims Portal</span>
          </Link>
        </div>
        
        <nav className="nav-links">
          <Link to="/" className="nav-link nav-home">
            <span className="nav-icon nav-home-icon">🏠</span>
            <span className="nav-home-text">Home</span>
          </Link>

          {user?.role === "admin" && (
            <Link to="/admin" className="nav-link">
              <span className="nav-icon">⚙️</span>
              Admin
            </Link>
          )}
          {user?.role === "admin" && (
            <Link to="/organized-crime" className="nav-link">
              <span className="nav-icon">🕸️</span>
              Organized Crime
            </Link>
          )}
          {user?.role === "provider" && (
            <>
              <Link to="/provider" className="nav-link">
                <span className="nav-icon">📊</span>
                Dashboard
              </Link>
              <Link to="/submit" className="nav-link nav-link-primary">
                <span className="nav-icon">➕</span>
                Submit Claim
              </Link>
            </>
          )}
        </nav>

        <div className="nav-actions">
          {user ? (
            <div className="user-menu">
              <div className="user-info">
                <div className="user-avatar">{user.email.charAt(0).toUpperCase()}</div>
                <div className="user-details">
                  <div className="user-email">{user.email}</div>
                  <div className="user-role">{user.role}</div>
                </div>
              </div>
              <button
                className="btn btn-ghost logout-btn"
                onClick={() => {
                  localStorage.removeItem("token");
                  window.location.href = "/";
                }}
              >
                <span className="nav-icon">🚪</span>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="nav-login-btn">
              <span className="nav-icon">🔑</span>
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function RequireRole({ role, children }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const user = useMemo(() => getUser(), []);
  return (
    <BrowserRouter>
      <Header user={user} />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Admin-only */}
        <Route
          path="/admin"
          element={<RequireRole role="admin"><AdminReview /></RequireRole>}
        />
        <Route
          path="/organized-crime"
          element={<RequireRole role="admin"><OrganizedCrime /></RequireRole>}
        />

        {/* Provider-only */}
        <Route
          path="/provider"
          element={<RequireRole role="provider"><ProviderDashboard /></RequireRole>}
        />
        <Route
          path="/submit"
          element={<RequireRole role="provider"><ClaimForm /></RequireRole>}
        />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Forgot Password and Reset Password */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
