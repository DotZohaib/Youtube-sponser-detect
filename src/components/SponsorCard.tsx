'use client';

import React, { useState } from 'react';
import { SponsorSegment } from '@/lib/validation';
import { Play, Clock, Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react';

interface SponsorCardProps {
  sponsor: SponsorSegment;
  videoId: string;
  index: number;
}

export function SponsorCard({ sponsor, videoId, index }: SponsorCardProps) {
  const [copied, setCopied] = useState(false);

  // Build direct jump link to YouTube timestamp
  const startSeconds = sponsor.startSeconds ?? 0;
  const youtubeTimestampUrl = `https://www.youtube.com/watch?v=${videoId}&t=${startSeconds}s`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(youtubeTimestampUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  return (
    <div className="group relative rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700/80 p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-red-950/10">
      {/* Top row: Brand & Duration Badge */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-red-400">
                Sponsor #{index + 1}
              </span>
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight break-words">
              {sponsor.brand}
            </h4>
          </div>
        </div>

        {/* Duration badge */}
        {sponsor.duration && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700/60">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Duration: {sponsor.duration}</span>
          </div>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-neutral-300 leading-relaxed mb-5">
        {sponsor.summary}
      </p>

      {/* Timestamp info & Action buttons */}
      <div className="pt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Timestamp Interval */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium">Segment:</span>
          <div className="inline-flex items-center gap-1.5 font-mono text-sm px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-amber-300">
            <span>{sponsor.startTime}</span>
            <span className="text-neutral-500">→</span>
            <span>{sponsor.endTime}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Copy timestamp link"
            title="Copy timestamp link"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-700/60 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Jump to video on YouTube */}
          <a
            href={youtubeTimestampUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-sm transition-all hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Jump to {sponsor.startTime}</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>
      </div>
    </div>
  );
}
