import { nowISO } from "./dateUtils";
import type { ActionDraft, AppData, UserName } from "./types";

export function applyActionDrafts(
  data: AppData,
  drafts: ActionDraft[],
  createdBy: UserName,
): AppData {
  const now = nowISO();
  const next = structuredClone(data) as AppData;

  drafts.forEach((draft) => {
    const id = `${draft.kind}-${crypto.randomUUID()}`;
    switch (draft.kind) {
      case "note":
        next.notes.unshift({
          id,
          title: draft.title,
          body: draft.details,
          priority: draft.priority ?? "important",
          createdBy,
          createdAt: now,
          showOnDashboard: true,
          resolved: false,
        });
        break;
      case "chore":
        next.chores.unshift({
          id,
          title: draft.title,
          description: draft.details,
          frequency: "as_needed",
          nextDueAt: draft.dueDate ? new Date(draft.dueDate).toISOString() : now,
          assignedTo: "Faith",
          showWhenDue: true,
        });
        break;
      case "supply":
        next.supplies.unshift({
          id,
          itemName: draft.title,
          status: draft.supplyStatus ?? "running_low",
          notes: draft.details,
          reportedBy: createdBy,
          createdAt: now,
          showOnDashboard: true,
        });
        break;
      case "tracker":
        next.trackers.unshift({
          id,
          child: draft.child ?? "Kieran",
          type: draft.trackerType ?? "other",
          details: `${draft.title}: ${draft.details}`,
          createdBy,
          createdAt: now,
          resolved: false,
        });
        break;
      case "calendar":
        next.calendarEvents.unshift({
          id,
          title: draft.title,
          description: draft.details,
          startDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : now,
          category: draft.calendarCategory ?? "other",
          createdBy,
          showOnDashboard: true,
        });
        break;
      case "development":
        next.developmentGoals.unshift({
          id,
          child: draft.child ?? "Kieran",
          goal: draft.title,
          details: draft.details,
          active: true,
          createdAt: now,
          updatedAt: now,
          showOnDashboard: true,
        });
        break;
      case "medication":
        next.medicationEntries.unshift({
          id,
          child: draft.child ?? "Kieran",
          medicineName: draft.medicineName ?? draft.title,
          dose: draft.dose ?? draft.details,
          givenAt: draft.dueDate ? new Date(draft.dueDate).toISOString() : now,
          givenBy: createdBy,
          minimumIntervalHours: draft.minimumIntervalHours,
          notes: draft.details,
        });
        break;
      default:
        break;
    }
  });

  return next;
}

