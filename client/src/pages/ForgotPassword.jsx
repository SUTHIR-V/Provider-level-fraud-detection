import { useState } from "react";
import api from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(""); // Display error or success messages
  const [error, setError] = useState(""); // Handle error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    try {
      await api.post("/auth/forgot-password", { email });
      setMessage("A password reset link has been sent to your email.");
    } catch (err) {
      setError(err?.response?.data?.error || "Error: Unable to send reset link");
    }
  };

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#1a1a1d", color: "white"
    }}>
      <div style={{
        background: "#121212", borderRadius: "8px", padding: "40px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔑</div>
          <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>Forgot Password</h2>
          <p style={{ fontSize: "14px", color: "#bbb" }}>Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }} noValidate>
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="email" style={{ fontSize: "14px", color: "#ddd", display: "block" }}>Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px", marginTop: "8px", backgroundColor: "#2a2a2d", color: "#f1f1f1", border: "1px solid #333", borderRadius: "5px"
              }}
            />
          </div>

          <button type="submit" style={{
            width: "100%", padding: "12px", backgroundColor: "#6c5ce7", color: "white", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "5px", cursor: "pointer"
          }}>
            <span style={{ marginRight: "8px" }}>🔄</span> Send Reset Link
          </button>

          {message && <div style={{ marginTop: "20px", textAlign: "center", fontSize: "14px", padding: "10px", backgroundColor: "#4caf50", color: "white", borderRadius: "5px" }}>{message}</div>}
          {error && <div style={{ marginTop: "20px", textAlign: "center", fontSize: "14px", padding: "10px", backgroundColor: "#f44336", color: "white", borderRadius: "5px" }}>{error}</div>}
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p>
            Remembered your password?{" "}
            <a href="/login" style={{ color: "#6c5ce7", textDecoration: "none" }}>
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
