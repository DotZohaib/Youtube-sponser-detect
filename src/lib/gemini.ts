import { GoogleGenerativeAI } from '@google/generative-ai';
import { SponsorSegment, validateSponsorSegments } from './validation';

const DEFAULT_MODEL = 'gemini-3.8-flash';
// Known working fallbacks if a model is temporarily experiencing a 503 spike or quota limit
const FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.7-flash',
];

/**
 * Strips markdown code blocks like ```json ... ``` from the response string.
 */
export function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  // Strip starting ```json or ```
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '');
  }
  // Strip ending ```
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Builds the structured system prompt for Gemini transcript analysis.
 */
export function buildPrompt(transcript: string): string {
  return `You are an expert at analyzing YouTube video transcripts for sponsorships and advertisements.

Analyze the following timestamped YouTube transcript.

Your task is to identify genuine sponsored segments, including:
- Paid sponsorships
- Brand integrations
- Advertiser messages
- Sponsor ad reads
- Promotional segments where the creator appears to be promoting a product or service as part of a sponsorship

Do NOT classify ordinary mentions of products as sponsorships unless the transcript provides evidence that the segment is promotional or sponsored.

Use the transcript timestamps to estimate the beginning and ending timestamp of each sponsored segment.

Return ONLY valid JSON.

The response MUST be a JSON array.

Each object must contain exactly these fields:

{
  "brand": "string",
  "startTime": "MM:SS",
  "endTime": "MM:SS",
  "summary": "short one-sentence description"
}

If no sponsored segment is detected, return:

[]

Important rules:
- Do not use Markdown.
- Do not use code fences.
- Do not include explanations outside the JSON.
- Do not invent brands.
- Do not invent sponsorships.
- Keep summaries concise.
- Use the closest timestamps available from the transcript.
- Return valid JSON only.

Timestamped transcript:

${transcript}`;
}

export interface AnalyzeResult {
  sponsors: SponsorSegment[];
  modelUsed: string;
}

/**
 * Analyzes the timestamped transcript with Google Gemini.
 * Employs automatic fallback to ensure high availability during temporary spikes.
 */
export async function analyzeTranscriptWithGemini(transcript: string): Promise<AnalyzeResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('MISSING_API_KEY');
  }

  const primaryModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const candidateModels = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)];

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildPrompt(transcript);

  let lastError: Error | null = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();

      const cleanedText = cleanJsonResponse(rawText);

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleanedText);
      } catch {
        // Fallback: try finding first JSON array [ ... ]
        const arrayMatch = cleanedText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          parsed = JSON.parse(arrayMatch[0]);
        } else {
          throw new Error('INVALID_JSON');
        }
      }

      const validSponsors = validateSponsorSegments(parsed);
      return {
        sponsors: validSponsors,
        modelUsed: modelName,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      lastError = err instanceof Error ? err : new Error(errorMsg);

      // If it's a model not found (404) or overloaded (503/429), try next fallback model
      const isRetryable =
        errorMsg.includes('404') ||
        errorMsg.includes('503') ||
        errorMsg.includes('429') ||
        errorMsg.includes('high demand') ||
        errorMsg.includes('not found') ||
        errorMsg.includes('quota');

      if (isRetryable && modelName !== candidateModels[candidateModels.length - 1]) {
        // Small delay before fallback attempt
        await new Promise((resolve) => setTimeout(resolve, 800));
        continue;
      }

      break;
    }
  }

  // Handle specific Gemini error classification
  if (lastError) {
    const msg = lastError.message;
    if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
      throw new Error('INVALID_API_KEY');
    }
    if (msg.includes('429') || msg.includes('quota') || msg.includes('Resource has been exhausted')) {
      throw new Error('RATE_LIMITED');
    }
    if (msg.includes('503') || msg.includes('high demand')) {
      throw new Error('SERVICE_OVERLOADED');
    }
    throw lastError;
  }

  throw new Error('GEMINI_ANALYSIS_FAILED');
}
