import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/apiAuth";
import {
  buildDigestInput,
  buildLocalDigest,
  digestFlags,
  todayFamilyDateString,
} from "@/lib/dayLog";
import { callOpenRouterJson } from "@/lib/openrouter";
import { dailyDigestSchema } from "@/lib/schemas";
import { readAppData, writeAppData } from "@/lib/storage";
import type { DayDigest, UserName } from "@/lib/types";

type DigestAiResponse = {
  summary?: string;
  flags?: string[];
};

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session.response) {
    return session.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = dailyDigestSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid digest request." },
      { status: 400 },
    );
  }

  const date = parsed.data.date ?? todayFamilyDateString();
  const data = await readAppData();
  const digestInput = buildDigestInput(data, date);
  const heuristicFlags = digestFlags(data, date);

  let digest: DayDigest;

  if (process.env.OPENROUTER_API_KEY) {
    try {
      digest = await generateAiDigest(
        date,
        digestInput,
        heuristicFlags,
        session.user.name,
      );
    } catch {
      digest = buildLocalDigest(data, date, session.user.name);
    }
  } else {
    digest = buildLocalDigest(data, date, session.user.name);
  }

  const dayDigests = [
    ...(data.dayDigests ?? []).filter((existing) => existing.date !== date),
    digest,
  ];
  await writeAppData({ ...data, dayDigests });

  return NextResponse.json({ digest });
}

async function generateAiDigest(
  date: string,
  digestInput: string,
  heuristicFlags: string[],
  generatedBy: UserName,
): Promise<DayDigest> {
  const result = await callOpenRouterJson<DigestAiResponse>({
    maxTokens: 600,
    messages: [
      {
        role: "system",
        content:
          'You write a warm, brief end-of-day summary for Sean and Tina, the parents of Kieran and Connor, from their nanny\'s day log. Write 2-4 short sentences for each child who has logged events. Use the concrete clock times and amounts from the log. Stay warm but factual, never assign blame, and do not invent events. Respond with only valid JSON shaped as {"summary": string, "flags": string[]}, where flags are short attention items such as medication timing, no dirty diaper logged, short naps, or open concerns.',
      },
      {
        role: "user",
        content: `
${digestInput}

Heuristic flags to consider (keep, reword, or drop based on the log):
${heuristicFlags.length > 0 ? heuristicFlags.map((flag) => `- ${flag}`).join("\n") : "- None"}
`,
      },
    ],
  });

  const summary =
    typeof result.summary === "string" ? result.summary.trim() : "";
  if (!summary) {
    throw new Error("AI digest came back empty.");
  }

  return {
    id: `digest-${date}`,
    date,
    summary,
    flags: mergeFlags(result.flags, heuristicFlags),
    generatedAt: new Date().toISOString(),
    generatedBy,
    source: "ai",
  };
}

function mergeFlags(aiFlags: unknown, heuristicFlags: string[]): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const flag of [
    ...(Array.isArray(aiFlags) ? aiFlags : []),
    ...heuristicFlags,
  ]) {
    if (typeof flag !== "string") {
      continue;
    }
    const trimmed = flag.trim();
    const key = trimmed.toLowerCase().replace(/[.\s]+$/, "");
    if (!trimmed || seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(trimmed);
  }

  return merged;
}
