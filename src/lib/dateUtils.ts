import type { ChoreFrequency } from "./types";

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function nowISO() {
  return new Date().toISOString();
}

export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function toDateInputValue(value?: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function toDatetimeLocalValue(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function fromDatetimeLocalValue(value: string) {
  return value ? new Date(value).toISOString() : "";
}

export function formatShortDate(value?: string) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value?: string) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function isOnOrBeforeToday(value?: string) {
  if (!value) {
    return false;
  }

  return new Date(value).getTime() <= endOfToday().getTime();
}

export function isOverdue(value?: string) {
  if (!value) {
    return false;
  }

  return new Date(value).getTime() < startOfToday().getTime();
}

export function isWithinNextDays(value: string, days: number) {
  const date = new Date(value);
  const start = startOfToday();
  const end = addDays(start, days);
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

export function calculateNextDueDate(
  completedAt: string,
  frequency: ChoreFrequency,
) {
  const completed = new Date(completedAt);

  switch (frequency) {
    case "daily":
      return addDays(completed, 1).toISOString();
    case "weekly":
      return addDays(completed, 7).toISOString();
    case "biweekly":
      return addDays(completed, 14).toISOString();
    case "monthly":
      return addMonths(completed, 1).toISOString();
    case "as_needed":
      return undefined;
    default:
      return undefined;
  }
}

export function nextAllowedMedicationTime(
  givenAt: string,
  minimumIntervalHours?: number,
) {
  if (!minimumIntervalHours) {
    return undefined;
  }

  const next = new Date(givenAt);
  next.setHours(next.getHours() + minimumIntervalHours);
  return next.toISOString();
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

