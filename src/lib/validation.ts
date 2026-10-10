export interface SponsorSegment {
  brand: string;
  startTime: string; // MM:SS or HH:MM:SS
  endTime: string;   // MM:SS or HH:MM:SS
  summary: string;
  duration?: string; // Calculated (e.g. "1m 27s")
  startSeconds?: number;
  endSeconds?: number;
}

export interface AnalyzeSuccessResponse {
  success: true;
  videoId: string;
  videoTitle?: string;
  channelName?: string;
  sponsors: SponsorSegment[];
  modelUsed?: string;
}

export interface AnalyzeErrorResponse {
  success: false;
  error: string;
}

export type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeErrorResponse;

/**
 * Converts a timestamp string (MM:SS or HH:MM:SS) into total seconds.
 */
export function parseTimestampToSeconds(timestamp: string): number {
  if (!timestamp || typeof timestamp !== 'string') return 0;
  
  // Clean whitespace and any unexpected characters
  const cleaned = timestamp.trim().replace(/[^\d:]/g, '');
  const parts = cleaned.split(':').map((p) => parseInt(p, 10));
  
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }

  return 0;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS.
 */
export function formatSecondsToTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Calculates human-readable duration between two timestamp strings (e.g., "1m 27s").
 */
export function calculateDuration(startTime: string, endTime: string): string {
  const startSec = parseTimestampToSeconds(startTime);
  const endSec = parseTimestampToSeconds(endTime);

  const diffSec = Math.max(0, endSec - startSec);
  if (diffSec === 0) return '< 1s';

  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;

  if (mins > 0 && secs > 0) {
    return `${mins}m ${secs}s`;
  } else if (mins > 0) {
    return `${mins}m`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Validates and sanitizes sponsor segments returned from Gemini.
 * Discards malformed or non-compliant entries.
 */
export function validateSponsorSegments(data: unknown): SponsorSegment[] {
  if (!Array.isArray(data)) {
    return [];
  }

  const validSegments: SponsorSegment[] = [];

  for (const item of data) {
    if (
      item &&
      typeof item === 'object' &&
      typeof item.brand === 'string' &&
      typeof item.startTime === 'string' &&
      typeof item.endTime === 'string' &&
      typeof item.summary === 'string'
    ) {
      const brand = item.brand.trim();
      const startTime = item.startTime.trim();
      const endTime = item.endTime.trim();
      const summary = item.summary.trim();

      if (!brand || !startTime || !endTime) {
        continue;
      }

      const startSec = parseTimestampToSeconds(startTime);
      const endSec = parseTimestampToSeconds(endTime);

      validSegments.push({
        brand,
        startTime,
        endTime,
        summary,
        duration: calculateDuration(startTime, endTime),
        startSeconds: startSec,
        endSeconds: endSec,
      });
    }
  }

  // Sort chronologically by start time
  return validSegments.sort((a, b) => (a.startSeconds ?? 0) - (b.startSeconds ?? 0));
}
