import { NextRequest, NextResponse } from "next/server";
import { extractVideoId } from "@/lib/utils";
import { getVideoInfo, downloadClip } from "@/lib/ytdlp";
import { tmpdir } from "os";
import { join } from "path";
import { readFile, unlink } from "fs/promises";
import { randomUUID } from "crypto";

// GET: Video info
export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });

  try {
    const info = await getVideoInfo(videoId);
    return NextResponse.json({
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
    });
  } catch (error) {
    console.error("Clip info error:", error);
    return NextResponse.json({ error: "Could not fetch video info" }, { status: 500 });
  }
}

// POST: Download trimmed clip
export async function POST(req: NextRequest) {
  try {
    const { url, startTime, endTime } = await req.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    const videoId = extractVideoId(url);
    if (!videoId) return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });

    const start = Number(startTime) || 0;
    const end = Number(endTime) || 60;
    const duration = end - start;

    if (duration <= 0) return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    if (duration > 600) return NextResponse.json({ error: "Max clip duration is 10 minutes" }, { status: 400 });

    const outPath = join(tmpdir(), `clip_${randomUUID()}.mp4`);

    await downloadClip(videoId, outPath, start, end);

    const buffer = await readFile(outPath);
    await unlink(outPath).catch(() => {});

    // Get video title for filename
    let title = "clip";
    try {
      const info = await getVideoInfo(videoId);
      title = info.title || "clip";
    } catch {}

    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${safeTitle}_${start}s_${end}s.mp4"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Clip error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create clip";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
