import {
  formatDateTime,
  formatShortDate,
  isOnOrBeforeToday,
  isOverdue,
  isWithinNextDays,
  nextAllowedMedicationTime,
  startOfToday,
} from "./dateUtils";
import type {
  AppData,
  CalendarEvent,
  Chore,
  DevelopmentGoal,
  MedicationEntry,
  Note,
  Supply,
  Tracker,
} from "./types";

export type DashboardBucket = "today" | "laterToday" | "month" | "canWait";
export type DashboardItemType =
  | "note"
  | "chore"
  | "supply"
  | "tracker"
  | "calendar"
  | "development"
  | "medication"
  | "milestone";

export type DashboardItem = {
  id: string;
  sourceId: string;
  sourceType: DashboardItemType;
  bucket: DashboardBucket;
  title: string;
  details: string;
  meta: string;
  href: string;
  priority: "urgent" | "important" | "normal";
  dueAt?: string;
  actionLabel?: string;
};

export type DashboardData = {
  urgentNotes: Note[];
  dueChores: Chore[];
  lowSupplies: Supply[];
  unresolvedTrackers: Tracker[];
  upcomingEvents: CalendarEvent[];
  activeDevelopmentGoals: DevelopmentGoal[];
  medicationWindows: Array<{
    entry: MedicationEntry;
    nextAllowedAt?: string;
  }>;
  focus: Record<DashboardBucket, DashboardItem[]>;
  summary: {
    today: number;
    laterToday: number;
    month: number;
    canWait: number;
    urgent: number;
    overdue: number;
  };
};

export function getDashboardData(data: AppData): DashboardData {
  const medicationWindows = data.medicationEntries
      .map((entry) => ({
        entry,
        nextAllowedAt: nextAllowedMedicationTime(
          entry.givenAt,
          entry.minimumIntervalHours,
        ),
      }))
      .slice()
      .sort(
        (a, b) =>
          new Date(b.entry.givenAt).getTime() - new Date(a.entry.givenAt).getTime(),
      )
      .slice(0, 4);
  const urgentNotes = data.notes
      .filter(
        (note) =>
          note.showOnDashboard &&
          !note.resolved &&
          (!note.expiresAt || new Date(note.expiresAt).getTime() >= Date.now()),
      )
      .sort(prioritySort);
  const unresolvedTrackers = data.trackers.filter((tracker) => !tracker.resolved);
  const upcomingEvents = data.calendarEvents
      .filter(
        (event) =>
          event.showOnDashboard && isWithinNextDays(event.startDate, 7),
      )
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
  const dueChores = data.chores
      .filter(
        (chore) => chore.showWhenDue && isOnOrBeforeToday(chore.nextDueAt),
      )
      .sort((a, b) => Number(isOverdue(b.nextDueAt)) - Number(isOverdue(a.nextDueAt)));
  const lowSupplies = data.supplies
      .filter(
        (supply) => supply.showOnDashboard && supply.status !== "resolved",
      )
      .sort(supplySort);
  const activeDevelopmentGoals = data.developmentGoals.filter(
      (goal) => goal.active && goal.showOnDashboard,
    );
  const focus = buildFocusBuckets(data, medicationWindows);

  return {
    medicationWindows,
    urgentNotes,
    unresolvedTrackers,
    upcomingEvents,
    dueChores,
    lowSupplies,
    activeDevelopmentGoals,
    focus,
    summary: {
      today: focus.today.length,
      laterToday: focus.laterToday.length,
      month: focus.month.length,
      canWait: focus.canWait.length,
      urgent: focus.today.filter((item) => item.priority === "urgent").length,
      overdue: data.chores.filter((chore) => isOverdue(chore.nextDueAt)).length,
    },
  };
}

function buildFocusBuckets(
  data: AppData,
  medicationWindows: DashboardData["medicationWindows"],
): Record<DashboardBucket, DashboardItem[]> {
  const items: DashboardItem[] = [];

  medicationWindows.forEach(({ entry, nextAllowedAt }) => {
    items.push({
      id: `medication-${entry.id}`,
      sourceId: entry.id,
      sourceType: "medication",
      bucket: "today",
      title: `${entry.child}: ${entry.medicineName}`,
      details: `${entry.dose} given by ${entry.givenBy}. ${
        nextAllowedAt ? `Next allowed after ${formatDateTime(nextAllowedAt)}.` : ""
      }`.trim(),
      meta: "Medication window",
      href: "/medication",
      priority: "urgent",
      dueAt: nextAllowedAt ?? entry.givenAt,
    });
  });

  data.notes
    .filter(
      (note) =>
        note.showOnDashboard &&
        !note.resolved &&
        (!note.expiresAt || new Date(note.expiresAt).getTime() >= Date.now()),
    )
    .forEach((note) => {
      items.push({
        id: `note-${note.id}`,
        sourceId: note.id,
        sourceType: "note",
        bucket: noteBucket(note),
        title: note.title,
        details: note.body,
        meta: `Note from ${note.createdBy}`,
        href: "/notes",
        priority: note.priority,
        dueAt: note.expiresAt,
        actionLabel: "Resolve",
      });
    });

  data.trackers
    .filter((tracker) => !tracker.resolved)
    .forEach((tracker) => {
      items.push({
        id: `tracker-${tracker.id}`,
        sourceId: tracker.id,
        sourceType: "tracker",
        bucket: "today",
        title: `${tracker.child}: ${tracker.type.replaceAll("_", " ")}`,
        details: tracker.details,
        meta: `Status from ${tracker.createdBy}`,
        href: "/trackers",
        priority: "urgent",
        dueAt: tracker.createdAt,
        actionLabel: "Resolved",
      });
    });

  data.chores
    .filter((chore) => chore.showWhenDue)
    .forEach((chore) => {
      const dueBucket = choreBucket(chore);
      items.push({
        id: `chore-${chore.id}`,
        sourceId: chore.id,
        sourceType: "chore",
        bucket: dueBucket,
        title: chore.title,
        details: chore.description,
        meta: chore.nextDueAt ? `Due ${formatShortDate(chore.nextDueAt)}` : "As needed",
        href: "/chores",
        priority: dueBucket === "today" ? "important" : "normal",
        dueAt: chore.nextDueAt,
        actionLabel: dueBucket === "today" ? "Complete" : undefined,
      });
    });

  data.supplies
    .filter((supply) => supply.showOnDashboard && supply.status !== "resolved")
    .forEach((supply) => {
      items.push({
        id: `supply-${supply.id}`,
        sourceId: supply.id,
        sourceType: "supply",
        bucket: supply.status === "out" ? "today" : supply.status === "ordered" ? "canWait" : "laterToday",
        title: supply.itemName,
        details: supply.notes ?? `Status: ${supply.status.replaceAll("_", " ")}`,
        meta: `Supply: ${supply.status.replaceAll("_", " ")}`,
        href: "/supplies",
        priority: supply.status === "out" ? "urgent" : "important",
        dueAt: supply.createdAt,
        actionLabel: "Resolved",
      });
    });

  data.calendarEvents
    .filter((event) => event.showOnDashboard && isWithinNextDays(event.startDate, 31))
    .forEach((event) => {
      const bucket = isToday(event.startDate)
        ? "today"
        : isWithinNextDays(event.startDate, 7)
          ? "laterToday"
          : "month";
      items.push({
        id: `calendar-${event.id}`,
        sourceId: event.id,
        sourceType: "calendar",
        bucket,
        title: event.title,
        details: event.description ?? event.category.replaceAll("_", " "),
        meta: formatDateTime(event.startDate),
        href: "/calendar",
        priority: bucket === "today" ? "important" : "normal",
        dueAt: event.startDate,
      });
    });

  data.developmentGoals
    .filter((goal) => goal.active && goal.showOnDashboard)
    .forEach((goal) => {
      items.push({
        id: `development-${goal.id}`,
        sourceId: goal.id,
        sourceType: "development",
        bucket: "month",
        title: `${goal.child}: ${goal.goal}`,
        details: goal.details,
        meta: "Development focus",
        href: "/development",
        priority: "normal",
        dueAt: goal.updatedAt,
      });
    });

  data.milestones
    .filter((milestone) => isWithinNextDays(milestone.date, 31))
    .forEach((milestone) => {
      items.push({
        id: `milestone-${milestone.id}`,
        sourceId: milestone.id,
        sourceType: "milestone",
        bucket: "month",
        title: `${milestone.child}: ${milestone.title}`,
        details: milestone.description,
        meta: `Milestone ${formatShortDate(milestone.date)}`,
        href: "/milestones",
        priority: "normal",
        dueAt: milestone.date,
      });
    });

  return {
    today: sortItems(items.filter((item) => item.bucket === "today")),
    laterToday: sortItems(items.filter((item) => item.bucket === "laterToday")),
    month: sortItems(items.filter((item) => item.bucket === "month")),
    canWait: sortItems(items.filter((item) => item.bucket === "canWait")),
  };
}

function noteBucket(note: Note): DashboardBucket {
  if (note.priority === "urgent") {
    return "today";
  }

  if (note.expiresAt && isOnOrBeforeToday(note.expiresAt)) {
    return "today";
  }

  if (note.priority === "important") {
    return "laterToday";
  }

  return "canWait";
}

function choreBucket(chore: Chore): DashboardBucket {
  if (isOnOrBeforeToday(chore.nextDueAt)) {
    return "today";
  }

  if (chore.nextDueAt && isWithinNextDays(chore.nextDueAt, 31)) {
    return "month";
  }

  return "canWait";
}

function sortItems(items: DashboardItem[]) {
  const priorityWeights = {
    urgent: 3,
    important: 2,
    normal: 1,
  };

  return items.sort((a, b) => {
    const priorityDifference = priorityWeights[b.priority] - priorityWeights[a.priority];
    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return getTime(a.dueAt) - getTime(b.dueAt);
  });
}

function isToday(value: string) {
  const date = new Date(value);
  const start = startOfToday();
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

function getTime(value?: string) {
  return value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER;
}

function prioritySort(a: Note, b: Note) {
  const weights = {
    urgent: 3,
    important: 2,
    normal: 1,
  };
  return weights[b.priority] - weights[a.priority];
}

function supplySort(a: Supply, b: Supply) {
  const weights = {
    out: 4,
    last_one_opened: 3,
    running_low: 2,
    ordered: 1,
    resolved: 0,
  };
  return weights[b.status] - weights[a.status];
}
