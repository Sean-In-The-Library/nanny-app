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

    if (
      message.includes("OPENROUTER_API_KEY") ||
      message.includes("fetch failed") ||
      message.includes("request failed")
    ) {
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
  const lowerTranscript = transcript.toLowerCase();
  const child = getFallbackChild(transcript);
  const drafts: ActionDraft[] = [];

  const trackerType = getFallbackTrackerType(lowerTranscript);
  if (trackerType) {
    drafts.push({
      id: `draft-tracker-${Date.now()}`,
      kind: "tracker",
      title: `${child}: ${trackerType.replaceAll("_", " ")}`,
      details: findRelevantSentence(transcript, [
        "rash",
        "poop",
        "meal",
        "sleep",
        "behavior",
      ]),
      child,
      trackerType,
      priority: trackerType === "rash" || trackerType === "no_poop" ? "urgent" : "important",
    });
  }

  const supplyTitle = getFallbackSupplyTitle(lowerTranscript);
  if (supplyTitle) {
    drafts.push({
      id: `draft-supply-${Date.now()}`,
      kind: "supply",
      title: supplyTitle,
      details: findRelevantSentence(transcript, [
        supplyTitle.toLowerCase(),
        "low",
        "out",
        "almost",
      ]),
      supplyStatus: lowerTranscript.includes("out") ? "out" : "running_low",
      priority: "important",
    });
  }

  if (/\b(clean|wipe|wiped|wash|restock)\b/.test(lowerTranscript)) {
    drafts.push({
      id: `draft-chore-${Date.now()}`,
      kind: "chore",
      title: getFallbackChoreTitle(transcript),
      details: findRelevantSentence(transcript, ["clean", "wipe", "wash", "restock"]),
      priority: "important",
    });
  }

  if (lowerTranscript.includes("practice")) {
    const practiceDetails = findRelevantSentence(transcript, ["practice"]);
    drafts.push({
      id: `draft-development-${Date.now()}`,
      kind: "development",
      title: `${getFallbackChild(practiceDetails)}: practice reminder`,
      details: practiceDetails,
      child: getFallbackChild(practiceDetails),
      priority: "normal",
    });
  }

  if (drafts.length > 0) {
    return {
      drafts,
      caregiverMessage:
        "AI sorting was unavailable, so these were sorted locally for review.",
      questions: [],
    };
  }

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
    caregiverMessage:
      "AI sorting was unavailable, so this is saved as a reviewable nanny note.",
    questions: [],
  };
}

function getFallbackChild(text: string) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("connor")) {
    return "Connor";
  }
  return "Kieran";
}

function getFallbackTrackerType(
  transcript: string,
): ActionDraft["trackerType"] | null {
  if (transcript.includes("rash")) {
    return "rash";
  }
  if (transcript.includes("no poop") || transcript.includes("did not poop")) {
    return "no_poop";
  }
  if (transcript.includes("refused") || transcript.includes("meal")) {
    return "refused_meal";
  }
  if (transcript.includes("sleep")) {
    return "poor_sleep";
  }
  if (transcript.includes("behavior")) {
    return "behavior";
  }
  return null;
}

function getFallbackSupplyTitle(transcript: string) {
  const supplies = [
    "wipes",
    "diapers",
    "diaper cream",
    "sunscreen",
    "snacks",
    "milk",
    "formula",
  ];

  return supplies.find((item) => transcript.includes(item)) ?? null;
}

function getFallbackChoreTitle(transcript: string) {
  if (transcript.toLowerCase().includes("wonder wagon")) {
    return "Wipe Wonder Wagon";
  }

  const match = transcript.match(
    /\b(clean|wipe|wiped|wash|restock)\b\s+(?:down\s+|the\s+)?([^.!?]+)/i,
  );

  if (!match?.[2]) {
    return "Nanny task";
  }

  const verb = match[1].toLowerCase() === "wiped" ? "Wipe" : capitalize(match[1]);
  return `${verb} ${match[2].trim()}`;
}

function findRelevantSentence(transcript: string, keywords: string[]) {
  const sentences = transcript
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return (
    sentences.find((sentence) =>
      keywords.some((keyword) => sentenceHasKeyword(sentence, keyword)),
    ) ?? transcript
  );
}

function sentenceHasKeyword(sentence: string, keyword: string) {
  if (keyword.includes(" ")) {
    return sentence.toLowerCase().includes(keyword.toLowerCase());
  }

  return new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i").test(sentence);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
