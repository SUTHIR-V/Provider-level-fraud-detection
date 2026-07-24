import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../api";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    setToken(params.get("token"));
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      await api.post("/auth/reset-password", { token, newPassword });
      setMessage("Password has been successfully reset.");
    } catch (err) {
      setMessage("Error: " + err.response.data.error);
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
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔒</div>
          <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>Reset Your Password</h2>
          <p style={{ fontSize: "14px", color: "#bbb" }}>Enter a new password</p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "20px" }} noValidate>
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="newPassword" style={{ fontSize: "14px", color: "#ddd", display: "block" }}>New Password</label>
            <input
              id="newPassword"
              type="password"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px", marginTop: "8px", backgroundColor: "#2a2a2d", color: "#f1f1f1", border: "1px solid #333", borderRadius: "5px"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="confirmPassword" style={{ fontSize: "14px", color: "#ddd", display: "block" }}>Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px", marginTop: "8px", backgroundColor: "#2a2a2d", color: "#f1f1f1", border: "1px solid #333", borderRadius: "5px"
              }}
            />
          </div>

          <button type="submit" style={{
            width: "100%", padding: "12px", backgroundColor: "#6c5ce7", color: "white", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "5px", cursor: "pointer"
          }}>
            <span style={{ marginRight: "8px" }}>🔄</span> Reset Password
          </button>

          {message && <div style={{
            marginTop: "20px", textAlign: "center", fontSize: "14px", padding: "10px", backgroundColor: "#4caf50", color: "white", borderRadius: "5px"
          }}>{message}</div>}
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p>
            Back to{" "}
            <a href="/login" style={{ color: "#6c5ce7", textDecoration: "none" }}>
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
