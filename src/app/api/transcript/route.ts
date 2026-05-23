import { NextRequest, NextResponse } from "next/server";
import { extractVideoId } from "@/lib/utils";
import { YoutubeTranscript } from "youtube-transcript";

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

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    const formatted = transcript.map((item) => ({
      text: item.text,
      offset: item.offset,
      duration: item.duration,
    }));

    const fullText = formatted.map((item) => item.text).join(" ");

    return NextResponse.json({
      videoId,
      transcript: formatted,
      fullText,
      wordCount: fullText.split(/\s+/).length,
    });
  } catch (error) {
    console.error("Transcript error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcript. The video may not have captions available." },
      { status: 500 }
    );
  }
}
