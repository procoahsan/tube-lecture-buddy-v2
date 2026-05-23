import { NextRequest, NextResponse } from "next/server";
import { getVideoUrl } from "@/lib/ytdlp";
import ffmpeg from "@/lib/ffmpeg";
import { tmpdir } from "os";
import { join } from "path";
import { readFile, unlink } from "fs/promises";
import { randomUUID } from "crypto";

async function extractFrame(videoUrl: string, timestampSec: number): Promise<string> {
  const outPath = join(tmpdir(), `frame_${randomUUID()}.jpg`);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Frame extraction timeout")), 30000);

    ffmpeg(videoUrl)
      .seekInput(timestampSec)
      .frames(1)
      .outputOptions(["-q:v", "4", "-vf", "scale=960:-1"])
      .output(outPath)
      .on("end", async () => {
        clearTimeout(timeout);
        try {
          const buf = await readFile(outPath);
          await unlink(outPath).catch(() => {});
          resolve(buf.toString("base64"));
        } catch (e) { reject(e); }
      })
      .on("error", (err) => { clearTimeout(timeout); reject(err); })
      .run();
  });
}

export async function POST(req: NextRequest) {
  try {
    const { videoId, timestamps } = await req.json();
    if (!videoId || !timestamps?.length) {
      return NextResponse.json({ error: "videoId and timestamps required" }, { status: 400 });
    }

    // Get direct video URL via yt-dlp (more reliable than ytdl-core)
    let videoUrl: string;
    try {
      videoUrl = await getVideoUrl(videoId, "best[height<=720][ext=mp4]/best[ext=mp4]/best");
    } catch (err) {
      console.error("Failed to get video URL:", err);
      return NextResponse.json({ error: "Could not get video stream URL" }, { status: 500 });
    }

    // Limit to max 20 frames
    const limitedTimestamps = (timestamps as number[]).slice(0, 20);
    const frames: { timestamp: number; image: string | null }[] = [];

    for (const ts of limitedTimestamps) {
      try {
        const base64 = await extractFrame(videoUrl, ts);
        frames.push({ timestamp: ts, image: base64 });
      } catch (err) {
        console.error(`Frame at ${ts}s failed:`, err);
        frames.push({ timestamp: ts, image: null });
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    return NextResponse.json({
      frames,
      total: frames.length,
      captured: frames.filter((f) => f.image !== null).length,
    });
  } catch (error) {
    console.error("Frames error:", error);
    return NextResponse.json({ error: "Failed to extract frames" }, { status: 500 });
  }
}
