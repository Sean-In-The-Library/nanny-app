import { addDays, nowISO } from "./dateUtils";
import type { AppData } from "./types";

export function createSeedData(): AppData {
  const now = new Date();
  const lastDose = new Date(now);
  lastDose.setHours(9, 0, 0, 0);

  const minutesAgo = (minutes: number) =>
    new Date(now.getTime() - minutes * 60000).toISOString();

  return {
    notes: [
      {
        id: "note-stomach-bug",
        title: "Gentle day after stomach bug",
        body: "Both boys were off this weekend. Keep food simple, offer extra fluids, and text Tina if either seems low-energy.",
        priority: "urgent",
        createdBy: "Tina",
        createdAt: nowISO(),
        expiresAt: addDays(now, 2).toISOString(),
        showOnDashboard: true,
        resolved: false,
      },
      {
        id: "note-handyman",
        title: "Handyman at 10:30",
        body: "Please keep the boys in the playroom or backyard when he is working near the kitchen.",
        priority: "important",
        createdBy: "Sean",
        createdAt: nowISO(),
        showOnDashboard: true,
        resolved: false,
      },
    ],
    chores: [
      {
        id: "chore-wonder-wagon",
        title: "Clean Wonder Wagon",
        description: "Wipe crumbs, cup holders, and wheels. Text if anything looks broken.",
        frequency: "monthly",
        lastCompletedAt: addDays(now, -35).toISOString(),
        nextDueAt: addDays(now, -5).toISOString(),
        assignedTo: "Faith",
        showWhenDue: true,
      },
      {
        id: "chore-diaper-station",
        title: "Restock diaper station",
        description: "Diapers, wipes, rash cream, and clean changing pads.",
        frequency: "weekly",
        nextDueAt: nowISO(),
        assignedTo: "Faith",
        showWhenDue: true,
      },
    ],
    careManuals: [
      {
        id: "manual-kieran",
        child: "Kieran",
        updatedAt: nowISO(),
        sections: {
          morningRoutine:
            "Start with breakfast, water, and quiet play. Offer potty before leaving the house.",
          meals:
            "Keep meals simple and familiar when he is tired. Encourage but do not force bites.",
          napSchedule:
            "Usually needs a predictable wind-down after lunch. Watch for early tired signs.",
          pottyTraining:
            "Offer regular potty tries without pressure. Celebrate attempts calmly.",
          diapering:
            "Use rash cream if skin is red or irritated. Tell Tina if rash worsens.",
          outsideRoutine:
            "Outside time helps reset the day. Sunscreen and water before longer park trips.",
          comfortItems:
            "Books and familiar quiet toys help when he is dysregulated.",
          developmentNotes:
            "Practice short sentences, letter sounds, and asking for help with words.",
          thingsToAvoid:
            "Avoid making potty or food into a power struggle.",
          currentScheduleSummary:
            "Breakfast, play/outside time, lunch, nap or rest, snack, then calmer afternoon play.",
        },
      },
      {
        id: "manual-connor",
        child: "Connor",
        updatedAt: nowISO(),
        sections: {
          morningRoutine:
            "Start with diaper, breakfast, water, and floor play before errands or outside time.",
          meals:
            "Offer small portions and repeat favorites. Log refused meals if it seems unusual.",
          napSchedule:
            "Needs help winding down. Track poor naps only when it affects the rest of the day.",
          pottyTraining: "Not a primary focus yet.",
          diapering:
            "Change regularly and use cream if redness appears. Watch for constipation clues.",
          outsideRoutine:
            "Likes stroller walks and backyard time. Bring water and snacks.",
          comfortItems:
            "Calm voice, cuddles, and familiar toys help with transitions.",
          developmentNotes:
            "Read short books, repeat new words, and encourage simple requests.",
          thingsToAvoid:
            "Avoid rushed transitions when he is already upset.",
          currentScheduleSummary:
            "Breakfast, morning play, nap, lunch, outside or stroller time, snack, quiet play.",
        },
      },
    ],
    supplies: [
      {
        id: "supply-diapers",
        itemName: "Diapers",
        status: "last_one_opened",
        notes: "Connor size is running low.",
        reportedBy: "Faith",
        createdAt: nowISO(),
        showOnDashboard: true,
      },
      {
        id: "supply-sunscreen",
        itemName: "Sunscreen",
        status: "running_low",
        notes: "Keep one in the diaper bag.",
        reportedBy: "Tina",
        createdAt: nowISO(),
        showOnDashboard: true,
      },
    ],
    trackers: [
      {
        id: "tracker-connor-no-poop",
        child: "Connor",
        type: "no_poop",
        details: "Did not poop yesterday. Watch today and text Tina if still nothing by afternoon.",
        createdBy: "Tina",
        createdAt: nowISO(),
        resolved: false,
      },
    ],
    developmentGoals: [
      {
        id: "dev-kieran-sentences",
        child: "Kieran",
        goal: "Practice full sentences",
        details: "Prompt with calm choices: 'I want water please' or 'Help me please.'",
        active: true,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        showOnDashboard: true,
      },
      {
        id: "dev-connor-reading",
        child: "Connor",
        goal: "Read two short books",
        details: "Repeat new words and note anything adorable or new in milestones.",
        active: true,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        showOnDashboard: true,
      },
    ],
    calendarEvents: [
      {
        id: "calendar-handyman",
        title: "Handyman visit",
        description: "Kitchen sink repair window.",
        startDate: addDays(now, 1).toISOString(),
        category: "household",
        createdBy: "Sean",
        showOnDashboard: true,
      },
      {
        id: "calendar-doctor",
        title: "Pediatrician follow-up",
        description: "Bring diaper bag and water.",
        startDate: addDays(now, 4).toISOString(),
        category: "appointment",
        createdBy: "Tina",
        showOnDashboard: true,
      },
    ],
    medicationEntries: [
      {
        id: "med-kieran-tylenol",
        child: "Kieran",
        medicineName: "Tylenol",
        dose: "5 mL",
        givenAt: lastDose.toISOString(),
        givenBy: "Tina",
        minimumIntervalHours: 4,
        notes: "For fever. Follow label and pediatrician guidance.",
      },
    ],
    milestones: [
      {
        id: "milestone-connor-word",
        child: "Connor",
        title: "New word: outside",
        description: "Repeated 'outside' at the back door after lunch.",
        date: nowISO(),
        createdBy: "Faith",
      },
    ],
    adminItems: [
      {
        id: "admin-quarterly-tax-check",
        title: "Quarterly nanny tax check",
        details:
          "Confirm payroll records are current and the next household employer tax deadline is on the family calendar.",
        category: "tax",
        dueDate: addDays(now, 14).toISOString(),
        owner: "Sean",
        status: "open",
        showOnDashboard: true,
        createdAt: nowISO(),
      },
      {
        id: "admin-documents-review",
        title: "Nanny documents review",
        details:
          "Confirm agreement, payroll forms, emergency contacts, and shared admin notes are current.",
        category: "contract",
        dueDate: addDays(now, 21).toISOString(),
        owner: "Tina",
        status: "open",
        showOnDashboard: true,
        createdAt: nowISO(),
      },
    ],
    logEvents: [
      {
        id: "log-kieran-nap-morning",
        child: "Kieran",
        kind: "nap",
        at: minutesAgo(240),
        endedAt: minutesAgo(170),
        recordedBy: "Faith",
        details: "Went down easily with his books.",
      },
      {
        id: "log-kieran-diaper-after-nap",
        child: "Kieran",
        kind: "diaper",
        at: minutesAgo(165),
        recordedBy: "Faith",
        diaperType: "dirty",
      },
      {
        id: "log-kieran-bottle-midday",
        child: "Kieran",
        kind: "feed",
        at: minutesAgo(120),
        recordedBy: "Faith",
        feedType: "bottle",
        amount: "7 oz",
      },
      {
        id: "log-connor-bottle-midday",
        child: "Connor",
        kind: "feed",
        at: minutesAgo(95),
        recordedBy: "Faith",
        feedType: "bottle",
        amount: "6 oz",
      },
      {
        id: "log-connor-diaper-afternoon",
        child: "Connor",
        kind: "diaper",
        at: minutesAgo(45),
        recordedBy: "Tina",
        diaperType: "wet",
      },
      {
        id: "log-connor-nap-afternoon",
        child: "Connor",
        kind: "nap",
        at: minutesAgo(25),
        recordedBy: "Faith",
        details: "Needed a few minutes of rocking first.",
      },
    ],
    dayDigests: [],
    updatedAt: nowISO(),
  };
}
