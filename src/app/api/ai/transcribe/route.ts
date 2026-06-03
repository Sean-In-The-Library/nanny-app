import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiAuth";

const MAX_TRANSCRIBE_UPLOAD_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session.response) {
    return session.response;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured for voice transcription." },
      { status: 500 },
    );
  }

  const formData = await request.formData().catch(() => null);
  const audio = formData?.get("audio");

  if (!(audio instanceof File)) {
    return NextResponse.json(
      { error: "Upload an audio or video recording to transcribe." },
      { status: 400 },
    );
  }

  if (audio.size > MAX_TRANSCRIBE_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error:
          "Audio or video files must be 4 MB or smaller until direct upload storage is configured.",
      },
      { status: 400 },
    );
  }

  const upstreamForm = new FormData();
  upstreamForm.set("file", audio, audio.name || "tina-dictation.webm");
  upstreamForm.set("model", process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-transcribe");
  upstreamForm.set("response_format", "json");
  upstreamForm.set(
    "prompt",
    [
      "This is Tina Harrington dictating household and nanny coordination notes.",
      "Important names and terms: Tina, Sean, Faith, Kieran, Connor, diapers, wipes, Tylenol, Motrin, potty, nap, Wonder Wagon.",
      "Preserve times, dates, medicine names, doses, chores, requests, and child names exactly when spoken.",
    ].join(" "),
  );

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: upstreamForm,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      {
        error:
          payload?.error?.message ??
          `OpenAI transcription failed with status ${response.status}.`,
      },
      { status: response.status },
    );
  }

  return NextResponse.json({ text: payload?.text ?? "" });
}
