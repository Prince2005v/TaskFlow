/**
 * AI Client — server-side only.
 * Never import this file from browser/client components.
 * The API key is read from environment variables at runtime.
 */
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not set. " +
          "Add it to your .env file."
      );
    }
    _genAI = new GoogleGenerativeAI(apiKey);
  }
  return _genAI;
}

/**
 * Returns the shared Gemini Flash model instance.
 * Uses gemini-3.8-flash for speed and cost efficiency.
 */
export function getAIModel(modelName = "gemini-3.8-flash"): GenerativeModel {
  return getGenAI().getGenerativeModel({ model: modelName });
}

/**
 * Generates content from a prompt and returns the raw text.
 * Handles fallbacks and formats human-readable error messages.
 */
export async function generateAIContent(prompt: string): Promise<string> {
  const modelsToTry = [
    process.env.GEMINI_MODEL || "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash",
  ];

  let lastError: unknown = null;

  for (const modelName of modelsToTry) {
    try {
      const model = getAIModel(modelName);
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      if (!text || text.trim() === "") {
        throw new Error("AI returned an empty response.");
      }
      return text;
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);

      // If project denied access or permission denied, break early with actionable message
      if (msg.includes("denied access") || msg.includes("PERMISSION_DENIED")) {
        throw new Error(
          "Gemini API Error (403): Your Google Cloud/AI Studio project was denied access. Please ensure your GEMINI_API_KEY is an active key from https://aistudio.google.com/app/apikey (starts with AIzaSy...)."
        );
      }

      if (msg.includes("quota") || msg.includes("429")) {
        throw new Error(
          "Gemini API Error (429): API quota or rate limit exceeded. Please check your AI Studio plan and usage."
        );
      }

      // If model not found (404), try next fallback model
      if (msg.includes("404") || msg.includes("not found") || msg.includes("no longer available")) {
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error("Failed to generate content from AI.");
}

/**
 * Parses a JSON block from AI output — handles markdown code fences.
 * Throws if the output is not valid JSON.
 */
export function parseAIJson<T>(rawText: string): T {
  // Strip markdown code fences if present
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `AI response was not valid JSON. Raw: ${cleaned.slice(0, 200)}`
    );
  }
}
