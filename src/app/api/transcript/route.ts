import { NextRequest, NextResponse } from "next/server";
import { extractVideoId } from "@/lib/utils";
import { fetchYouTubeTranscript } from "@/lib/youtubeTranscript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const formatted = await fetchYouTubeTranscript(videoId);

    const fullText = formatted.map((item) => item.text).join(" ");

    return NextResponse.json({
      videoId,
      transcript: formatted,
      fullText,
      wordCount: fullText.split(/\s+/).length,
    });
  } catch (error) {
    console.error("Transcript error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch transcript. The video may not have captions available.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
