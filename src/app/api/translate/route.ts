import { NextRequest, NextResponse } from "next/server";
import translate from "google-translate-api-x";

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang } = await req.json();
    if (!text || !targetLang) {
      return NextResponse.json({ error: "text and targetLang are required" }, { status: 400 });
    }

    // Split into chunks of ~4500 chars to avoid limits
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let current = "";
    for (const sentence of sentences) {
      if ((current + sentence).length > 4500) {
        if (current) chunks.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }
    if (current) chunks.push(current.trim());

    const translated: string[] = [];
    for (const chunk of chunks) {
      try {
        const res = await translate(chunk, { to: targetLang, autoCorrect: true });
        translated.push(res.text);
      } catch {
        // Fallback: try smaller sub-chunks
        const subChunks = chunk.match(/.{1,2000}/g) || [chunk];
        for (const sub of subChunks) {
          try {
            const subRes = await translate(sub, { to: targetLang, autoCorrect: true });
            translated.push(subRes.text);
          } catch {
            translated.push(sub); // keep original if translation fails
          }
        }
      }
      // Small delay between chunks to avoid rate limiting
      await new Promise((r) => setTimeout(r, 300));
    }

    return NextResponse.json({
      translatedText: translated.join(" "),
      targetLang,
      charCount: text.length,
      translatedCharCount: translated.join(" ").length,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json({ error: "Translation failed. Please try again." }, { status: 500 });
  }
}
