'use client';

import React from 'react';
import { SponsorSegment } from '@/lib/validation';
import { SponsorCard } from './SponsorCard';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { YoutubeIcon } from './YoutubeIcon';

interface ResultsDashboardProps {
  videoId: string;
  videoTitle?: string;
  channelName?: string;
  sponsors: SponsorSegment[];
  modelUsed?: string;
  onReset: () => void;
}

export function ResultsDashboard({
  videoId,
  videoTitle,
  channelName,
  sponsors,
  modelUsed,
  onReset,
}: ResultsDashboardProps) {
  const hasSponsors = sponsors.length > 0;
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
      {/* Top Header & Reset Action */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Analyze another video</span>
        </button>

        {modelUsed && (
          <div className="inline-flex items-center gap-1.5 text-xs text-neutral-400 font-mono bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI: {modelUsed}</span>
          </div>
        )}
      </div>

      {/* Video Summary Card */}
      <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          {/* Thumbnail */}
          <div className="relative group w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-neutral-950 flex-shrink-0 border border-neutral-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt={videoTitle || `YouTube video ${videoId}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
            >
              <YoutubeIcon className="w-8 h-8 text-red-500" />
            </a>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                <YoutubeIcon className="w-3.5 h-3.5 text-red-500" />
                ID: {videoId}
              </span>
              {channelName && (
                <span className="text-xs text-neutral-400">
                  by <strong className="text-neutral-300 font-medium">{channelName}</strong>
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight line-clamp-2">
              {videoTitle || `Video ${videoId}`}
            </h3>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {hasSponsors ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {sponsors.length} {sponsors.length === 1 ? 'Sponsor' : 'Sponsors'} Detected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Clean Video • 0 Sponsors Detected
                </span>
              )}

              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                <span>Watch on YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Sponsors Content */}
      {hasSponsors ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-white tracking-tight">
              Detected Sponsored Segments ({sponsors.length})
            </h4>
            <span className="text-xs text-neutral-400">
              Ordered chronologically by appearance
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {sponsors.map((sponsor, idx) => (
              <SponsorCard
                key={`${sponsor.brand}-${sponsor.startTime}-${idx}`}
                sponsor={sponsor}
                videoId={videoId}
                index={idx}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Empty / No Sponsors State */
        <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800/80 p-8 sm:p-12 text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>

          <h4 className="text-xl font-bold text-white tracking-tight">
            No sponsored content detected.
          </h4>

          <p className="text-sm text-neutral-300 max-w-lg mx-auto mt-2 leading-relaxed">
            Gemini analyzed the video transcript and identified no commercial ad-reads, paid integrations, or promotional segments.
          </p>

          <div className="mt-6 inline-flex items-start gap-2 max-w-md mx-auto text-left p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-400">
            <Info className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
            <span>
              Note: Detection is based strictly on transcript and caption analysis. Sponsorships that are purely visual, undisclosed, or omitted in captions may not be detected.
            </span>
          </div>
        </div>
      )}

      {/* Accuracy Disclaimer Footer */}
      <div className="p-4 rounded-xl bg-neutral-950/50 border border-neutral-800/60 flex items-start gap-3 text-xs text-neutral-400">
        <AlertCircle className="w-4 h-4 text-amber-500/80 flex-shrink-0 mt-0.5" />
        <p>
          <strong className="text-neutral-300">Accuracy Notice:</strong> Sponsor detection is powered by AI transcript analysis.
          While highly accurate for verbal promotional segments, it may miss visual-only brand overlays, physical product placements, or sponsorships not reflected in public captions.
        </p>
      </div>
    </div>
  );
}
