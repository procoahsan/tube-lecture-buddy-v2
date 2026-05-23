import { NextRequest, NextResponse } from "next/server";

// Stop words for filtering
const STOP = new Set(["the","a","an","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","can","to","of","in","for","on","with","at","by","from","as","into","through","during","before","after","between","out","off","over","under","again","then","once","here","there","when","where","why","how","all","both","each","few","more","most","other","some","such","no","not","only","same","so","than","too","very","just","because","but","and","or","if","while","about","this","that","these","those","it","its","i","me","my","we","our","you","your","he","him","his","she","her","they","them","their","what","which","who","also","like","get","got","going","go","know","think","make","see","look","really","right","well","now","okay","actually","basically","um","uh","yeah","yes","dont","doesnt","lets","let","say","said","want","come","take","give","tell","call","try","put","keep","still","even","back","much","way","something","anything","thing","things"]);

export async function POST(req: NextRequest) {
  try {
    const { text, ratio = 0.25 } = await req.json();
    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

    // Split into sentences
    const sentences = text
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+|(?<=\w{20,})\s+(?=[A-Z])/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 20);

    if (sentences.length <= 5) {
      return NextResponse.json({ summary: text, sentenceCount: sentences.length });
    }

    // Calculate word frequency
    const wordFreq: Record<string, number> = {};
    for (const sentence of sentences) {
      const words = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
      for (const w of words) {
        if (w.length > 3 && !STOP.has(w)) {
          wordFreq[w] = (wordFreq[w] || 0) + 1;
        }
      }
    }

    // Normalize frequencies
    const maxFreq = Math.max(...Object.values(wordFreq), 1);
    for (const w in wordFreq) wordFreq[w] /= maxFreq;

    // Score each sentence
    const scored = sentences.map((sentence: string, index: number) => {
      const words = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
      let score = 0;
      let count = 0;
      for (const w of words) {
        if (wordFreq[w]) { score += wordFreq[w]; count++; }
      }
      // Normalize by length, boost earlier sentences slightly
      const positionBoost = index < sentences.length * 0.15 ? 1.3 : 1;
      return { sentence, score: count > 0 ? (score / count) * positionBoost : 0, index };
    });

    // Pick top N sentences
    const numSentences = Math.max(5, Math.min(20, Math.floor(sentences.length * ratio)));
    const topSentences = scored
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .slice(0, numSentences)
      .sort((a: { index: number }, b: { index: number }) => a.index - b.index);

    const summary = topSentences.map((s: { sentence: string }) => s.sentence).join(" ");

    return NextResponse.json({
      summary,
      originalSentences: sentences.length,
      summarySentences: topSentences.length,
      compressionRatio: Math.round((1 - summary.length / text.length) * 100),
    });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json({ error: "Summarization failed" }, { status: 500 });
  }
}
