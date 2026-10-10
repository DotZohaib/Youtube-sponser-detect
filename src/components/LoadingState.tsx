'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoadingStateProps {
  videoId?: string | null;
}

const STEPS = [
  { label: 'Connecting to YouTube...', desc: 'Verifying video existence and extracting video ID' },
  { label: 'Retrieving captions & transcript...', desc: 'Extracting timestamped subtitles' },
  { label: 'Gemini AI analyzing sponsor segments...', desc: 'Scanning for ad-reads, integrations, and promo codes' },
  { label: 'Validating & parsing timestamps...', desc: 'Structuring brand names and segment time intervals' },
];

export function LoadingState({ videoId }: LoadingStateProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStepIndex(1), 1800);
    const timer2 = setTimeout(() => setCurrentStepIndex(2), 4000);
    const timer3 = setTimeout(() => setCurrentStepIndex(3), 8500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-2xl backdrop-blur-xl animate-fade-in">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600/20 via-neutral-800 to-amber-500/20 border border-neutral-700/60 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white tracking-tight">
          Analyzing YouTube Video
        </h3>
        <p className="text-sm text-neutral-400 mt-1 max-w-md">
          {videoId ? `Video ID: ${videoId} • ` : ''}Gemini AI is scanning timestamped dialogue for commercial endorsements.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="space-y-3.5">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={step.label}
              className={`flex items-start gap-3.5 p-3 rounded-xl transition-all duration-300 ${
                isCurrent
                  ? 'bg-neutral-800/70 border border-neutral-700/80 shadow-sm'
                  : isDone
                  ? 'bg-neutral-900/40 text-neutral-400'
                  : 'opacity-40'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-neutral-700 flex items-center justify-center text-[10px] text-neutral-500">
                    {idx + 1}
                  </div>
                )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div
                  className={`text-sm font-medium ${
                    isCurrent ? 'text-white' : isDone ? 'text-neutral-300' : 'text-neutral-400'
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-xs text-neutral-400 truncate mt-0.5">
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle indicator bar */}
      <div className="mt-6 w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse rounded-full w-full" />
      </div>
    </div>
  );
}
