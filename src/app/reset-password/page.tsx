"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Reset token is missing. Please request a new reset link.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setMessage(data.message || "Password reset successfully.");
      setTimeout(() => {
        router.push("/login?message=Password reset successfully. Please sign in.");
      }, 1200);
    } catch {
      setError("Failed to reset password. Please try again.");
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

        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">
          Choose a new password for your Tube Lecture Buddy account.
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

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reset-confirm-password">Confirm password</label>
            <input
              id="reset-confirm-password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading || !token}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="auth-footer">
          Need a new link? <Link href="/forgot-password">Request another</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="auth-container">
        <div className="auth-card" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 1s linear infinite" }} />
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
