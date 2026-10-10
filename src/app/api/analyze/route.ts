import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeVideoId, fetchVideoMetadata, fetchYouTubeTranscript } from '@/lib/youtube';
import { analyzeTranscriptWithGemini } from '@/lib/gemini';
import { AnalyzeResponse } from '@/lib/validation';


export async function POST(req: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload received.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || !('url' in body)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid YouTube video URL.' },
        { status: 400 }
      );
    }

    const { url } = body as { url: unknown };

    if (typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { success: false, error: 'YouTube URL cannot be empty.' },
        { status: 400 }
      );
    }

    // 1. Extract and validate YouTube Video ID
    const videoId = extractYouTubeVideoId(url.trim());
    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid YouTube URL. Please enter a valid YouTube video link (e.g., https://www.youtube.com/watch?v=...).',
        },
        { status: 400 }
      );
    }

    // 2. Check server-side Gemini API key
    if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_API_KEY.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini API key is missing. Please configure GEMINI_API_KEY in your environment variables.',
        },
        { status: 500 }
      );
    }

    // 3. Concurrently fetch Video Metadata (oEmbed) and Captions Transcript
    const [metadataResult, transcriptResult] = await Promise.allSettled([
      fetchVideoMetadata(videoId),
      fetchYouTubeTranscript(videoId),
    ]);

    const metadata = metadataResult.status === 'fulfilled' ? metadataResult.value : {};

    // 4. Handle transcript retrieval result
    if (transcriptResult.status === 'rejected') {
      const err = transcriptResult.reason;
      const errMsg = err instanceof Error ? err.message : String(err);

      if (errMsg === 'CAPTIONS_DISABLED') {
        return NextResponse.json(
          {
            success: false,
            error: "We couldn't retrieve captions for this video. The creator may have disabled closed captions.",
          },
          { status: 422 }
        );
      }

      if (errMsg === 'TRANSCRIPT_NOT_AVAILABLE' || errMsg === 'NO_TRANSCRIPT') {
        return NextResponse.json(
          {
            success: false,
            error: 'No transcript is available for this video. Spoken captions are required for AI analysis.',
          },
          { status: 404 }
        );
      }

      if (errMsg === 'VIDEO_UNAVAILABLE') {
        return NextResponse.json(
          {
            success: false,
            error: 'This YouTube video is unavailable, private, or has been removed.',
          },
          { status: 404 }
        );
      }

      if (errMsg === 'RATE_LIMITED') {
        return NextResponse.json(
          {
            success: false,
            error: 'YouTube caption rate limit reached. Please wait a moment and try again.',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve the video transcript. Please verify the video has public captions and try again.",
        },
        { status: 502 }
      );
    }

    const transcript = transcriptResult.value;

    // Safety guard against empty transcripts
    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'The retrieved transcript is empty or could not be parsed.',
        },
        { status: 422 }
      );
    }

    // 5. Send transcript to Gemini for sponsorship identification
    try {
      const { sponsors, modelUsed } = await analyzeTranscriptWithGemini(transcript);

      return NextResponse.json(
        {
          success: true,
          videoId,
          videoTitle: metadata.title,
          channelName: metadata.author,
          sponsors,
          modelUsed,
        },
        { status: 200 }
      );
    } catch (aiErr: unknown) {
      const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);

      if (msg === 'MISSING_API_KEY') {
        return NextResponse.json(
          { success: false, error: 'GEMINI_API_KEY is not configured on the server.' },
          { status: 500 }
        );
      }

      if (msg === 'INVALID_API_KEY') {
        return NextResponse.json(
          { success: false, error: 'The configured Gemini API key is invalid or unauthorized.' },
          { status: 401 }
        );
      }

      if (msg === 'RATE_LIMITED') {
        return NextResponse.json(
          {
            success: false,
            error: 'Gemini AI rate limit reached. Please wait a minute and try again.',
          },
          { status: 429 }
        );
      }

      if (msg === 'SERVICE_OVERLOADED') {
        return NextResponse.json(
          {
            success: false,
            error: 'Gemini AI servers are temporarily experiencing high demand. Please retry in a few moments.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'AI analysis encountered an error while identifying sponsored segments. Please try again.',
        },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected internal error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
