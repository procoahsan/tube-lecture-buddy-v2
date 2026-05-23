"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { extractVideoId, formatTime, parseTimeToSeconds } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
// YouTube IFrame API types
interface YTPlayer {
  destroy(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number;
}

interface YTPlayerOptions {
  videoId: string;
  width: string;
  height: string;
  playerVars?: Record<string, any>;
  events?: {
    onStateChange?: (event: { data: number }) => void;
    onReady?: (event: any) => void;
  };
}

interface YTNamespace {
  Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT: YTNamespace;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export default function ClipPage() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [startTime, setStartTime] = useState("0:00");
  const [endTime, setEndTime] = useState("1:00");
  const [clipReady, setClipReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(0);

  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const ytReadyRef = useRef(false);
  const endTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const monitorRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load YouTube IFrame API script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      ytReadyRef.current = true;
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript.parentNode?.insertBefore(tag, firstScript);

    window.onYouTubeIframeAPIReady = () => {
      ytReadyRef.current = true;
    };

    return () => {
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (monitorRef.current) clearInterval(monitorRef.current);
    };
  }, []);

  const initPlayer = useCallback((vid: string) => {
    const waitForYT = () => {
      if (!ytReadyRef.current || !window.YT?.Player) {
        setTimeout(waitForYT, 200);
        return;
      }

      // Destroy old player if exists
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
        playerRef.current = null;
      }

      // Need a fresh div for the player
      if (playerContainerRef.current) {
        playerContainerRef.current.innerHTML = '<div id="yt-player-target"></div>';
      }

      playerRef.current = new window.YT.Player("yt-player-target", {
        videoId: vid,
        width: "100%",
        height: "100%",
        playerVars: {
          modestbranding: 1,
          rel: 0,
          fs: 1,
        },
        events: {
          onStateChange: (event: { data: number }) => {
            // When video ends or is paused during preview, stop monitoring
            // YT PlayerState: PAUSED=2, ENDED=0
            if (event.data === 2 || event.data === 0) {
              if (monitorRef.current) {
                clearInterval(monitorRef.current);
                monitorRef.current = null;
              }
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              if (event.data === 0) { // ENDED
                setIsPreviewing(false);
              }
            }
          },
        },
      });
    };

    waitForYT();
  }, []);

  // Initialize player when videoId changes and clip is ready
  useEffect(() => {
    if (videoId && clipReady) {
      initPlayer(videoId);
    }
  }, [videoId, clipReady, initPlayer]);

  const loadVideo = async () => {
    const id = extractVideoId(url);
    if (!id) { setError("Invalid YouTube URL"); return; }
    setVideoId(id);
    setError("");
    setClipReady(false);
    setLoading(true);
    setLoadingAction("Loading video info...");
    setIsPreviewing(false);

    // Cleanup existing player
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (monitorRef.current) { clearInterval(monitorRef.current); monitorRef.current = null; }

    try {
      const res = await fetch(`/api/clip?videoId=${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVideoTitle(data.title);
      setVideoDuration(data.duration);
      setEndTime(formatTime(Math.min(60, data.duration)));
      setClipReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load video");
    } finally {
      setLoading(false);
      setLoadingAction("");
    }
  };

  const previewClip = () => {
    if (!videoId || !playerRef.current) return;
    const start = parseTimeToSeconds(startTime);
    const end = parseTimeToSeconds(endTime);
    if (end <= start) { setError("End time must be after start time"); return; }
    if (end > videoDuration) { setError("End time exceeds video duration"); return; }
    setError("");

    endTimeRef.current = end;
    const clipDuration = end - start;

    // Clear any existing timers
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (monitorRef.current) { clearInterval(monitorRef.current); monitorRef.current = null; }

    // Seek to start and play
    const player = playerRef.current;
    player.seekTo(start, true);
    player.playVideo();

    setIsPreviewing(true);
    setPreviewTimeLeft(clipDuration);

    // Update countdown timer every second
    timerRef.current = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const currentTime = playerRef.current.getCurrentTime();
        const remaining = Math.max(0, endTimeRef.current - currentTime);
        setPreviewTimeLeft(Math.ceil(remaining));
      } catch {
        // player might not be ready
      }
    }, 500);

    // Monitor playback to enforce end time boundary
    monitorRef.current = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const currentTime = playerRef.current.getCurrentTime();
        if (currentTime >= endTimeRef.current) {
          playerRef.current.pauseVideo();
          setIsPreviewing(false);
          setPreviewTimeLeft(0);
          if (monitorRef.current) { clearInterval(monitorRef.current); monitorRef.current = null; }
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        }
      } catch {
        // player might not be ready
      }
    }, 250);
  };

  const downloadClip = async () => {
    if (!videoId) return;
    const start = parseTimeToSeconds(startTime);
    const end = parseTimeToSeconds(endTime);
    if (end <= start) { setError("End time must be after start time"); return; }
    if (end - start > 600) { setError("Max clip duration is 10 minutes"); return; }

    setLoading(true);
    setLoadingAction("Downloading and trimming video...");
    setDownloadProgress(10);
    setError("");

    try {
      // Simulate progress while waiting
      const progressInterval = setInterval(() => {
        setDownloadProgress((p) => Math.min(p + 5, 85));
      }, 2000);

      const res = await fetch("/api/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, startTime: start, endTime: end }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Download failed");
      }

      setDownloadProgress(95);
      const blob = await res.blob();
      setDownloadProgress(100);

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(videoTitle || "clip").replace(/[^a-zA-Z0-9]/g, "_")}_${start}s_${end}s.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
      setLoadingAction("");
      setDownloadProgress(0);
    }
  };

  const startSec = parseTimeToSeconds(startTime);
  const endSec = parseTimeToSeconds(endTime);
  const duration = Math.max(0, endSec - startSec);

  return (
    <div className="dashboard-container">
      <div className="url-input-section animate-fade-up">
        <h2 style={{ marginBottom: "8px" }}>✂️ Video Clipper</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "20px", fontSize: "0.95rem" }}>
          Trim any YouTube video — set start and end times, preview, and download the clip
        </p>
        <div className="url-input-wrapper">
          <input
            id="clip-url-input"
            type="text"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadVideo()}
          />
          <button className="btn btn-primary" onClick={loadVideo} disabled={!url.trim() || loading}>
            {loading && !clipReady ? "⏳ Loading..." : "📺 Load Video"}
          </button>
        </div>
      </div>

      {error && (
        <div className="result-panel" style={{ borderLeft: "3px solid var(--red)" }}>
          <p style={{ color: "var(--red)" }}>❌ {error}</p>
        </div>
      )}

      {videoId && clipReady && (
        <>
          {/* Video Info */}
          <div className="result-panel animate-fade-up">
            <h3>🎬 {videoTitle || "Video"}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>
              Total duration: {formatTime(videoDuration)}
            </p>

            {/* Preview Player (YouTube IFrame API) */}
            <div className="video-preview" style={{ position: "relative" }}>
              <div ref={playerContainerRef} style={{ width: "100%", height: "100%" }}>
                <div id="yt-player-target"></div>
              </div>
              {isPreviewing && (
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(8px)",
                    color: "#fff",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    zIndex: 10,
                    border: "1px solid rgba(255,255,255,0.15)",
                    pointerEvents: "none",
                  }}
                >
                  <span style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#ef4444",
                    animation: "pulse 1.5s infinite",
                    display: "inline-block",
                  }} />
                  CLIP PREVIEW — {formatTime(previewTimeLeft)} left
                </div>
              )}
            </div>

            {/* Clip Controls */}
            <div className="clip-controls">
              <label>
                ⏱️ Start Time (m:ss or h:mm:ss)
                <input id="start-time-input" type="text" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="0:00" />
              </label>
              <label>
                ⏱️ End Time
                <input id="end-time-input" type="text" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="1:00" />
              </label>
              <button className="btn btn-secondary" onClick={previewClip} disabled={loading}>
                ▶️ Preview Clip
              </button>
              <button className="btn btn-primary" onClick={downloadClip} disabled={loading || duration <= 0}>
                {loading ? "⏳ Downloading..." : "⬇️ Download Clip (.mp4)"}
              </button>
            </div>

            <div className="time-display">
              <span>🎬 Start: <strong>{startTime}</strong></span>
              <span style={{ color: "var(--text-muted)" }}>→</span>
              <span>🏁 End: <strong>{endTime}</strong></span>
              <span style={{ color: "var(--text-muted)" }}>|</span>
              <span>⏱️ Duration: <strong>{formatTime(duration)}</strong></span>
            </div>

            {duration > 600 && (
              <p style={{ color: "var(--orange)", fontSize: "0.85rem", marginTop: "8px" }}>
                ⚠️ Max clip duration is 10 minutes. Please shorten your selection.
              </p>
            )}
          </div>

          {/* Download Progress */}
          {loadingAction && (
            <div className="result-panel animate-fade-up">
              <h3>⬇️ {loadingAction}</h3>
              <div className="progress-bar" style={{ height: "8px", marginTop: "12px" }}>
                <div className="progress-bar-fill" style={{ width: `${downloadProgress}%` }} />
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "8px", textAlign: "center" }}>
                {downloadProgress < 30 && "Fetching video stream..."}
                {downloadProgress >= 30 && downloadProgress < 70 && "Trimming video with ffmpeg..."}
                {downloadProgress >= 70 && downloadProgress < 95 && "Finalizing clip..."}
                {downloadProgress >= 95 && "Download starting..."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
