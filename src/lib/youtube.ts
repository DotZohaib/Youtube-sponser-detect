import {
  YoutubeTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
} from 'youtube-transcript';
import { formatSecondsToTimestamp } from './validation';

/**
 * Extracts a YouTube Video ID (11 characters) from various YouTube URL formats.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - Raw 11-char video ID strings
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // If directly an 11-character YouTube ID (alphanumeric with - and _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex covering standard watch, short URLs, embeds, and shorts
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
    /(?:youtube\.com\/live\/)([\w-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }

  return null;
}

export interface VideoMetadata {
  title?: string;
  author?: string;
  thumbnailUrl?: string;
}

/**
 * Retrieves unauthenticated video metadata via YouTube oEmbed.
 * Fails safely if unavailable without raising an unhandled error.
 */
export async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const metadata: VideoMetadata = {
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YouTubeSponsorDetector/1.0)',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        if (typeof data.title === 'string' && data.title.trim()) {
          metadata.title = data.title.trim();
        }
        if (typeof data.author_name === 'string' && data.author_name.trim()) {
          metadata.author = data.author_name.trim();
        }
      }
    }
  } catch {
    // If oEmbed fails (e.g., restricted video or network glitch), proceed without title
  }

  return metadata;
}

/**
 * Fetches the transcript for a YouTube video and transforms it into timestamped lines:
 * e.g., "[01:23] Sponsor message here..."
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptItems || transcriptItems.length === 0) {
      throw new Error('NO_TRANSCRIPT');
    }

    // Determine if offsets/durations are in milliseconds or seconds.
    // YouTube InnerTube srv3 format returns milliseconds (e.g. 15000ms),
    // whereas classic XML returns seconds (e.g. 15.0s).
    const maxOffset = Math.max(...transcriptItems.map((item) => item.offset || 0));
    const maxDuration = Math.max(...transcriptItems.map((item) => item.duration || 0));
    const isMilliseconds = maxOffset > 5000 || maxDuration > 100;

    // Group close lines together to make the transcript compact and easy for Gemini to parse
    const formattedLines: string[] = [];
    let currentBucketSecond = -1;
    let currentBucketText: string[] = [];

    for (const item of transcriptItems) {
      const rawOffset = item.offset || 0;
      const seconds = Math.floor(isMilliseconds ? rawOffset / 1000 : rawOffset);
      const text = (item.text || '')
        .replace(/[\n\r]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (!text) continue;

      // Group every ~10-15 seconds or on timestamp changes to keep timestamps accurate but concise
      if (currentBucketSecond === -1) {
        currentBucketSecond = seconds;
        currentBucketText.push(text);
      } else if (seconds - currentBucketSecond >= 10) {
        const timestamp = formatSecondsToTimestamp(currentBucketSecond);
        formattedLines.push(`[${timestamp}] ${currentBucketText.join(' ')}`);
        currentBucketSecond = seconds;
        currentBucketText = [text];
      } else {
        currentBucketText.push(text);
      }
    }

    if (currentBucketText.length > 0) {
      const timestamp = formatSecondsToTimestamp(Math.max(0, currentBucketSecond));
      formattedLines.push(`[${timestamp}] ${currentBucketText.join(' ')}`);
    }

    const fullTranscript = formattedLines.join('\n');

    if (!fullTranscript.trim()) {
      throw new Error('EMPTY_TRANSCRIPT');
    }

    return fullTranscript;
  } catch (error: unknown) {
    if (error instanceof YoutubeTranscriptDisabledError) {
      throw new Error('CAPTIONS_DISABLED');
    }
    if (error instanceof YoutubeTranscriptNotAvailableError) {
      throw new Error('TRANSCRIPT_NOT_AVAILABLE');
    }
    if (error instanceof YoutubeTranscriptVideoUnavailableError) {
      throw new Error('VIDEO_UNAVAILABLE');
    }
    if (error instanceof YoutubeTranscriptTooManyRequestError) {
      throw new Error('RATE_LIMITED');
    }
    if (error instanceof Error) {
      if (error.message === 'NO_TRANSCRIPT' || error.message === 'EMPTY_TRANSCRIPT') {
        throw error;
      }
      // Re-throw with original message or classification
      throw new Error(error.message);
    }
    throw new Error('TRANSCRIPT_FETCH_FAILED');
  }
}
