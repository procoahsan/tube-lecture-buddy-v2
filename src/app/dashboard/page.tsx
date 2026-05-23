"use client";
import { useState, useRef } from "react";
import { LANGUAGES } from "@/lib/utils";

interface VideoInfo {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  description: string;
  isLecture: boolean;
  confidence: number;
  reasons: string[];
}

interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

interface Topic {
  id: number;
  timestamp: string;
  endTimestamp: string;
  offsetMs: number;
  title: string;
  keywords: string[];
  summary: string;
  wordCount: number;
}

interface FrameData {
  timestamp: number;
  image: string | null;
}

export default function DashboardPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [fullText, setFullText] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [translatedText, setTranslatedText] = useState("");
  const [selectedLang, setSelectedLang] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"transcript" | "topics" | "translate" | "summary">("transcript");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadAction, setDownloadAction] = useState("");

  const languageSectionRef = useRef<HTMLDivElement>(null);

  const analyzeVideo = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setLoadingAction("Analyzing video...");
    setError("");
    setVideoInfo(null);
    setTranscript([]);
    setFullText("");
    setTopics([]);
    setFrames([]);
    setTranslatedText("");
    setSummaryText("");

    try {
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const analyzeData = await analyzeRes.json();
      if (analyzeData.error) throw new Error(analyzeData.error);
      setVideoInfo(analyzeData);

      setLoadingAction("Fetching transcript...");
      const transcriptRes = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const transcriptData = await transcriptRes.json();
      if (transcriptData.error) throw new Error(transcriptData.error);
      setTranscript(transcriptData.transcript);
      setFullText(transcriptData.fullText);

      setLoadingAction("Extracting topics & timestamps...");
      const topicsRes = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptData.transcript }),
      });
      const topicsData = await topicsRes.json();
      if (!topicsData.error) setTopics(topicsData.topics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  };

  const captureFramesAndDownloadPPT = async () => {
    if (!fullText || topics.length === 0 || !videoInfo) return;
    setDownloadLoading(true);
    setDownloadAction("Capturing video frames for PPT...");
    setError("");

    try {
      // Prepare timestamps: pick evenly spaced topics, max 20
      const step = Math.max(1, Math.floor(topics.length / 20));
      const selectedTopics = topics.filter((_, i) => i % step === 0).slice(0, 20);
      const timestamps = selectedTopics.map((t) => {
        const parts = t.timestamp.split(":").map(Number);
        return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
      });

      let capturedFrames: FrameData[] = [];

      try {
        const framesRes = await fetch("/api/frames", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: videoInfo.videoId, timestamps }),
        });
        const framesData = await framesRes.json();
        if (!framesData.error) {
          capturedFrames = framesData.frames;
          setFrames(capturedFrames);
        }
      } catch {
        console.warn("Frame capture failed, generating PPT without frames");
      }

      setDownloadAction("Generating study material PPT...");
      const pptRes = await fetch("/api/generate-ppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: videoInfo.title,
          channel: videoInfo.channel,
          topics,
          transcript,
          frames: capturedFrames,
        }),
      });

      if (!pptRes.ok) throw new Error((await pptRes.json()).error || "PPT generation failed");

      setDownloadAction("Downloading PPT...");
      const blob = await pptRes.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(videoInfo.title || "lecture").replace(/[^a-zA-Z0-9]/g, "_")}_study_material.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PPT");
    } finally {
      setDownloadLoading(false);
      setDownloadAction("");
    }
  };

  const downloadDOCX = async () => {
    if (!fullText) return;
    setDownloadLoading(true);
    setDownloadAction("Generating DOCX document...");
    try {
      const res = await fetch("/api/generate-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: videoInfo?.title, transcript: fullText, channel: videoInfo?.channel }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "DOCX failed");
      setDownloadAction("Downloading DOCX...");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(videoInfo?.title || "lecture").replace(/[^a-zA-Z0-9]/g, "_")}_transcript.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "DOCX failed");
    } finally {
      setDownloadLoading(false);
      setDownloadAction("");
    }
  };

  const summarizeTranscript = async () => {
    if (!fullText) return;
    setDownloadLoading(true);
    setDownloadAction("Summarizing transcript...");
    setSummaryText("");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummaryText(data.summary);
      setActiveTab("summary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Summarization failed");
    } finally {
      setDownloadLoading(false);
      setDownloadAction("");
    }
  };

  const translateTranscript = async (langCode: string) => {
    if (!fullText) return;
    setSelectedLang(langCode);
    setDownloadLoading(true);
    setDownloadAction(`Translating to ${LANGUAGES.find((l) => l.code === langCode)?.name}...`);
    setTranslatedText("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText, targetLang: langCode }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTranslatedText(data.translatedText);
      setActiveTab("translate");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setDownloadLoading(false);
      setDownloadAction("");
    }
  };

  const downloadTranslation = () => {
    if (!translatedText) return;
    const lang = LANGUAGES.find((l) => l.code === selectedLang);
    const blob = new Blob([translatedText], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `transcript_${lang?.name || selectedLang}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const jumpToTimestamp = (offsetMs: number) => {
    const seconds = Math.floor(offsetMs / 1000);
    const iframe = document.querySelector(".video-preview iframe") as HTMLIFrameElement;
    if (iframe && videoInfo) iframe.src = `https://www.youtube.com/embed/${videoInfo.videoId}?start=${seconds}&autoplay=1`;
  };

  const handleTranslateTabClick = () => {
    if (translatedText) {
      setActiveTab("translate");
    } else {
      // Scroll to language selector to guide the user
      languageSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      // Briefly highlight the language section
      languageSectionRef.current?.classList.add("highlight-pulse");
      setTimeout(() => {
        languageSectionRef.current?.classList.remove("highlight-pulse");
      }, 2000);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="url-input-section">
        <h2 style={{ marginBottom: "8px" }}>📺 Analyze YouTube Video</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "20px", fontSize: "0.95rem" }}>
          Paste a YouTube lecture URL to detect, transcribe, extract topics, translate, and generate study materials
        </p>
        <div className="url-input-wrapper">
          <input
            id="youtube-url-input"
            type="text"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyzeVideo()}
          />
          <button id="analyze-btn" className="btn btn-primary" onClick={analyzeVideo} disabled={loading || !url.trim()}>
            {loading ? "⏳ Analyzing..." : "🔍 Analyze"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loader">
          <div className="loader-spinner" />
          <p className="loader-text">{loadingAction}</p>
        </div>
      )}

      {error && (
        <div className="result-panel" style={{ borderLeft: "3px solid var(--red)" }}>
          <p style={{ color: "var(--red)" }}>❌ {error}</p>
        </div>
      )}

      {/* Download/Processing Loading Overlay */}
      {downloadLoading && (
        <div className="result-panel animate-fade-up" style={{ borderLeft: "3px solid var(--accent)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div className="loader-spinner" style={{ width: "32px", height: "32px", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "8px" }}>⏳ {downloadAction}</h3>
              <div className="progress-bar" style={{ height: "6px" }}>
                <div className="progress-bar-fill" style={{ width: "60%" }} />
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "6px" }}>
                Please wait, this may take a moment...
              </p>
            </div>
          </div>
        </div>
      )}

      {videoInfo && (
        <>
          {/* Video Info */}
          <div className="result-panel animate-fade-up">
            <h3>🎬 Video Information</h3>
            <div className="video-preview">
              <iframe
                src={`https://www.youtube.com/embed/${videoInfo.videoId}`}
                title={videoInfo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <h3 style={{ marginTop: "16px", fontSize: "1.1rem" }}>{videoInfo.title}</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "12px" }}>{videoInfo.channel}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span className={`status-badge ${videoInfo.isLecture ? "success" : "warning"}`}>
                {videoInfo.isLecture ? "✅ Lecture Detected" : "⚠️ May Not Be a Lecture"}
              </span>
              <span className="status-badge info">🎯 Confidence: {videoInfo.confidence}%</span>
            </div>
            {videoInfo.reasons.length > 0 && (
              <ul style={{ marginTop: "12px", paddingLeft: "20px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                {videoInfo.reasons.map((r, i) => <li key={i} style={{ marginBottom: "4px" }}>{r}</li>)}
              </ul>
            )}
          </div>

          {/* Topics */}
          {topics.length > 0 && (
            <div className="result-panel animate-fade-up delay-1">
              <h3>📋 Topics & Timestamps</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "4px" }}>
                {topics.length} topics detected — click to jump to timestamp
              </p>
              <div className="topics-timeline">
                {topics.map((topic) => (
                  <div key={topic.id} className="topic-item" onClick={() => jumpToTimestamp(topic.offsetMs)}>
                    <div className="topic-timestamp">
                      <span className="topic-num">Topic {topic.id}</span>
                      {topic.timestamp}
                    </div>
                    <div className="topic-content">
                      <h4>{topic.title}</h4>
                      <p>{topic.summary}</p>
                      {topic.keywords.length > 0 && (
                        <div className="topic-keywords">
                          {topic.keywords.map((kw) => <span key={kw} className="topic-keyword">{kw}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages — MOVED ABOVE TRANSCRIPT */}
          {fullText && (
            <div
              ref={languageSectionRef}
              className="result-panel animate-fade-up delay-2"
              style={{ transition: "box-shadow 0.3s ease, border-color 0.3s ease" }}
            >
              <h3>🌍 Translate Full Transcript</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "12px" }}>
                Select a language to translate the complete transcript — it will appear in the Translation tab below
              </p>
              <div className="language-grid">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    className="language-card"
                    onClick={() => translateTranscript(lang.code)}
                    disabled={downloadLoading}
                    style={{
                      borderColor: selectedLang === lang.code ? "var(--accent)" : undefined,
                      background: selectedLang === lang.code ? "var(--accent-glow)" : undefined,
                    }}
                  >
                    <span className="flag">{lang.flag}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{lang.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{lang.nativeName}</div>
                    </div>
                    {selectedLang === lang.code && translatedText && (
                      <span style={{ marginLeft: "auto", color: "var(--green)", fontSize: "0.85rem" }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transcript & Notes */}
          {(fullText || transcript.length > 0) && (
            <div className="result-panel animate-fade-up delay-3">
              <h3>📝 Transcript & Notes</h3>
              <div className="tabs" style={{ flexWrap: "wrap" }}>
                <button className={`tab ${activeTab === "transcript" ? "active" : ""}`} onClick={() => setActiveTab("transcript")}>
                  Transcript
                </button>
                <button className={`tab ${activeTab === "summary" ? "active" : ""}`} onClick={() => setActiveTab("summary")} disabled={!summaryText}>
                  Summary {summaryText && "✓"}
                </button>
                <button className={`tab ${activeTab === "topics" ? "active" : ""}`} onClick={() => setActiveTab("topics")} disabled={topics.length === 0}>
                  Topics View
                </button>
                <button
                  className={`tab ${activeTab === "translate" ? "active" : ""}`}
                  onClick={handleTranslateTabClick}
                  title={!translatedText ? "Select a language above to translate" : undefined}
                >
                  Translation {translatedText ? `(${LANGUAGES.find((l) => l.code === selectedLang)?.flag})` : "🌍"}
                </button>
              </div>

              {activeTab === "transcript" && <div className="transcript-box">{fullText || "No transcript available"}</div>}
              {activeTab === "summary" && summaryText && <div className="transcript-box" style={{ background: "rgba(108,92,231,0.08)", borderLeft: "3px solid var(--accent)" }}>{summaryText}</div>}
              {activeTab === "topics" && topics.length > 0 && (
                <div className="transcript-box">
                  {topics.map((t) => (
                    <div key={t.id} style={{ marginBottom: "20px" }}>
                      <strong style={{ color: "var(--accent)" }}>[{t.timestamp} - {t.endTimestamp}]</strong>{" "}
                      <strong style={{ color: "var(--text-primary)" }}>{t.title}</strong>
                      <br /><span style={{ fontSize: "0.85rem" }}>{t.summary}</span>
                      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "12px 0" }} />
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "translate" && translatedText && (
                <div className="transcript-box" style={{ direction: ["ur", "ar"].includes(selectedLang) ? "rtl" : "ltr" }}>{translatedText}</div>
              )}
              {activeTab === "translate" && !translatedText && (
                <div className="transcript-box" style={{ textAlign: "center", padding: "40px 20px" }}>
                  <p style={{ fontSize: "2rem", marginBottom: "12px" }}>🌍</p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "8px" }}>
                    No translation yet
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Select a language from the <strong>&quot;Translate Full Transcript&quot;</strong> section above to see the translation here.
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: "16px" }}
                    onClick={() => languageSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  >
                    ⬆️ Go to Languages
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="download-actions">
                <button className="btn btn-primary btn-sm" onClick={summarizeTranscript} disabled={downloadLoading || !!summaryText}>
                  {summaryText ? "✅ Summarized" : "🧠 Summarize"}
                </button>
                <button className="btn btn-primary btn-sm" onClick={captureFramesAndDownloadPPT} disabled={downloadLoading || topics.length === 0}>
                  📊 Download Study PPT {frames.length > 0 && "(with frames)"}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={downloadDOCX} disabled={downloadLoading}>
                  📄 Download DOCX
                </button>
                {translatedText && (
                  <button className="btn btn-secondary btn-sm" onClick={downloadTranslation}>💾 Download Translation</button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
