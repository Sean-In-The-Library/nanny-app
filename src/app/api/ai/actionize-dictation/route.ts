import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiAuth";
import { actionizeSchema } from "@/lib/schemas";
import { callOpenRouterJson } from "@/lib/openrouter";
import type { ActionDraft } from "@/lib/types";

type ActionizeResponse = {
  drafts: ActionDraft[];
  caregiverMessage: string;
  questions: string[];
};

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session.response) {
    return session.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = actionizeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid dictation." },
      { status: 400 },
    );
  }

  const { transcript, createdBy } = parsed.data;

  try {
    const result = await callOpenRouterJson<ActionizeResponse>({
      messages: [
        {
          role: "system",
          content:
            "You turn a parent's rough nanny dictation into concise, actionable household app items. Be warm, clear, and non-confrontational. Do not invent facts. Return only valid JSON.",
        },
        {
          role: "user",
          content: `
Created by: ${createdBy}

Convert this dictation into app-ready items for a family nanny dashboard.

Available item kinds:
- note: immediate request, context, or reminder for Faith
- chore: recurring or one-off household task
- supply: low/out/ordered supply alert
- tracker: unusual child status like no poop, refused meal, poor sleep, rash, behavior, other
- calendar: upcoming appointment, visitor, travel, time off, birthday, other date
- development: active practice goal for Kieran or Connor
- medication: logged medicine/treatment entry

Rules:
- Phrase requests so Faith knows what to do without feeling blamed.
- Preserve child names, concrete times, dates, medicine names, and doses.
- Use Tina as createdBy unless the transcript clearly says otherwise.
- If uncertain, include a question rather than guessing.
- Return JSON with keys: drafts, caregiverMessage, questions.
- Each draft must include id, kind, title, details. Optional fields: priority, child, dueDate, supplyStatus, trackerType, calendarCategory, medicineName, dose, minimumIntervalHours, question.

Transcript:
${transcript}
`,
        },
      ],
    });

    return NextResponse.json(normalizeActionizeResponse(result));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not generate action items.";

    if (message.includes("OPENROUTER_API_KEY")) {
      return NextResponse.json(fallbackActionize(transcript));
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function normalizeActionizeResponse(result: ActionizeResponse): ActionizeResponse {
  return {
    drafts: Array.isArray(result.drafts)
      ? result.drafts.map((draft, index) => ({
          ...draft,
          id: draft.id || `draft-${index + 1}`,
          title: draft.title || "Nanny note",
          details: draft.details || "",
        }))
      : [],
    caregiverMessage: result.caregiverMessage || "",
    questions: Array.isArray(result.questions) ? result.questions : [],
  };
}

function fallbackActionize(transcript: string): ActionizeResponse {
  return {
    drafts: [
      {
        id: `draft-${Date.now()}`,
        kind: "note",
        title: "Tina's dictated note",
        details: transcript,
        priority: "important",
      },
    ],
    caregiverMessage: "Added as a note because AI action sorting is not configured.",
    questions: [],
  };
}
