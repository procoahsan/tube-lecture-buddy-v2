import { NextRequest, NextResponse } from "next/server";
import { extractVideoId, detectLecture } from "@/lib/utils";

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

    const apiKey = process.env.YOUTUBE_API_KEY;

    // If no API key, use a fallback approach using oEmbed
    if (!apiKey) {
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (!oembedRes.ok) throw new Error("Video not found");
        const oembed = await oembedRes.json();

        const detection = detectLecture(oembed.title || "", "", [], "");
        return NextResponse.json({
          videoId,
          title: oembed.title,
          channel: oembed.author_name,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          description: "",
          duration: "",
          isLecture: detection.isLecture,
          confidence: detection.confidence,
          reasons: detection.reasons,
        });
      } catch {
        return NextResponse.json({
          videoId,
          title: "Video Found",
          channel: "Unknown",
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          description: "",
          duration: "",
          isLecture: false,
          confidence: 0,
          reasons: ["Unable to fetch video metadata. Add YOUTUBE_API_KEY for better detection."],
        });
      }
    }

    // Use YouTube Data API
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
    );
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const detection = detectLecture(
      snippet.title,
      snippet.description,
      snippet.tags || [],
      snippet.categoryId
    );

    return NextResponse.json({
      videoId,
      title: snippet.title,
      channel: snippet.channelTitle,
      thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url,
      description: snippet.description,
      duration: video.contentDetails?.duration,
      publishedAt: snippet.publishedAt,
      viewCount: video.statistics?.viewCount,
      isLecture: detection.isLecture,
      confidence: detection.confidence,
      reasons: detection.reasons,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: "Failed to analyze video" }, { status: 500 });
  }
}
