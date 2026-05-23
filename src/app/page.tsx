"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";

/* ─── Landing page for visitors (unauthenticated) ─── */
function LandingHero() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-content">
          <img
            src="/logo.png"
            alt="Tube Lecture Buddy"
            className="animate-float"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              objectFit: "cover",
              margin: "0 auto 24px",
              display: "block",
              boxShadow: "0 8px 40px rgba(108,92,231,0.3)",
              border: "3px solid rgba(108,92,231,0.3)",
            }}
          />
          <div className="hero-badge">
            🎓 AI-Powered Learning Assistant
          </div>
          <h1 className="hero-title">
            Your <span className="gradient-text">YouTube Lecture</span> Study Buddy
          </h1>
          <p className="hero-subtitle">
            Transform any YouTube lecture into study materials — detect lectures, generate PPTs,
            get transcripts, translate to 7 languages, and clip important segments.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="btn btn-primary">
              🚀 Get Started Free
            </Link>
            <Link href="/login" className="btn btn-secondary">
              🔑 Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="section-header">
          <h2>
            Powerful Features for <span className="gradient-text">Learners</span>
          </h2>
          <p>
            Everything you need to turn YouTube lectures into comprehensive study resources
          </p>
        </div>
        <div className="features-grid">
          <div className="card animate-fade-up">
            <div className="card-icon purple">🔍</div>
            <h3>Lecture Detection</h3>
            <p>
              Paste any YouTube link and our AI analyzes the video metadata, title,
              description, and tags to determine if it&apos;s a lecture with a confidence score.
            </p>
          </div>
          <div className="card animate-fade-up delay-1">
            <div className="card-icon blue">🎯</div>
            <h3>Interest Analysis</h3>
            <p>
              Input your YouTube search history and discover your learning interests
              across 11 academic categories with visual breakdowns.
            </p>
          </div>
          <div className="card animate-fade-up delay-2">
            <div className="card-icon green">📊</div>
            <h3>Lecture PPT Generator</h3>
            <p>
              Automatically generate professional PowerPoint presentations from video
              transcripts with dark-themed slides — ready to study.
            </p>
          </div>
          <div className="card animate-fade-up delay-3">
            <div className="card-icon orange">📝</div>
            <h3>Audio Notes (DOCX)</h3>
            <p>
              Download the complete English transcript as a beautifully formatted Word
              document or PowerPoint — perfect for revision.
            </p>
          </div>
          <div className="card animate-fade-up delay-4">
            <div className="card-icon red">🌍</div>
            <h3>7-Language Translation</h3>
            <p>
              Translate transcripts into Urdu, Turkish, Arabic, French, Chinese,
              Spanish, or Japanese — making education truly global.
            </p>
          </div>
          <div className="card animate-fade-up delay-5">
            <div className="card-icon purple">✂️</div>
            <h3>Video Clipping</h3>
            <p>
              Select start and end times to clip any YouTube video. Preview the trimmed
              segment and download it for offline study.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="section-header">
          <h2>How It <span className="gradient-text">Works</span></h2>
          <p>Three simple steps to transform your learning experience</p>
        </div>
        <div className="features-grid">
          <div className="card animate-fade-up" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>1️⃣</div>
            <h3>Paste YouTube URL</h3>
            <p>Enter any YouTube video link in the dashboard. We&apos;ll fetch all the details instantly.</p>
          </div>
          <div className="card animate-fade-up delay-2" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>2️⃣</div>
            <h3>Analyze & Detect</h3>
            <p>Our system determines if it&apos;s a lecture and extracts the full transcript automatically.</p>
          </div>
          <div className="card animate-fade-up delay-4" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>3️⃣</div>
            <h3>Download Materials</h3>
            <p>Get your PPT, DOCX, translations, or clipped video — all in one click.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" style={{ textAlign: "center" }}>
        <h2 style={{ marginBottom: "16px" }}>
          Ready to <span className="gradient-text">Level Up</span> Your Learning?
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "32px", maxWidth: "500px", margin: "0 auto 32px" }}>
          Start analyzing YouTube lectures now — create a free account and get started!
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" className="btn btn-primary" style={{ fontSize: "1.1rem", padding: "16px 36px" }}>
            🚀 Create Free Account
          </Link>
          <Link href="/login" className="btn btn-secondary" style={{ fontSize: "1.1rem", padding: "16px 36px" }}>
            🔑 Sign In
          </Link>
        </div>
      </section>
    </>
  );
}

/* ─── Dashboard-style home for logged-in users ─── */
function AuthenticatedHome({ userName }: { userName: string }) {
  const firstName = userName?.split(" ")[0] || "there";

  const quickActions = [
    {
      href: "/dashboard",
      icon: "🔍",
      title: "Analyze a Lecture",
      desc: "Paste a YouTube URL to detect lectures, get transcripts, and generate study materials.",
      color: "purple",
      badge: "Most Used",
    },
    {
      href: "/clip",
      icon: "✂️",
      title: "Clip a Video",
      desc: "Select start & end times to download a trimmed segment of any YouTube video.",
      color: "blue",
      badge: null,
    },
    {
      href: "/interests",
      icon: "🎯",
      title: "Discover Interests",
      desc: "Paste your YouTube search history to see your learning interests across 11 categories.",
      color: "green",
      badge: null,
    },
  ];

  const features = [
    { icon: "📊", title: "PPT Generation", desc: "Auto-generate PowerPoint slides from any lecture transcript with professional dark-themed styling." },
    { icon: "📝", title: "DOCX Notes", desc: "Download full lecture transcripts as formatted Word documents — perfect for offline revision." },
    { icon: "🌍", title: "Translate to 7 Languages", desc: "Urdu, Turkish, Arabic, French, Chinese, Spanish, and Japanese — one click away." },
    { icon: "✂️", title: "Video Clipping", desc: "Trim and download specific segments of YouTube videos for focused study sessions." },
    { icon: "🔍", title: "Smart Detection", desc: "AI analyzes video metadata, title, and description to identify lectures with a confidence score." },
    { icon: "📋", title: "Topic Summary", desc: "Get a summarized text overview of the lecture content with key topics extracted." },
  ];

  return (
    <div className="home-authenticated">
      {/* Welcome Header */}
      <section className="home-welcome">
        <div className="home-welcome-bg" />
        <div className="home-welcome-content animate-fade-up">
          <div className="home-greeting">
            <span className="home-wave">👋</span>
            <h1>
              Welcome back, <span className="gradient-text">{firstName}</span>!
            </h1>
          </div>
          <p className="home-tagline">
            Ready to transform another lecture into study gold? Pick a tool below to get started.
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="home-section">
        <h2 className="home-section-title">
          <span className="home-section-icon">⚡</span>
          Quick Actions
        </h2>
        <div className="home-actions-grid">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="home-action-card">
              <div className="home-action-card-glow" />
              <div className="home-action-header">
                <div className={`home-action-icon ${action.color}`}>
                  {action.icon}
                </div>
                {action.badge && (
                  <span className="home-action-badge">{action.badge}</span>
                )}
              </div>
              <h3>{action.title}</h3>
              <p>{action.desc}</p>
              <span className="home-action-cta">
                Get Started →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Feature Guide */}
      <section className="home-section">
        <h2 className="home-section-title">
          <span className="home-section-icon">🧰</span>
          Everything You Can Do
        </h2>
        <p className="home-section-subtitle">
          Here&apos;s a complete look at all the tools available to supercharge your learning.
        </p>
        <div className="home-features-grid">
          {features.map((f, i) => (
            <div key={i} className="home-feature-card animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="home-feature-icon">{f.icon}</div>
              <div className="home-feature-info">
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works — concise reminder */}
      <section className="home-section">
        <h2 className="home-section-title">
          <span className="home-section-icon">🗺️</span>
          How It Works
        </h2>
        <div className="home-steps">
          <div className="home-step animate-fade-up">
            <div className="home-step-num">1</div>
            <div>
              <h4>Paste a YouTube URL</h4>
              <p>Head to the Dashboard and paste any YouTube video link.</p>
            </div>
          </div>
          <div className="home-step-connector" />
          <div className="home-step animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="home-step-num">2</div>
            <div>
              <h4>Analyze & Detect</h4>
              <p>We detect if it&apos;s a lecture, pull the transcript, and identify key topics.</p>
            </div>
          </div>
          <div className="home-step-connector" />
          <div className="home-step animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="home-step-num">3</div>
            <div>
              <h4>Download Materials</h4>
              <p>Get your PPT, DOCX, translations, video clips — all in one click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-section" style={{ textAlign: "center", paddingBottom: "80px" }}>
        <h2 style={{ fontSize: "1.6rem", marginBottom: "12px" }}>
          Let&apos;s <span className="gradient-text">get started!</span>
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "28px", fontSize: "1rem" }}>
          Head to the Dashboard to analyze your next lecture.
        </p>
        <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: "1.05rem", padding: "16px 36px" }}>
          🚀 Open Dashboard
        </Link>
      </section>
    </div>
  );
}

/* ─── Main Page Component ─── */
export default function Home() {
  const { data: session, status } = useSession();

  // While auth is loading, show a minimal skeleton
  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (session?.user) {
    return <AuthenticatedHome userName={session.user.name || ""} />;
  }

  return <LandingHero />;
}
