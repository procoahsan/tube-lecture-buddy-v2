import { YoutubeTranscript } from "youtube-transcript";

export interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

interface CaptionTrack {
  baseUrl?: string;
  languageCode?: string;
  kind?: string;
  name?: {
    simpleText?: string;
    runs?: Array<{ text?: string }>;
  };
}

interface TimedTextTrack {
  langCode: string;
  name: string;
  kind: string;
}

const WEB_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const MOBILE_USER_AGENT = "com.google.android.youtube/20.10.38 (Linux; U; Android 14)";

const DEFAULT_HEADERS = {
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://www.youtube.com",
  Referer: "https://www.youtube.com/",
};

function getCookieHeader(): string | undefined {
  const cookie = process.env.YOUTUBE_TRANSCRIPT_COOKIE || process.env.YOUTUBE_COOKIES;
  return cookie?.trim() || undefined;
}

async function youtubeFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(DEFAULT_HEADERS)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  if (!headers.has("User-Agent")) headers.set("User-Agent", WEB_USER_AGENT);

  const cookie = getCookieHeader();
  if (cookie && !headers.has("Cookie")) headers.set("Cookie", cookie);

  return fetch(input, {
    ...init,
    cache: "no-store",
    headers,
  });
}

function normalizeTranscript(items: TranscriptItem[]): TranscriptItem[] {
  return items
    .map((item) => ({
      text: decodeEntities(String(item.text || "")).replace(/\s+/g, " ").trim(),
      offset: Number(item.offset) || 0,
      duration: Number(item.duration) || 0,
    }))
    .filter((item) => item.text.length > 0);
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function captionLabel(track: CaptionTrack): string {
  return (
    track.name?.simpleText ||
    track.name?.runs?.map((run) => run.text || "").join("") ||
    track.languageCode ||
    ""
  ).toLowerCase();
}

function chooseCaptionTrack(tracks: CaptionTrack[]): CaptionTrack | undefined {
  const usable = tracks.filter((track) => track.baseUrl);
  return (
    usable.find((track) => track.languageCode === "en" && track.kind !== "asr") ||
    usable.find((track) => track.languageCode?.startsWith("en")) ||
    usable.find((track) => track.kind !== "asr") ||
    usable.find((track) => captionLabel(track).includes("english")) ||
    usable[0]
  );
}

function parseJson3Transcript(body: string): TranscriptItem[] {
  const data = JSON.parse(body) as {
    events?: Array<{
      tStartMs?: number;
      dDurationMs?: number;
      segs?: Array<{ utf8?: string }>;
    }>;
  };

  return normalizeTranscript(
    (data.events || []).map((event) => ({
      text: (event.segs || [])
        .map((segment) => segment.utf8 || "")
        .join("")
        .replace(/\n/g, " "),
      offset: event.tStartMs || 0,
      duration: event.dDurationMs || 0,
    }))
  );
}

function parseXmlTranscript(body: string): TranscriptItem[] {
  const classic = [...body.matchAll(/<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g)].map(
    (match) => ({
      text: decodeEntities(match[3]),
      offset: Math.round(parseFloat(match[1]) * 1000),
      duration: Math.round(parseFloat(match[2]) * 1000),
    })
  );
  if (classic.length > 0) return normalizeTranscript(classic);

  return normalizeTranscript(
    [...body.matchAll(/<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g)].map((match) => ({
      text: decodeEntities(match[3].replace(/<[^>]+>/g, "")),
      offset: parseInt(match[1], 10),
      duration: parseInt(match[2], 10),
    }))
  );
}

async function fetchTrackTranscript(track: CaptionTrack): Promise<TranscriptItem[]> {
  if (!track.baseUrl) return [];

  const url = new URL(track.baseUrl);
  url.searchParams.set("fmt", "json3");

  const jsonResponse = await youtubeFetch(url, {
    headers: {
      "User-Agent": WEB_USER_AGENT,
      Referer: "https://www.youtube.com/",
    },
  });

  if (jsonResponse.ok) {
    const text = await jsonResponse.text();
    try {
      const parsed = parseJson3Transcript(text);
      if (parsed.length > 0) return parsed;
    } catch {
      const parsed = parseXmlTranscript(text);
      if (parsed.length > 0) return parsed;
    }
  }

  const xmlResponse = await youtubeFetch(track.baseUrl, {
    headers: {
      "User-Agent": WEB_USER_AGENT,
      Referer: "https://www.youtube.com/",
    },
  });
  if (!xmlResponse.ok) return [];

  return parseXmlTranscript(await xmlResponse.text());
}

async function fetchViaInnerTube(videoId: string): Promise<TranscriptItem[]> {
  const clients = [
    {
      clientName: "ANDROID",
      clientVersion: "20.10.38",
      userAgent: MOBILE_USER_AGENT,
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "20.10.38",
        },
      },
    },
    {
      clientName: "WEB",
      clientVersion: "2.20260724.00.00",
      userAgent: WEB_USER_AGENT,
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20260724.00.00",
          hl: "en",
          gl: "US",
        },
      },
    },
  ];

  for (const client of clients) {
    const response = await youtubeFetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": client.userAgent,
        "X-YouTube-Client-Name": client.clientName === "ANDROID" ? "3" : "1",
        "X-YouTube-Client-Version": client.clientVersion,
      },
      body: JSON.stringify({
        context: client.context,
        videoId,
      }),
    });

    if (!response.ok) continue;

    const data = await response.json();
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!Array.isArray(tracks) || tracks.length === 0) continue;

    const track = chooseCaptionTrack(tracks);
    if (!track) continue;

    const transcript = await fetchTrackTranscript(track);
    if (transcript.length > 0) return transcript;
  }

  return [];
}

function parseTimedTextTrackList(body: string): TimedTextTrack[] {
  return [...body.matchAll(/<track\s+([^>]+)>/g)].map((match) => {
    const attrs = match[1];
    const readAttr = (name: string) =>
      decodeEntities(attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1] || "");

    return {
      langCode: readAttr("lang_code"),
      name: readAttr("name"),
      kind: readAttr("kind"),
    };
  });
}

function chooseTimedTextTrack(tracks: TimedTextTrack[]): TimedTextTrack | undefined {
  return (
    tracks.find((track) => track.langCode === "en" && track.kind !== "asr") ||
    tracks.find((track) => track.langCode.startsWith("en")) ||
    tracks.find((track) => track.kind !== "asr") ||
    tracks[0]
  );
}

async function fetchViaTimedText(videoId: string): Promise<TranscriptItem[]> {
  const listUrl = new URL("https://video.google.com/timedtext");
  listUrl.searchParams.set("type", "list");
  listUrl.searchParams.set("v", videoId);

  const listResponse = await youtubeFetch(listUrl, {
    headers: {
      "User-Agent": WEB_USER_AGENT,
      Referer: `https://www.youtube.com/watch?v=${videoId}`,
    },
  });
  if (!listResponse.ok) return [];

  const track = chooseTimedTextTrack(parseTimedTextTrackList(await listResponse.text()));
  if (!track) return [];

  const transcriptUrl = new URL("https://video.google.com/timedtext");
  transcriptUrl.searchParams.set("v", videoId);
  transcriptUrl.searchParams.set("lang", track.langCode);
  transcriptUrl.searchParams.set("fmt", "json3");
  if (track.name) transcriptUrl.searchParams.set("name", track.name);
  if (track.kind) transcriptUrl.searchParams.set("kind", track.kind);

  const response = await youtubeFetch(transcriptUrl, {
    headers: {
      "User-Agent": WEB_USER_AGENT,
      Referer: `https://www.youtube.com/watch?v=${videoId}`,
    },
  });
  if (!response.ok) return [];

  const body = await response.text();
  try {
    return parseJson3Transcript(body);
  } catch {
    return parseXmlTranscript(body);
  }
}

function isLikelyBotBlock(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /captcha|too many requests|sign in to confirm|unusual traffic|robot/i.test(message);
}

function transcriptUnavailableMessage(error: unknown): string {
  if (isLikelyBotBlock(error)) {
    return (
      "YouTube blocked transcript requests from the deployed server. " +
      "Set YOUTUBE_TRANSCRIPT_COOKIE in production or use a deployment/proxy with a residential IP."
    );
  }

  return "Failed to fetch transcript. The video may not have public captions available.";
}

export async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptItem[]> {
  const errors: unknown[] = [];

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { fetch: youtubeFetch });
    const normalized = normalizeTranscript(transcript);
    if (normalized.length > 0) return normalized;
  } catch (error) {
    errors.push(error);
  }

  for (const fetcher of [fetchViaInnerTube, fetchViaTimedText]) {
    try {
      const transcript = await fetcher(videoId);
      if (transcript.length > 0) return transcript;
    } catch (error) {
      errors.push(error);
    }
  }

  const botBlock = errors.find(isLikelyBotBlock);
  throw new Error(transcriptUnavailableMessage(botBlock || errors[0]));
}
