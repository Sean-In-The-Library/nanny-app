import { NextResponse } from "next/server";
import { callOpenRouterJson } from "@/lib/openrouter";
import { summarizeCareNotesSchema } from "@/lib/schemas";

type CareSummaryResponse = {
  summary: string;
  suggestedSchedule: string;
  questions: string[];
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = summarizeCareNotesSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid care notes." },
      { status: 400 },
    );
  }

  const { childName, rawNotes } = parsed.data;

  try {
    const result = await callOpenRouterJson<CareSummaryResponse>({
      messages: [
        {
          role: "system",
          content:
            "You help create clear nanny care manuals from rough parent notes. Return only valid JSON.",
        },
        {
          role: "user",
          content: `
You are helping create a nanny care manual from rough dictated parent notes.

Child: ${childName}

Convert the notes into a clear, practical care manual for a nanny.

Rules:
- Preserve concrete details.
- Do not invent facts.
- If timing is uncertain, say "usually" or "approximately."
- Organize into sections.
- Extract routine, meals, naps, potty/diapering, development, comfort, and special instructions.
- Flag unclear items as questions for Sean or Tina.
- Return JSON with keys: summary, suggestedSchedule, questions.

Raw notes:
${rawNotes}
`,
        },
      ],
    });

    return NextResponse.json({
      summary: result.summary ?? "",
      suggestedSchedule: result.suggestedSchedule ?? "",
      questions: Array.isArray(result.questions) ? result.questions : [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not summarize care notes.",
      },
      { status: 500 },
    );
  }
}

