import { NextRequest, NextResponse } from "next/server";

const TTS_API_URL = process.env.TTS_API_URL || "http://localhost:8880";
const TTS_REQUEST_TIMEOUT = 30000;

const VALID_VOICES = new Set([
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
  "Carter",
  "Davis",
  "Emma",
  "Frank",
  "Grace",
  "Mike",
  "Samuel",
  "soprano",
]);

const VALID_FORMATS = new Set(["mp3", "wav", "opus", "flac", "aac", "pcm"]);

const CONTENT_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  opus: "audio/opus",
  flac: "audio/flac",
  aac: "audio/aac",
  pcm: "audio/pcm",
};

interface TTSRequestBody {
  input: string;
  voice?: string;
  model?: string;
  response_format?: string;
  speed?: number;
}

function validateRequest(
  body: unknown
): { valid: true; data: TTSRequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be an object" };
  }

  const data = body as Record<string, unknown>;

  if (typeof data.input !== "string" || !data.input.trim()) {
    return { valid: false, error: "Input text is required" };
  }

  if (data.input.length > 4096) {
    return { valid: false, error: "Input text exceeds 4096 characters" };
  }

  if (
    data.voice &&
    (typeof data.voice !== "string" || !VALID_VOICES.has(data.voice))
  ) {
    return {
      valid: false,
      error: `Invalid voice. Valid: ${[...VALID_VOICES].join(", ")}`,
    };
  }

  if (
    data.response_format &&
    (typeof data.response_format !== "string" ||
      !VALID_FORMATS.has(data.response_format))
  ) {
    return {
      valid: false,
      error: `Invalid format. Valid: ${[...VALID_FORMATS].join(", ")}`,
    };
  }

  return {
    valid: true,
    data: {
      input: data.input.trim(),
      voice: (data.voice as string) || "nova",
      model: (data.model as string) || "tts-1",
      response_format: (data.response_format as string) || "mp3",
      speed: typeof data.speed === "number" ? data.speed : 1.0,
    },
  };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON in request body", code: "INVALID_JSON" } },
      { status: 400 }
    );
  }

  const validation = validateRequest(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: { message: validation.error, code: "VALIDATION_ERROR" } },
      { status: 400 }
    );
  }

  const { data } = validation;
  const format = data.response_format || "mp3";

  // Determine API URL based on model
  let apiUrl = TTS_API_URL;
  if (data.model === "soprano-80m") {
    apiUrl = "http://localhost:8000";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TTS_REQUEST_TIMEOUT);

  try {
    const ttsResponse = await fetch(`${apiUrl}/v1/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text().catch(() => "Unknown error");
      console.error("[TTS API] Service error:", ttsResponse.status, errorText);

      return NextResponse.json(
        { error: { message: "TTS generation failed", code: "TTS_ERROR", details: errorText } },
        { status: ttsResponse.status >= 500 ? 502 : ttsResponse.status }
      );
    }

    const contentLength = ttsResponse.headers.get("Content-Length");

    return new Response(ttsResponse.body, {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[format] || "audio/mpeg",
        ...(contentLength && { "Content-Length": contentLength }),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        { error: { message: "Request timeout", code: "TIMEOUT" } },
        { status: 504 }
      );
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("[TTS API] Service unavailable:", error.message);
      return NextResponse.json(
        { error: { message: "TTS service unavailable", code: "SERVICE_UNAVAILABLE" } },
        { status: 503 }
      );
    }

    console.error("[TTS API] Unexpected error:", error);
    return NextResponse.json(
      { error: { message: "Internal server error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check / list voices
  try {
    const response = await fetch(`${TTS_API_URL}/v1/audio/voices`);
    if (!response.ok) {
      return NextResponse.json(
        { error: { message: "Failed to fetch voices", code: "TTS_ERROR" } },
        { status: 502 }
      );
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: { message: "TTS service unavailable", code: "SERVICE_UNAVAILABLE" } },
      { status: 503 }
    );
  }
}
