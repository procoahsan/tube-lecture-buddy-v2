"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setDevResetUrl("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send password reset link");
        return;
      }

      setMessage(data.message || "If an account exists for that email, a password reset link has been sent.");
      if (data.simulated && data.resetUrl) {
        setDevResetUrl(data.resetUrl);
      }
    } catch {
      setError("Failed to send password reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-up">
        <div className="auth-logo">
          <img src="/logo.png" alt="Tube Lecture Buddy" />
        </div>

        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-subtitle">
          Enter your email and we will send a secure reset link.
        </p>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {message && (
          <div className="status-badge success auth-status">
            {message}
          </div>
        )}

        {devResetUrl && (
          <div className="status-badge info auth-status auth-dev-link">
            Dev reset link: <Link href={devResetUrl}>{devResetUrl}</Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="auth-footer">
          Remembered it? <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
