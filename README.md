# 🎓 Tube Lecture Buddy

[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![NextAuth](https://img.shields.io/badge/NextAuth.js-v5.0-6C5CE7?style=for-the-badge&logo=auth0)](https://next-auth.js.org/)
[![Resend](https://img.shields.io/badge/Resend-Emailing-EA4335?style=for-the-badge&logo=gmail)](https://resend.com/)

**Tube Lecture Buddy** is a state-of-the-art, AI-powered learning assistant designed to transform ordinary YouTube videos and lecture recordings into premium, interactive study guides, lecture notes, slide presentations, and focus clips.

By combining sophisticated natural language processing, video scraping techniques, frame extraction, multi-language translation, and dynamic document generation, Tube Lecture Buddy serves as the ultimate study companion for students and lifetime learners.

---

## ✨ Key Features

### 🔍 1. Smart YouTube Lecture Detection
- Paste any YouTube link, and the system automatically queries metadata, video description, categories, and tags.
- Uses advanced keyword weight heuristics to evaluate whether the video is an educational lecture and provides an instant **confidence score**.

### 📊 2. AI-Powered Lecture PPT Generator
- Automatically chunks video transcripts into logical chronological segments.
- Utilizes `pptxgenjs` to generate highly polished, wide-screen (**16:9**), dark-themed (**Midnight Violet theme**) PowerPoint presentations ready for studying.
- **Visual Lecture Slides**: Captures direct video frames from the YouTube stream at the exact timestamps matching each study topic and merges them side-by-side with your study notes!

### 📝 3. Formatted Study Notes (DOCX)
- Generates beautifully structured, ready-to-print Microsoft Word documents containing the complete lecture transcript.
- Auto-sentences grouping and custom paragraphs prevent wall-of-text fatigue.

### 🌍 4. 7-Language Translation
- Break down global educational barriers with one-click translations.
- Translates transcripts into **Urdu (اردو)**, **Turkish (Türkçe)**, **Arabic (العربية)**, **French (Français)**, **Chinese (中文)**, **Spanish (Español)**, or **Japanese (日本語)**.
- Built-in text splitting handles large transcripts up to several hours long without rate limits.

### ✂️ 5. Custom Video Clipper
- Need to save a specific explanation, lab demonstration, or interview segment? 
- Input starting and ending times, and the server trims, clips, and packages custom **MP4 high-quality video files** (up to 10 minutes) for offline viewing and review.

### 🎯 6. Search History Interest Analyzer
- Import your YouTube search history file to perform high-fidelity category matching.
- Visualizes learning patterns across **22 distinct academic and interest categories** (ranging from Computer Science and Mathematics to Arts, Religion, Philosophy, and Cooking) complete with percentage breakdowns, custom icons, and color-coded tags.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Server Actions, API Routes)
- **UI/UX**: React 19, HSL-tailored CSS Variable variables, Glassmorphism elements, custom micro-animations, and fluid responsive styling.
- **Database**: [MongoDB](https://www.mongodb.com/) & [Mongoose ORM](https://mongoosejs.com/)
- **Authentication**: Next-Auth (v5 Beta) supporting passwordless Email OTP verification, full password recovery workflows, and OAuth 2.0 Google Sign-In.
- **Media Engines**: 
  - **yt-dlp**: Bypasses bot restrictions to download and query raw video/audio links.
  - **FFmpeg**: Generates frame captures on-the-fly and processes video trimming.
- **Integrations**: 
  - **Resend**: Transactional emails for secure account logins and password resets.
  - **React Email**: Gorgeous, branded, responsive HTML email templates.

---

## 📂 Repository Structure

```text
tube-lecture-buddy/
├── bin/                       # Holds local executable binaries (pre-bundled Windows yt-dlp)
├── src/
│   ├── app/                   # Next.js App Router Pages and API Endpoints
│   │   ├── api/               # API Router Routes
│   │   │   ├── analyze/       # Video detection & metadata extraction
│   │   │   ├── clip/          # Video clipping stream endpoint
│   │   │   ├── frames/        # Video frame extraction via FFmpeg
│   │   │   ├── generate-docx/ # DOCX download generator
│   │   │   ├── generate-ppt/  # PowerPoint (PPTX) slide generator
│   │   │   ├── interests/     # Search history category classifier
│   │   │   ├── summarize/     # Transcript key topics summary
│   │   │   ├── topics/        # Transcript segmentation & timeline builder
│   │   │   └── translate/     # Transcript Google-Translate endpoint
│   │   ├── dashboard/         # Study Dashboard view
│   │   ├── clip/              # Video clipper page
│   │   ├── interests/         # Interests analyzer page
│   │   ├── login/ / signup/   # Auth pages
│   │   └── page.tsx           # Multi-state Landing & Home page
│   ├── components/            # Reusable UI React Components
│   ├── emails/                # React-Email templates (OTPs & Resets)
│   ├── lib/                   # Database, Mailer, Ffmpeg, and yt-dlp helper configurations
│   ├── models/                # Mongoose database models (User)
│   └── middleware.ts          # Page routing security middleware
├── package.json               # Package configurations and scripts
└── tsconfig.json              # TypeScript compilation rules
```

---

## ⚡ Prerequisites & Setup

### 1. System Dependencies (FFmpeg & yt-dlp)

Tube Lecture Buddy performs frame capture and video trimming natively on your server/local machine. Ensure the binaries are available:

- **yt-dlp**: 
  - A pre-bundled `yt-dlp.exe` binary is already included in the `bin/` directory for **Windows** environments.
  - For **macOS / Linux** hosts, download the appropriate binary and place it inside the `bin/` directory (make sure to make it executable: `chmod +x bin/yt-dlp`). Alternatively, ensure `yt-dlp` is installed in your system `PATH`.
- **FFmpeg**: 
  - The application depends on `ffmpeg-static` to auto-resolve binary paths.
  - If you run into specialized deployment setups (like serverless functions), ensure `ffmpeg` is available on the system environment path.

### 2. Environment Variables (`.env.local`)

Copy `.env.example` into a new file named `.env.local` and configure your API keys:

```bash
# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/tube-lecture-buddy?retryWrites=true&w=majority

# YouTube Data API Key (Get from Google Cloud Console)
YOUTUBE_API_KEY=your_youtube_api_key_here

# App URL & NextAuth configurations
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_32_character_hex_secret

# Google OAuth Client Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_google_client_secret

# Resend API key for OTP and password recovery emails
RESEND_API_KEY=re_your_resend_api_key
```

> [!TIP]
> To quickly generate a robust `NEXTAUTH_SECRET`, you can run `openssl rand -hex 32` in your terminal.

### Production OAuth settings

For the Vercel deployment at `https://tube-lecture-buddy.vercel.app`, set the production auth URL to the deployed origin, not localhost:

```bash
NEXT_PUBLIC_APP_URL=https://tube-lecture-buddy.vercel.app
AUTH_URL=https://tube-lecture-buddy.vercel.app
AUTH_SECRET=your_generated_32_character_hex_secret
```

`NEXTAUTH_URL` and `NEXTAUTH_SECRET` still work as aliases, but avoid leaving `NEXTAUTH_URL=http://localhost:3000` in Vercel. In Google Cloud Console, add this authorized redirect URI to the OAuth client:

```text
https://tube-lecture-buddy.vercel.app/api/auth/callback/google
```

---

## 🚀 Running the Project Locally

Follow these quick commands to spin up your local instance:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run the Development Server**:
   ```bash
   npm run dev
   ```

3. **Visit the App**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

4. **Verify Production Build**:
   ```bash
   npm run build
   npm run start
   ```

---

## 🛡️ Core Mechanics Explained

### 🎬 How Video Clipping Works
When a clip request is initiated, `yt-dlp` downloads only the specified segment directly from the YouTube streaming server using the `--download-sections` argument and cuts it precisely using the built-in `ffmpeg` parser. The file is temporarily buffered on the disk (`os.tmpdir()`), streamed to the user's browser as `video/mp4`, and immediately deleted to avoid server clutter.

### 📸 How Frame Captures Map into PPTX
1. During lecture analysis, the timeline is chunked into 3-5 minute intervals based on natural semantic pauses.
2. The server spins up an `ffmpeg` worker, seeks directly to the start of each interval, and grabs a single high-quality frame snapshot (scaled to `960x540` to minimize presentation document size).
3. The image is converted into a Base64 string, securely passed to the frontend, and fed into `pptxgenjs` to create wide, gorgeous slides layout combining visual reference frames with structured bullet notes.

### 🔑 Authentication Flow & Mongoose Cache Bypass
- Users register via traditional email (secured with SHA-256 OTP tokens sent through Resend) or directly via Google OAuth.
- For smooth development under Next.js hot reloading, `src/models/User.ts` automatically purges mongoose cached models on startup:
  ```typescript
  if (mongoose.models.User) {
    delete mongoose.models.User;
  }
  ```

---

## 🎓 Contribution & Licensing

Feel free to fork the repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

*Created with ❤️ for students, by the Tube Lecture Buddy development team.*
