# 🎯 YouTube Sponsor Detector

A production-ready, full-stack Next.js web application that automatically retrieves YouTube video transcripts and uses Google Gemini AI to detect sponsored segments, commercial ad-reads, and brand integrations with accurate timestamps and summaries.

---

## ⚡ Features

- **Multi-Format YouTube URL Support**: Accepts standard watch URLs, short URLs (`youtu.be`), embed links, and Shorts (`youtube.com/shorts/...`).
- **Automated Caption & Transcript Extraction**: Extracts timestamped captions via `youtube-transcript`.
- **Google Gemini AI Analysis**: Leverages Google Gemini models (`gemini-3.8-flash` with automatic fallback to `gemini-flash-latest`, `gemini-3.1-flash-lite`, and `gemini-3.7-flash`).
- **Precision Timestamps & Duration**: Automatically converts segment intervals and calculates duration (e.g., `1m 14s`).
- **One-Click Jump Links**: Direct playback button to jump immediately to the sponsor segment on YouTube.
- **Copy Timestamp Link**: Copy deep-linked YouTube video URLs to your clipboard.
- **Resilient Fallback Pipeline**: Gracefully handles model rate limits (429), high-demand spikes (503), disabled captions, or non-captioned videos.
- **Enterprise-Grade UI/UX**: Minimalist dark interface with subtle glassmorphic styling, responsive layout, accessible elements, and zero horizontal scroll.

---

## 🏗️ Architecture & Pipeline Flow

```text
User Enters YouTube URL
        ↓
Client & Server URL Validation
        ↓
Extract 11-Character YouTube Video ID
        ↓
Concurrent Fetch:
  ├── Video Metadata (oEmbed: Title & Channel)
  └── Subtitle Transcripts (youtube-transcript)
        ↓
Normalize Offsets & Build Timestamped Transcript:
  "[00:00] Intro... [01:15] This video is sponsored by..."
        ↓
Send to Google Gemini AI API with Strict JSON Constraints
        ↓
Automatic Model Fallback (gemini-3.8-flash → gemini-flash-latest → gemini-3.1-flash-lite)
        ↓
Sanitize & Validate Structured JSON Response
        ↓
Calculate Durations & Sort Chronologically
        ↓
Render Results Dashboard with Precision Timestamps & Jump Links
```

---

## 📁 Project Structure

```text
youtube-sponsor-detector/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analyze/
│   │   │       └── route.ts         # Serverless API endpoint (POST /api/analyze)
│   │   ├── globals.css              # Custom styling & animations
│   │   ├── layout.tsx               # Root layout & SEO metadata
│   │   └── page.tsx                 # Responsive homepage with search & samples
│   ├── components/
│   │   ├── LoadingState.tsx         # Multi-step animated progress indicator
│   │   ├── ResultsDashboard.tsx     # Video preview, sponsor cards, & empty state
│   │   ├── SponsorCard.tsx          # Card with timestamps, duration, and jump link
│   │   └── YoutubeIcon.tsx          # Standalone SVG YouTube brand icon
│   └── lib/
│       ├── gemini.ts                # Gemini API integration & resilient fallback logic
│       ├── validation.ts            # Type definitions, duration math, & segment sanitizer
│       └── youtube.ts               # Video ID parser, oEmbed metadata, & transcript builder
├── .env.local                       # Local environment variables (API keys)
├── .env.example                     # Environment template for deployment
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Installation & Local Development

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd sponser
npm install
```

Required packages:
```bash
npm install @google/generative-ai youtube-transcript lucide-react
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Google Gemini API Key from Google AI Studio (https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Configurable Gemini Model (optional, defaults to gemini-3.8-flash with fallback)
GEMINI_MODEL=gemini-3.8-flash
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deploying to Vercel

1. Push your code to a GitHub, GitLab, or Bitbucket repository:
   ```bash
   git add .
   git commit -m "feat: complete YouTube Sponsor Detector"
   git push origin main
   ```
2. Navigate to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key from Google AI Studio.
   - `GEMINI_MODEL`: `gemini-3.8-flash` (or leave default).
5. Click **Deploy**.

---

## 🔒 Security Practices

- **Zero Client Exposure**: The Gemini API key is strictly maintained in server-side environment variables (`GEMINI_API_KEY`) and never prefixed with `NEXT_PUBLIC_`.
- **SSRF & Input Sanitization**: URL validation and regex extraction ensure only valid 11-character YouTube video IDs are processed.
- **Graceful Error Obfuscation**: Internal stack traces or raw API error bodies are sanitized into clear user-friendly notifications.

---

## ⚠️ Known Limitations

- **Transcript Dependent**: Analysis requires that the video has available captions/subtitles (either auto-generated or creator-provided).
- **Audio-Only Context**: Sponsorships that are purely visual (such as a discreet on-screen logo watermark or visual product placement without spoken endorsement) will not appear in transcript dialogue.
