import ffmpeg from "fluent-ffmpeg";
import { join } from "path";
import { existsSync } from "fs";

// Resolve ffmpeg path properly - ffmpeg-static path gets mangled by bundlers
function resolveFfmpegPath(): string {
  // Try common locations
  const candidates = [
    // Direct node_modules path (works in dev)
    join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe"),
    join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg"),
    // Try dynamic require
  ];

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }

  // Fallback: try to get it from the package
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const staticPath = require("ffmpeg-static");
    if (staticPath && existsSync(staticPath)) return staticPath;
  } catch {}

  // Last resort: assume ffmpeg is in system PATH
  return "ffmpeg";
}

const ffmpegPath = resolveFfmpegPath();
ffmpeg.setFfmpegPath(ffmpegPath);

export { ffmpeg };
export default ffmpeg;
