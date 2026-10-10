'use client';

import React, { useState } from 'react';
import { extractYouTubeVideoId } from '@/lib/youtube';
import { AnalyzeResponse, AnalyzeSuccessResponse, SponsorSegment } from '@/lib/validation';
import { LoadingState } from '@/components/LoadingState';
import { ResultsDashboard } from '@/components/ResultsDashboard';
import {
  Search,
  Sparkles,
  AlertCircle,
  XCircle,
  ClipboardPaste,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { YoutubeIcon } from '@/components/YoutubeIcon';

const SAMPLE_VIDEOS = [
  {
    label: 'Tech Review (Linus Tech Tips)',
    url: 'https://www.youtube.com/watch?v=kYv_3-Z2y2A',
  },
  {
    label: 'Science (Veritasium)',
    url: 'https://www.youtube.com/watch?v=bHIhgxav9LY',
  },
  {
    label: 'Rick Astley (Music Video - Clean)',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
];

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeSuccessResponse | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setErrorMessage(null);
      }
    } catch {
      // Clipboard access denied
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setErrorMessage('Please enter a YouTube video URL.');
      return;
    }

    // 1. Client-side URL & Video ID Validation
    const videoId = extractYouTubeVideoId(trimmedUrl);
    if (!videoId) {
      setErrorMessage(
        'Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)'
      );
      return;
    }

    // Prevent duplicate requests
    if (isLoading) return;

    setIsLoading(true);
    setActiveVideoId(videoId);
    setErrorMessage(null);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data = (await res.json()) as AnalyzeResponse;

      if (!res.ok || !data.success) {
        const errorText =
          ('error' in data && data.error) ||
          'Failed to analyze video. Please verify the URL and try again.';
        setErrorMessage(errorText);
        setAnalysisResult(null);
      } else {
        setAnalysisResult(data);
      }
    } catch (err: unknown) {
      setErrorMessage('Network error occurred. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setActiveVideoId(null);
    setErrorMessage(null);
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden bg-neutral-950">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-red-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-amber-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-1 flex flex-col items-center">
        {/* Navigation / Header Brand */}
        <header className="w-full flex items-center justify-between mb-12 sm:mb-16">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/20">
              <YoutubeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight block">
                Sponsor<span className="text-red-500">Detector</span>
              </span>
              <span className="text-[11px] text-neutral-400 block -mt-1 font-mono">
                AI Transcript Intelligence
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Powered by Google Gemini</span>
          </div>
        </header>

        {/* Hero Section */}
        {!analysisResult && (
          <div className="w-full text-center max-w-2xl mx-auto space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Smart YouTube Sponsorship & Ad-Read Detection</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              YouTube Sponsor Detector
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 max-w-xl mx-auto leading-relaxed">
              Find sponsored segments in YouTube videos using AI-powered transcript analysis.
            </p>
          </div>
        )}

        {/* Search URL Form */}
        {!analysisResult && (
          <div className="w-full max-w-2xl mx-auto mb-8">
            <form onSubmit={handleSubmit} className="relative group">
              <div className="relative flex items-center rounded-2xl bg-neutral-900/90 border border-neutral-800 focus-within:border-red-500/60 focus-within:ring-2 focus-within:ring-red-500/20 shadow-2xl transition-all duration-200">
                <div className="pl-4 sm:pl-5 text-neutral-400 flex items-center pointer-events-none">
                  <YoutubeIcon className="w-6 h-6 text-red-500" />
                </div>

                <input
                  id="youtube-url-input"
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isLoading}
                  placeholder="Paste YouTube link (e.g., https://www.youtube.com/watch?v=...)"
                  className="w-full py-4 pl-3.5 pr-28 sm:pr-40 bg-transparent text-sm sm:text-base text-white placeholder-neutral-500 focus:outline-none disabled:opacity-50"
                  autoComplete="off"
                />

                <div className="absolute right-2 sm:right-2.5 flex items-center gap-1.5">
                  {!url && (
                    <button
                      type="button"
                      onClick={handlePaste}
                      disabled={isLoading}
                      className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-750 rounded-lg transition-colors"
                      title="Paste from clipboard"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Paste</span>
                    </button>
                  )}

                  <button
                    id="detect-sponsors-btn"
                    type="submit"
                    disabled={isLoading || !url.trim()}
                    className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all shadow-md shadow-red-600/20 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Search className="w-4 h-4" />
                    <span>Detect Sponsors</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Samples */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-400">
              <span className="text-neutral-500">Try sample:</span>
              {SAMPLE_VIDEOS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setUrl(sample.url);
                    setErrorMessage(null);
                  }}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="w-full max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-red-950/40 border border-red-900/60 text-red-200 flex items-start gap-3 animate-fade-in">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm leading-relaxed">
              <strong className="font-semibold block text-red-300 mb-0.5">Analysis Notice</strong>
              {errorMessage}
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-200 transition-colors p-1"
              aria-label="Dismiss error"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && <LoadingState videoId={activeVideoId} />}

        {/* Results Dashboard */}
        {!isLoading && analysisResult && (
          <ResultsDashboard
            videoId={analysisResult.videoId}
            videoTitle={analysisResult.videoTitle}
            channelName={analysisResult.channelName}
            sponsors={analysisResult.sponsors}
            modelUsed={analysisResult.modelUsed}
            onReset={handleReset}
          />
        )}

        {/* Feature Highlights (when not showing results) */}
        {!analysisResult && !isLoading && (
          <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-neutral-900 text-left">
            <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-850">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mb-3">
                <Clock className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Precision Timestamps</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Extracts start and end times with one-click direct jump links to the sponsor segment on YouTube.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-850">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Gemini AI Detection</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Detects commercial ad reads, brand mentions, and discount codes from dialogue transcripts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-850">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Zero Sign-In Required</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Paste any public YouTube video link with captions and get instant structured sponsorship intelligence.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-neutral-900/80 py-6 text-center text-xs text-neutral-400 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © 2026 YouTube Sponsor Detector. Built for creators and viewers.
          </div>
          <div className="text-[11px] text-neutral-400">
            Powered by Next.js Serverless & Google Gemini
          </div>
        </div>
      </footer>
    </div>
  );
}
