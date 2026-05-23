export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function parseTimeToSeconds(time: string): number {
  const parts = time.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export const LANGUAGES = [
  { code: "ur", name: "Urdu", flag: "🇵🇰", nativeName: "اردو" },
  { code: "tr", name: "Turkish", flag: "🇹🇷", nativeName: "Türkçe" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", nativeName: "العربية" },
  { code: "fr", name: "French", flag: "🇫🇷", nativeName: "Français" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", nativeName: "中文" },
  { code: "es", name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
] as const;

// Lecture detection keywords
export const LECTURE_KEYWORDS = [
  "lecture", "tutorial", "course", "class", "lesson", "education",
  "university", "professor", "academic", "seminar", "workshop",
  "training", "learning", "teach", "study", "syllabus", "curriculum",
  "exam", "assignment", "chapter", "module", "engineering", "science",
  "mathematics", "physics", "chemistry", "biology", "history",
  "programming", "coding", "algorithm", "data structure", "machine learning",
  "artificial intelligence", "calculus", "statistics", "economics",
  "psychology", "philosophy", "literature", "anatomy", "medical",
  "accounting", "finance", "management", "law", "architecture",
];

export const LECTURE_CATEGORIES = [
  "27", // Education
  "28", // Science & Technology
];

export function detectLecture(title: string, description: string, tags: string[], categoryId: string): {
  isLecture: boolean;
  confidence: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;
  const combined = `${title} ${description} ${tags.join(" ")}`.toLowerCase();

  // Check category
  if (LECTURE_CATEGORIES.includes(categoryId)) {
    score += 25;
    reasons.push("Video category is Education or Science & Technology");
  }

  // Check keywords in title (most important)
  const titleLower = title.toLowerCase();
  const titleMatches = LECTURE_KEYWORDS.filter((k) => titleLower.includes(k));
  if (titleMatches.length > 0) {
    score += Math.min(30, titleMatches.length * 10);
    reasons.push(`Title contains lecture keywords: ${titleMatches.slice(0, 3).join(", ")}`);
  }

  // Check keywords in description
  const descMatches = LECTURE_KEYWORDS.filter((k) => combined.includes(k));
  if (descMatches.length > 2) {
    score += Math.min(25, descMatches.length * 5);
    reasons.push(`Description contains ${descMatches.length} educational keywords`);
  }

  // Check for numbered patterns (Lecture 1, Chapter 2, etc.)
  if (/(?:lecture|chapter|module|lesson|part|session|week)\s*[\d#]/i.test(combined)) {
    score += 15;
    reasons.push("Contains numbered lecture/chapter pattern");
  }

  // Check video duration pattern in title (1:30:00 format = long form)
  if (/\d+:\d{2}:\d{2}/.test(title)) {
    score += 10;
    reasons.push("Title contains long-form timestamp");
  }

  // Check for university/institution names
  if (/(?:university|institute|college|mit|stanford|harvard|coursera|udemy|khan\s*academy)/i.test(combined)) {
    score += 20;
    reasons.push("Associated with educational institution or platform");
  }

  const confidence = Math.min(100, score);
  return {
    isLecture: confidence >= 40,
    confidence,
    reasons,
  };
}
