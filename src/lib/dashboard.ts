import {
  isOnOrBeforeToday,
  isOverdue,
  isWithinNextDays,
  nextAllowedMedicationTime,
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
};

export function getDashboardData(data: AppData): DashboardData {
  return {
    medicationWindows: data.medicationEntries
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
      .slice(0, 4),
    urgentNotes: data.notes
      .filter(
        (note) =>
          note.showOnDashboard &&
          !note.resolved &&
          (!note.expiresAt || new Date(note.expiresAt).getTime() >= Date.now()),
      )
      .sort(prioritySort),
    unresolvedTrackers: data.trackers.filter((tracker) => !tracker.resolved),
    upcomingEvents: data.calendarEvents
      .filter(
        (event) =>
          event.showOnDashboard && isWithinNextDays(event.startDate, 7),
      )
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      ),
    dueChores: data.chores
      .filter(
        (chore) => chore.showWhenDue && isOnOrBeforeToday(chore.nextDueAt),
      )
      .sort((a, b) => Number(isOverdue(b.nextDueAt)) - Number(isOverdue(a.nextDueAt))),
    lowSupplies: data.supplies
      .filter(
        (supply) => supply.showOnDashboard && supply.status !== "resolved",
      )
      .sort(supplySort),
    activeDevelopmentGoals: data.developmentGoals.filter(
      (goal) => goal.active && goal.showOnDashboard,
    ),
  };
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

