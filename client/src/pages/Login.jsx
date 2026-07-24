import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";  // Import Link from react-router-dom
import api from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    // focus email on mount for faster login
    emailRef.current?.focus();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setMsg("");
    setStatus(null);

    try {
      const { data } = await api.post("/auth/login", { email: email.trim(), password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      if (data.providerId) localStorage.setItem("providerId", data.providerId);

      setStatus("success");
      setMsg("Logged in successfully!");
      setTimeout(() => {
        window.location.href = data.role === "admin" ? "/admin" : "/provider";
      }, 700);
    } catch (err) {
      setStatus("error");
      setMsg(err?.response?.data?.error || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container" role="region" aria-label="Login form">
        <div className="auth-header">
          <div className="auth-icon" aria-hidden="true">🔐</div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your claims portal account</p>
        </div>

        <form onSubmit={submit} className="auth-form" noValidate>
          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              ref={emailRef}
              type="email"
              inputMode="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-describedby="password-help"
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
            <small id="password-help" className="hint">
              Use your portal password. It’s case sensitive.
            </small>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading || !email || !password}
          >
            {loading ? (
              <>
                <span className="loading-spinner" aria-hidden="true"></span>&nbsp;Signing in…
              </>
            ) : (
              <>
                <span className="nav-icon" aria-hidden="true">🚀</span>&nbsp;Sign In
              </>
            )}
          </button>

          {msg && (
            <div
              role="status"
              className={`auth-message ${status === "success" ? "success" : "error"}`}
            >
              {msg}
            </div>
          )}
        </form>

        <div className="auth-footer">
          <p>
            Don&apos;t have an account?{" "}
            <a href="/signup" className="auth-link">
              Sign up here
            </a>
          </p>
          <p>
            <Link to="/forgot-password" className="auth-link">
              Forgot Password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
