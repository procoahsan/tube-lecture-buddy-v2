import { NextRequest, NextResponse } from "next/server";

interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Common filler/stop words to exclude from topic extraction
const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "as", "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "both",
  "each", "few", "more", "most", "other", "some", "such", "no", "nor",
  "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "because", "but", "and", "or", "if", "while", "about", "against",
  "this", "that", "these", "those", "it", "its", "i", "me", "my",
  "we", "our", "you", "your", "he", "him", "his", "she", "her",
  "they", "them", "their", "what", "which", "who", "whom", "also",
  "like", "get", "got", "going", "go", "know", "think", "thing",
  "things", "make", "see", "look", "really", "right", "well", "now",
  "okay", "actually", "basically", "um", "uh", "yeah", "yes", "no",
  "dont", "dont", "doesnt", "lets", "let", "say", "said", "want",
  "come", "take", "give", "tell", "call", "try", "put", "keep",
  "still", "even", "back", "much", "way", "something", "anything",
]);

function extractKeyPhrases(text: string): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
  const filtered = words.filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  // Count word frequency
  const freq: Record<string, number> = {};
  for (const w of filtered) {
    freq[w] = (freq[w] || 0) + 1;
  }

  // Get top words by frequency
  const sorted = Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);

  // Also extract 2-word phrases (bigrams)
  const bigrams: Record<string, number> = {};
  for (let i = 0; i < filtered.length - 1; i++) {
    const bigram = `${filtered[i]} ${filtered[i + 1]}`;
    bigrams[bigram] = (bigrams[bigram] || 0) + 1;
  }

  const topBigrams = Object.entries(bigrams)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([phrase]) => phrase);

  // Combine and capitalize
  const combined = [...topBigrams, ...sorted].slice(0, 5);
  return combined.map((p) =>
    p.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  );
}

function generateTopicTitle(keywords: string[], segmentText: string): string {
  if (keywords.length === 0) return "General Discussion";

  // Try to find a meaningful phrase from the text
  const sentences = segmentText.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  if (sentences.length > 0) {
    // Use the first meaningful sentence fragment as base
    const firstSentence = sentences[0].trim();
    if (firstSentence.length < 80) {
      return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
    }
  }

  // Fallback: combine top keywords
  return keywords.slice(0, 3).join(", ");
}

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json({ error: "Transcript array is required" }, { status: 400 });
    }

    const items: TranscriptItem[] = transcript;

    // Group transcript items into segments (~3-5 minutes each)
    const SEGMENT_DURATION_MS = 3 * 60 * 1000; // 3 minutes
    const segments: { startOffset: number; endOffset: number; text: string }[] = [];

    let currentSegment = { startOffset: items[0].offset, endOffset: 0, text: "" };

    for (const item of items) {
      currentSegment.text += item.text + " ";
      currentSegment.endOffset = item.offset + item.duration;

      if (item.offset - currentSegment.startOffset >= SEGMENT_DURATION_MS) {
        segments.push({ ...currentSegment, text: currentSegment.text.trim() });
        currentSegment = { startOffset: item.offset, endOffset: 0, text: "" };
      }
    }
    // Push the last segment
    if (currentSegment.text.trim()) {
      segments.push({ ...currentSegment, text: currentSegment.text.trim() });
    }

    // Generate topics for each segment
    const topics = segments.map((seg, index) => {
      const keywords = extractKeyPhrases(seg.text);
      const title = generateTopicTitle(keywords, seg.text);

      return {
        id: index + 1,
        timestamp: formatTimestamp(seg.startOffset),
        endTimestamp: formatTimestamp(seg.endOffset),
        offsetMs: seg.startOffset,
        title,
        keywords,
        summary: seg.text.slice(0, 200) + (seg.text.length > 200 ? "..." : ""),
        wordCount: seg.text.split(/\s+/).length,
      };
    });

    return NextResponse.json({
      topics,
      totalTopics: topics.length,
      totalDuration: formatTimestamp(items[items.length - 1].offset + items[items.length - 1].duration),
    });
  } catch (error) {
    console.error("Topics error:", error);
    return NextResponse.json({ error: "Failed to generate topics" }, { status: 500 });
  }
}
