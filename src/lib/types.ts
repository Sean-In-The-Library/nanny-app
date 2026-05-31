export type UserName = "Sean" | "Tina" | "Faith";
export type ChildName = "Kieran" | "Connor";
export type Priority = "normal" | "important" | "urgent";

export type Note = {
  id: string;
  title: string;
  body: string;
  priority: Priority;
  createdBy: UserName;
  createdAt: string;
  expiresAt?: string;
  showOnDashboard: boolean;
  resolved: boolean;
};

export type ChoreFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "as_needed";

export type Chore = {
  id: string;
  title: string;
  description: string;
  frequency: ChoreFrequency;
  lastCompletedAt?: string;
  nextDueAt?: string;
  assignedTo?: UserName;
  showWhenDue: boolean;
};

export type CareManual = {
  id: string;
  child: ChildName;
  updatedAt: string;
  sections: {
    morningRoutine: string;
    meals: string;
    napSchedule: string;
    pottyTraining: string;
    diapering: string;
    outsideRoutine: string;
    comfortItems: string;
    developmentNotes: string;
    thingsToAvoid: string;
    currentScheduleSummary: string;
  };
};

export type SupplyStatus =
  | "running_low"
  | "last_one_opened"
  | "out"
  | "ordered"
  | "resolved";

export type Supply = {
  id: string;
  itemName: string;
  status: SupplyStatus;
  notes?: string;
  reportedBy: UserName;
  createdAt: string;
  resolvedAt?: string;
  showOnDashboard: boolean;
};

export type TrackerType =
  | "no_poop"
  | "refused_meal"
  | "poor_sleep"
  | "rash"
  | "behavior"
  | "other";

export type Tracker = {
  id: string;
  child: ChildName;
  type: TrackerType;
  details: string;
  createdBy: UserName;
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
};

export type DevelopmentGoal = {
  id: string;
  child: ChildName;
  goal: string;
  details: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  showOnDashboard: boolean;
};

export type CalendarCategory =
  | "travel"
  | "appointment"
  | "faith_time_off"
  | "household"
  | "birthday"
  | "other";

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  category: CalendarCategory;
  createdBy: UserName;
  showOnDashboard: boolean;
};

export type MedicationEntry = {
  id: string;
  child: ChildName;
  medicineName: string;
  dose: string;
  givenAt: string;
  givenBy: UserName;
  minimumIntervalHours?: number;
  notes?: string;
};

export type Milestone = {
  id: string;
  child: ChildName;
  title: string;
  description: string;
  date: string;
  createdBy: UserName;
};

export type ActionDraftKind =
  | "note"
  | "chore"
  | "supply"
  | "tracker"
  | "calendar"
  | "development"
  | "medication";

export type ActionDraft = {
  id: string;
  kind: ActionDraftKind;
  title: string;
  details: string;
  priority?: Priority;
  child?: ChildName;
  dueDate?: string;
  supplyStatus?: SupplyStatus;
  trackerType?: TrackerType;
  calendarCategory?: CalendarCategory;
  medicineName?: string;
  dose?: string;
  minimumIntervalHours?: number;
  question?: string;
};

export type AppData = {
  notes: Note[];
  chores: Chore[];
  careManuals: CareManual[];
  supplies: Supply[];
  trackers: Tracker[];
  developmentGoals: DevelopmentGoal[];
  calendarEvents: CalendarEvent[];
  medicationEntries: MedicationEntry[];
  milestones: Milestone[];
  updatedAt: string;
};

export type AuthenticatedUser = {
  name: UserName;
  email: string;
  role: "parent" | "nanny";
};

