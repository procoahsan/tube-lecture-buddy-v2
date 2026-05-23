"use client";
import { useState } from "react";

interface Interest {
  category: string;
  score: number;
  matchedTerms: string[];
  matchedSearches: string[];
  percentage: number;
  icon: string;
  color: string;
}

export default function InterestsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [interests, setInterests] = useState<Interest[]>([]);
  const [totalSearches, setTotalSearches] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const analyzeInterests = async () => {
    const searches = searchInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (searches.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searches }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInterests(data.interests);
      setTotalSearches(data.totalSearches);
      setAnalyzed(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="search-input-section animate-fade-up">
        <h2 style={{ marginBottom: "8px" }}>🎯 Discover Your Interests</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "20px", fontSize: "0.95rem" }}>
          Paste your YouTube search queries (one per line) and we&apos;ll analyze your interests across 22 categories — from academics to entertainment
        </p>
        <textarea
          id="search-input"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={`python tutorial for beginners
ertugrul drama season 5
biryani recipe
marvel movie trailer 2026
psl highlights
gym workout for beginners
how to fix laptop
calculus lecture MIT
k-drama recommendations
free fire gameplay
...`}
          style={{
            width: "100%",
            minHeight: "180px",
            resize: "vertical",
            fontFamily: "var(--font-primary)",
            fontSize: "0.9rem",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-tertiary)",
            border: "2px solid var(--border)",
            color: "var(--text-primary)",
            lineHeight: "1.8",
          }}
        />
        <button
          id="analyze-interests-btn"
          className="btn btn-primary"
          onClick={analyzeInterests}
          disabled={loading || !searchInput.trim()}
          style={{ marginTop: "16px" }}
        >
          {loading ? "⏳ Analyzing..." : "🔍 Analyze My Interests"}
        </button>
      </div>

      {loading && (
        <div className="loader">
          <div className="loader-spinner" />
          <p className="loader-text">Analyzing your search patterns...</p>
        </div>
      )}

      {analyzed && interests.length === 0 && !loading && (
        <div className="result-panel">
          <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
            🤔 No interests detected. Try adding more search queries — we support 22 categories including entertainment, music, cooking, gaming, and more!
          </p>
        </div>
      )}

      {interests.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <h3 style={{ fontSize: "1.3rem" }}>
              📊 Your Interest Profile
            </h3>
            <span className="status-badge info" style={{ fontSize: "0.85rem" }}>
              📋 {totalSearches} searches analyzed → {interests.length} categories matched
            </span>
          </div>
          <div className="interests-grid">
            {interests.map((interest, index) => (
              <div
                key={interest.category}
                className="interest-card animate-fade-up"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <div className={`card-icon ${interest.color || "purple"}`} style={{ width: "44px", height: "44px", marginBottom: 0, fontSize: "1.3rem" }}>
                    {interest.icon || "📘"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: "1rem" }}>{interest.category}</h4>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {interest.score} {interest.score === 1 ? "match" : "matches"}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: "1.1rem" }}>
                    {interest.percentage}%
                  </span>
                </div>
                <div className="interest-bar">
                  <div
                    className="interest-bar-fill"
                    style={{ width: `${interest.percentage}%` }}
                  />
                </div>

                {/* Matched keywords */}
                <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {interest.matchedTerms.slice(0, 6).map((term) => (
                    <span key={term} className="interest-tag">{term}</span>
                  ))}
                  {interest.matchedTerms.length > 6 && (
                    <span className="interest-tag" style={{ opacity: 0.6 }}>+{interest.matchedTerms.length - 6} more</span>
                  )}
                </div>

                {/* Example matching searches */}
                {interest.matchedSearches && interest.matchedSearches.length > 0 && (
                  <div style={{ marginTop: "10px", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Example searches:
                    </span>
                    <div style={{ marginTop: "4px" }}>
                      {interest.matchedSearches.slice(0, 3).map((s, i) => (
                        <p key={i} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: "2px 0" }}>
                          &quot;{s}&quot;
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
