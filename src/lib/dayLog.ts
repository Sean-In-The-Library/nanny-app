import { nextAllowedMedicationTime } from "./dateUtils";
import type {
  AppData,
  ChildName,
  DayDigest,
  LogEvent,
  MedicationEntry,
  UserName,
} from "./types";

/**
 * The family lives in Phoenix. Day boundaries for logs and digests use this
 * timezone no matter where the server runs.
 */
export const FAMILY_TIME_ZONE = "America/Phoenix";

export const CHILDREN: ChildName[] = ["Kieran", "Connor"];

/** Naps older than this without an end are treated as stale, not in progress. */
const STALE_NAP_HOURS = 16;

export type ChildDayStatus = {
  child: ChildName;
  napping: boolean;
  napStartedAt?: string;
  napCount: number;
  totalNapMinutes: number;
  lastFeed?: LogEvent;
  feedCount: number;
  lastDiaper?: LogEvent;
  diaperCount: number;
  dirtyDiaperCount: number;
  lastMedication?: {
    entry: MedicationEntry;
    nextAllowedAt?: string;
  };
  lastMood?: LogEvent;
  eventCount: number;
};

/** YYYY-MM-DD for an ISO timestamp, in the family timezone. */
export function eventDateString(at: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FAMILY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(at));
}

/** Today's YYYY-MM-DD in the family timezone. */
export function todayFamilyDateString(now: Date = new Date()): string {
  return eventDateString(now.toISOString());
}

/** h:mm a clock time for an ISO timestamp, in the family timezone. */
export function formatFamilyTime(at: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: FAMILY_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(at));
}

/** All log events for a family-local date, oldest first. */
export function getDayEvents(data: AppData, date: string): LogEvent[] {
  return (data.logEvents ?? [])
    .filter((event) => eventDateString(event.at) === date)
    .slice()
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

/** The most recent in-progress (not stale) nap for a child, if any. */
export function getActiveNap(
  data: AppData,
  child: ChildName,
  now: Date = new Date(),
): LogEvent | undefined {
  return (data.logEvents ?? [])
    .filter(
      (event) =>
        event.kind === "nap" &&
        event.child === child &&
        !event.endedAt &&
        hoursBetween(event.at, now.toISOString()) <= STALE_NAP_HOURS,
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0];
}

export function napMinutes(event: LogEvent, now: Date = new Date()): number {
  if (event.kind !== "nap") {
    return 0;
  }

  const end = event.endedAt ? new Date(event.endedAt) : now;
  const minutes = Math.round(
    (end.getTime() - new Date(event.at).getTime()) / 60000,
  );
  return Math.max(0, Math.min(minutes, STALE_NAP_HOURS * 60));
}

/** Live rollup of one child's day: nap state, feeds, diapers, meds, mood. */
export function buildChildDayStatus(
  data: AppData,
  child: ChildName,
  now: Date = new Date(),
): ChildDayStatus {
  const date = todayFamilyDateString(now);
  const events = getDayEvents(data, date).filter(
    (event) => event.child === child,
  );

  const naps = events.filter((event) => event.kind === "nap");
  const feeds = events.filter((event) => event.kind === "feed");
  const diapers = events.filter((event) => event.kind === "diaper");
  const moods = events.filter((event) => event.kind === "mood");
  const activeNap = getActiveNap(data, child, now);

  const lastMedicationEntry = (data.medicationEntries ?? [])
    .filter((entry) => entry.child === child)
    .slice()
    .sort(
      (a, b) => new Date(b.givenAt).getTime() - new Date(a.givenAt).getTime(),
    )[0];

  return {
    child,
    napping: Boolean(activeNap),
    napStartedAt: activeNap?.at,
    napCount: naps.length,
    totalNapMinutes: naps.reduce(
      (total, nap) => total + napMinutes(nap, now),
      0,
    ),
    lastFeed: feeds[feeds.length - 1],
    feedCount: feeds.length,
    lastDiaper: diapers[diapers.length - 1],
    diaperCount: diapers.length,
    dirtyDiaperCount: diapers.filter(
      (event) => event.diaperType === "dirty" || event.diaperType === "both",
    ).length,
    lastMedication: lastMedicationEntry
      ? {
          entry: lastMedicationEntry,
          nextAllowedAt: nextAllowedMedicationTime(
            lastMedicationEntry.givenAt,
            lastMedicationEntry.minimumIntervalHours,
          ),
        }
      : undefined,
    lastMood: moods[moods.length - 1],
    eventCount: events.length,
  };
}

/** One-line description of a log event for timelines and digest prompts. */
export function describeLogEvent(event: LogEvent): string {
  switch (event.kind) {
    case "nap": {
      const start = formatFamilyTime(event.at);
      if (!event.endedAt) {
        return `Nap started at ${start}`;
      }
      return `Napped ${start} to ${formatFamilyTime(event.endedAt)} (${napMinutes(event)} min)`;
    }
    case "feed": {
      const type = event.feedType ?? "feed";
      const amount = event.amount ? ` (${event.amount})` : "";
      return `${capitalize(type)}${amount} at ${formatFamilyTime(event.at)}`;
    }
    case "diaper":
      return `Diaper (${event.diaperType ?? "changed"}) at ${formatFamilyTime(event.at)}`;
    case "medication": {
      const med = [event.medicineName, event.dose].filter(Boolean).join(" ");
      return `${med || "Medication"} at ${formatFamilyTime(event.at)}`;
    }
    case "mood":
      return `Mood: ${event.mood ?? "noted"} at ${formatFamilyTime(event.at)}`;
    case "activity":
      return `Activity at ${formatFamilyTime(event.at)}${event.details ? `: ${event.details}` : ""}`;
    case "note":
    default:
      return `Note at ${formatFamilyTime(event.at)}${event.details ? `: ${event.details}` : ""}`;
  }
}

/**
 * Compact plain-text rundown of a day used as the AI digest prompt input and
 * as the body of the deterministic local digest.
 */
export function buildDigestInput(data: AppData, date: string): string {
  const lines: string[] = [`Day log for ${date}:`];

  for (const child of CHILDREN) {
    const events = getDayEvents(data, date).filter(
      (event) => event.child === child,
    );
    lines.push(`\n${child}:`);
    if (events.length === 0) {
      lines.push("- No events logged.");
      continue;
    }
    for (const event of events) {
      const detail =
        event.details && event.kind !== "note" && event.kind !== "activity"
          ? ` — ${event.details}`
          : "";
      lines.push(`- ${describeLogEvent(event)}${detail} [by ${event.recordedBy}]`);
    }
  }

  const dayTrackers = (data.trackers ?? []).filter(
    (tracker) => eventDateString(tracker.createdAt) === date,
  );
  if (dayTrackers.length > 0) {
    lines.push("\nConcerns flagged today:");
    for (const tracker of dayTrackers) {
      lines.push(
        `- ${tracker.child}: ${tracker.type.replaceAll("_", " ")} — ${tracker.details}${tracker.resolved ? " (resolved)" : ""}`,
      );
    }
  }

  return lines.join("\n");
}

/** Heuristic attention flags for a day. No AI involved. */
export function digestFlags(data: AppData, date: string): string[] {
  const flags: string[] = [];
  const now = new Date();
  const isToday = todayFamilyDateString(now) === date;

  for (const child of CHILDREN) {
    const events = getDayEvents(data, date).filter(
      (event) => event.child === child,
    );
    if (events.length === 0) {
      continue;
    }

    const diapers = events.filter((event) => event.kind === "diaper");
    const dirty = diapers.filter(
      (event) => event.diaperType === "dirty" || event.diaperType === "both",
    );
    const naps = events.filter((event) => event.kind === "nap");
    const napTotal = naps.reduce((total, nap) => total + napMinutes(nap, now), 0);
    const meds = events.filter((event) => event.kind === "medication");
    const feeds = events.filter((event) => event.kind === "feed");

    if (diapers.length > 0 && dirty.length === 0) {
      flags.push(`${child}: no dirty diaper logged today.`);
    }
    if (naps.length > 0 && napTotal < 60 && !isToday) {
      flags.push(`${child}: total nap time was short (${napTotal} min).`);
    }
    for (const med of meds) {
      flags.push(
        `${child}: ${[med.medicineName, med.dose].filter(Boolean).join(" ") || "medication"} given at ${formatFamilyTime(med.at)}.`,
      );
    }
    if (feeds.length === 0) {
      flags.push(`${child}: no feeds logged today.`);
    }

    const openNap = getActiveNap(data, child, now);
    if (openNap && eventDateString(openNap.at) === date && !isToday) {
      flags.push(`${child}: a nap was never marked as ended.`);
    }
  }

  const unresolvedDayTrackers = (data.trackers ?? []).filter(
    (tracker) =>
      !tracker.resolved && eventDateString(tracker.createdAt) === date,
  );
  for (const tracker of unresolvedDayTrackers) {
    flags.push(
      `${tracker.child}: open concern — ${tracker.type.replaceAll("_", " ")}.`,
    );
  }

  return flags;
}

/** Deterministic digest used when OpenRouter is unavailable. */
export function buildLocalDigest(
  data: AppData,
  date: string,
  generatedBy: UserName,
): DayDigest {
  const now = new Date();
  const paragraphs: string[] = [];

  for (const child of CHILDREN) {
    const events = getDayEvents(data, date).filter(
      (event) => event.child === child,
    );
    if (events.length === 0) {
      continue;
    }

    const naps = events.filter((event) => event.kind === "nap");
    const napTotal = naps.reduce((total, nap) => total + napMinutes(nap, now), 0);
    const feeds = events.filter((event) => event.kind === "feed");
    const diapers = events.filter((event) => event.kind === "diaper");
    const pieces: string[] = [];

    if (naps.length > 0) {
      pieces.push(
        `${naps.length} nap${naps.length === 1 ? "" : "s"} (${napTotal} min total)`,
      );
    }
    if (feeds.length > 0) {
      pieces.push(`${feeds.length} feed${feeds.length === 1 ? "" : "s"}`);
    }
    if (diapers.length > 0) {
      pieces.push(
        `${diapers.length} diaper change${diapers.length === 1 ? "" : "s"}`,
      );
    }

    const moods = events.filter((event) => event.kind === "mood");
    const lastMood = moods[moods.length - 1];
    const moodText = lastMood?.mood ? ` Overall mood: ${lastMood.mood}.` : "";

    paragraphs.push(
      `${child} had ${pieces.length > 0 ? pieces.join(", ") : "a quiet day with nothing logged"}.${moodText}`,
    );
  }

  if (paragraphs.length === 0) {
    paragraphs.push("No day log entries were recorded for this date.");
  }

  return {
    id: `digest-${date}`,
    date,
    summary: paragraphs.join(" "),
    flags: digestFlags(data, date),
    generatedAt: now.toISOString(),
    generatedBy,
    source: "local",
  };
}

function hoursBetween(a: string, b: string): number {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 3600000;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
