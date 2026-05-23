"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import OTPInput from "@/components/OTPInput";

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Signup State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP Verification State
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  // Simulated OTP alert state (for dev mode without Resend API key)
  const [simulatedCode, setSimulatedCode] = useState("");

  // Pre-fill email and verification step if redirected from unverified login error
  useEffect(() => {
    const qEmail = searchParams.get("email");
    const qVerify = searchParams.get("verify");
    if (qEmail) {
      setEmail(qEmail);
    }
    if (qVerify === "true") {
      setStep("verify");
      // Resend OTP so they have a fresh working code ready
      setOtpSuccess("✉️ Verification code has been sent!");
      // We can check if a simulated code was passed in query params
      const qOtp = searchParams.get("otp");
      if (qOtp) {
        setSimulatedCode(qOtp);
      }
    }
  }, [searchParams]);

  // Countdown timer for Resend code
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "verify" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
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

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      // If success, transition to verify step!
      setStep("verify");
      setOtpError("");
      setResendTimer(60);
      setCanResend(false);
      
      // If Resend was simulated, save the OTP to show the premium dev helper alert!
      if (data.simulated && data.otp) {
        setSimulatedCode(data.otp);
      } else {
        setSimulatedCode("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Google sign-up failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpValue.length < 6) {
      setOtpError("Please enter all 6 digits of the code");
      return;
    }

    setLoading(true);
    setOtpError("");
    setOtpSuccess("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), otp: otpValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "Verification failed");
        return;
      }

      setOtpSuccess("🎉 Email verified successfully! Logging you in...");

      // Premium seamless UX: Auto-login after successful email verification!
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login?message=Email verified! Please sign in.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setResendLoading(true);
    setOtpError("");
    setOtpSuccess("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "Failed to resend code");
        return;
      }

      setOtpSuccess("✉️ A fresh verification code has been sent!");
      setResendTimer(60);
      setCanResend(false);
      setOtpValue("");

      if (data.simulated && data.otp) {
        setSimulatedCode(data.otp);
      } else {
        setSimulatedCode("");
      }
    } catch {
      setOtpError("Failed to resend verification code.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-up">
        {/* Logo */}
        <div className="auth-logo">
          <img src="/logo.png" alt="Tube Lecture Buddy" />
        </div>

        {step === "signup" ? (
          <>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">
              Join Tube Lecture Buddy and transform your learning
            </p>

            {error && (
              <div className="auth-error">
                ❌ {error}
              </div>
            )}

            {/* Google Sign-Up */}
            <button
              className="auth-google-btn"
              onClick={handleGoogleSignup}
              disabled={googleLoading || loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Signing up..." : "Continue with Google"}
            </button>

            <div className="auth-divider">
              <span>or sign up with email</span>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="auth-form">
              <div className="auth-field">
                <label htmlFor="signup-name">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="signup-confirm">Confirm Password</label>
                <input
                  id="signup-confirm"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={loading || googleLoading}
              >
                {loading ? "⏳ Creating account..." : "🎓 Create Account"}
              </button>
            </form>

            <p className="auth-footer">
              Already have an account?{" "}
              <Link href="/login">Sign in here</Link>
            </p>
          </>
        ) : (
          /* OTP Verification Step */
          <>
            <h1 className="auth-title">Verify Email</h1>
            <p className="auth-subtitle">
              We have sent a 6-digit verification code to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>
            </p>

            {/* Development Mode Helper Alert */}
            {simulatedCode && (
              <div className="result-panel animate-fade-up" style={{ margin: "0 0 20px", borderLeft: "3px solid var(--accent)", background: "rgba(108,92,231,0.08)" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--accent-light)", fontWeight: 600 }}>🛠️ Development Helper</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  RESEND_API_KEY is not defined. The OTP generated is: <strong style={{ fontSize: "1rem", color: "var(--text-primary)", letterSpacing: "1px" }}>{simulatedCode}</strong>.
                </p>
              </div>
            )}

            {otpError && (
              <div className="auth-error">
                ❌ {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="status-badge success" style={{ display: "block", textAlign: "center", padding: "12px", width: "100%", margin: "0 0 20px", fontSize: "0.85rem" }}>
                {otpSuccess}
              </div>
            )}

            <form onSubmit={handleVerify} className="auth-form">
              {/* Premium OTP Input */}
              <div className="otp-input-wrapper">
                <OTPInput
                  value={otpValue}
                  onChange={setOtpValue}
                  maxLength={6}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={loading || otpValue.length < 6}
              >
                {loading ? "⏳ Verifying..." : "⚡ Verify & Log In"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleResendOtp}
                disabled={!canResend || resendLoading}
                style={{
                  fontSize: "0.88rem",
                  color: canResend ? "var(--accent)" : "var(--text-muted)",
                  fontWeight: 600,
                }}
              >
                {resendLoading
                  ? "Resending..."
                  : canResend
                    ? "✉️ Resend Verification Code"
                    : `Resend Code in ${resendTimer}s`}
              </button>
            </div>

            <p className="auth-footer" style={{ marginTop: "28px" }}>
              Entered wrong email?{" "}
              <button
                onClick={() => setStep("signup")}
                style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 600, cursor: "pointer", padding: 0 }}
              >
                Go back to signup
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="auth-container">
        <div className="auth-card" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 1s linear infinite" }} />
        </div>
      </div>
    }>
      <SignupFormContent />
    </Suspense>
  );
}
