import { execFile } from "child_process";
import { join } from "path";
import { existsSync } from "fs";

// Find yt-dlp binary
function findYtDlp(): string {
  const candidates = [
    join(process.cwd(), "bin", "yt-dlp.exe"),
    join(process.cwd(), "bin", "yt-dlp"),
    "yt-dlp",
  ];
  for (const p of candidates) {
    if (p === "yt-dlp" || existsSync(p)) return p;
  }
  return "yt-dlp";
}

const YT_DLP = findYtDlp();

export function ytdlpExec(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(YT_DLP, args, { maxBuffer: 50 * 1024 * 1024, timeout: 120000 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export async function getVideoInfo(videoId: string) {
  const output = await ytdlpExec([
    "--dump-json",
    "--no-download",
    `https://www.youtube.com/watch?v=${videoId}`,
  ]);
  return JSON.parse(output);
}

export async function getVideoUrl(videoId: string, format = "best[ext=mp4]/best"): Promise<string> {
  const output = await ytdlpExec([
    "-f", format,
    "--get-url",
    `https://www.youtube.com/watch?v=${videoId}`,
  ]);
  return output.split("\n")[0];
}

export async function downloadClip(
  videoId: string,
  outputPath: string,
  startTime: number,
  endTime: number
): Promise<void> {
  const duration = endTime - startTime;
  const ffmpegPath = findFfmpeg();

  // Download section using yt-dlp's built-in --download-sections
  await ytdlpExec([
    "-f", "best[ext=mp4]/best",
    "--download-sections", `*${startTime}-${endTime}`,
    "--force-keyframes-at-cuts",
    "--ffmpeg-location", ffmpegPath,
    "-o", outputPath,
    `https://www.youtube.com/watch?v=${videoId}`,
  ]);
}

function findFfmpeg(): string {
  const candidates = [
    join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe"),
    join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg"),
    "ffmpeg",
  ];
  for (const p of candidates) {
    if (p === "ffmpeg" || existsSync(p)) return p;
  }
  return "ffmpeg";
}

export { findFfmpeg };
export default { ytdlpExec, getVideoInfo, getVideoUrl, downloadClip };
