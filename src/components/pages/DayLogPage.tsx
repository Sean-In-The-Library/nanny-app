"use client";

import {
  Baby,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Cookie,
  Frown,
  Laugh,
  Loader2,
  Meh,
  Milk,
  Moon,
  Pill,
  Puzzle,
  Smile,
  Sparkles,
  StickyNote,
  Sun,
  Thermometer,
  Trash2,
  Utensils,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ActionButton } from "../ActionButton";
import { AppShell } from "../AppShell";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { useAppData } from "@/hooks/useAppData";
import { useSession } from "@/hooks/useSession";
import {
  formatDateTime,
  fromDatetimeLocalValue,
  nowISO,
  toDatetimeLocalValue,
} from "@/lib/dateUtils";
import {
  CHILDREN,
  buildChildDayStatus,
  describeLogEvent,
  eventDateString,
  formatFamilyTime,
  getActiveNap,
  getDayEvents,
  napMinutes,
  todayFamilyDateString,
} from "@/lib/dayLog";
import type {
  ChildName,
  DiaperType,
  LogEvent,
  LogEventKind,
  MoodType,
} from "@/lib/types";

type QuickPanel =
  | "bottle"
  | "meal"
  | "snack"
  | "medication"
  | "note"
  | "activity";

type QuickEventExtras = Partial<
  Pick<
    LogEvent,
    | "details"
    | "feedType"
    | "amount"
    | "diaperType"
    | "mood"
    | "medicineName"
    | "dose"
  >
>;

const BOTTLE_AMOUNTS = ["4 oz", "6 oz", "8 oz"];
const MEDICINE_SUGGESTIONS = ["Tylenol", "Motrin"];

const DIAPER_OPTIONS = [
  { value: "wet" as DiaperType, label: "Wet" },
  { value: "dirty" as DiaperType, label: "Dirty" },
  { value: "both" as DiaperType, label: "Both" },
];

const MOOD_OPTIONS = [
  { value: "happy" as MoodType, label: "Happy", icon: Laugh },
  { value: "calm" as MoodType, label: "Calm", icon: Smile },
  { value: "fussy" as MoodType, label: "Fussy", icon: Meh },
  { value: "crying" as MoodType, label: "Crying", icon: Frown },
  { value: "sick" as MoodType, label: "Sick", icon: Thermometer },
];

const tileClass =
  "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border px-2 text-sm font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-55";
const tileIdle =
  "border-[#eadfcd] bg-white text-[#172033] hover:border-[#2f83c5] hover:bg-[#e8f6fc]";
const tileActive = "border-[#2f83c5] bg-[#e8f6fc] text-[#184b72]";

const blankMedForm = { name: "", dose: "", hours: "4" };

/** Shift a YYYY-MM-DD calendar date by whole days, timezone-safe. */
function shiftDateString(date: string, days: number): string {
  const base = new Date(`${date}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** "Mon, Jun 9" for a YYYY-MM-DD calendar date. */
function formatDayHeading(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function formatNextAllowed(nextAllowedAt: string, today: string): string {
  return eventDateString(nextAllowedAt) === today
    ? formatFamilyTime(nextAllowedAt)
    : formatDateTime(nextAllowedAt);
}

export function DayLogPage() {
  const { data, saving, error, refresh, updateData } = useAppData();
  const { user } = useSession();
  const [date, setDate] = useState(() => todayFamilyDateString());
  const [child, setChild] = useState<ChildName>("Kieran");
  const [now, setNow] = useState(() => new Date());
  const [activePanel, setActivePanel] = useState<QuickPanel | null>(null);
  const [panelText, setPanelText] = useState("");
  const [bottleCustom, setBottleCustom] = useState("");
  const [medForm, setMedForm] = useState(blankMedForm);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustStart, setAdjustStart] = useState("");
  const [adjustEnd, setAdjustEnd] = useState("");
  const [digestBusy, setDigestBusy] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const today = todayFamilyDateString(now);
  const isToday = date === today;
  const status = data && isToday ? buildChildDayStatus(data, child, now) : null;
  const liveNapMinutes =
    status?.napping && status.napStartedAt
      ? Math.max(
          0,
          Math.round(
            (now.getTime() - new Date(status.napStartedAt).getTime()) / 60000,
          ),
        )
      : 0;
  const nextAllowedAt = status?.lastMedication?.nextAllowedAt;
  const nextDoseWaiting = Boolean(
    nextAllowedAt && new Date(nextAllowedAt).getTime() > now.getTime(),
  );

  const dayEvents = data
    ? getDayEvents(data, date).filter((event) => event.child === child)
    : [];
  const timelineEvents = dayEvents.slice().reverse();
  const dayNaps = dayEvents.filter((event) => event.kind === "nap");
  const dayTotals = {
    napCount: dayNaps.length,
    napMinutesTotal: dayNaps.reduce(
      (total, nap) => total + napMinutes(nap, now),
      0,
    ),
    feedCount: dayEvents.filter((event) => event.kind === "feed").length,
    diaperCount: dayEvents.filter((event) => event.kind === "diaper").length,
    dirtyCount: dayEvents.filter(
      (event) => event.diaperType === "dirty" || event.diaperType === "both",
    ).length,
  };
  const digest = data
    ? (data.dayDigests ?? []).find((entry) => entry.date === date)
    : undefined;

  function openPanel(panel: QuickPanel) {
    setActivePanel((current) => (current === panel ? null : panel));
    setPanelText("");
    setBottleCustom("");
  }

  async function logQuickEvent(kind: LogEventKind, extras: QuickEventExtras = {}) {
    if (!user) {
      return;
    }
    const recordedBy = user.name;
    const selectedChild = child;
    await updateData((current) => ({
      ...current,
      logEvents: [
        {
          id: `log-${crypto.randomUUID()}`,
          child: selectedChild,
          kind,
          at: nowISO(),
          recordedBy,
          ...extras,
        },
        ...(current.logEvents ?? []),
      ],
    }));
  }

  async function endNap() {
    await updateData((current) => {
      const active = getActiveNap(current, child);
      if (!active) {
        return current;
      }
      return {
        ...current,
        logEvents: (current.logEvents ?? []).map((event) =>
          event.id === active.id ? { ...event, endedAt: nowISO() } : event,
        ),
      };
    });
  }

  async function toggleNap() {
    if (!data) {
      return;
    }
    if (getActiveNap(data, child)) {
      await endNap();
    } else {
      await logQuickEvent("nap");
    }
  }

  async function logBottle(amount: string) {
    if (!amount) {
      return;
    }
    await logQuickEvent("feed", { feedType: "bottle", amount });
    setBottleCustom("");
    setActivePanel(null);
  }

  async function logMealOrSnack(kind: "meal" | "snack") {
    const details = panelText.trim();
    await logQuickEvent("feed", {
      feedType: kind,
      details: details || undefined,
    });
    setPanelText("");
    setActivePanel(null);
  }

  async function logTextEvent(kind: "note" | "activity") {
    const text = panelText.trim();
    if (!text) {
      return;
    }
    await logQuickEvent(kind, { details: text });
    setPanelText("");
    setActivePanel(null);
  }

  async function logMedication() {
    if (!user || !medForm.name.trim() || !medForm.dose.trim()) {
      return;
    }
    const recordedBy = user.name;
    const selectedChild = child;
    const medicineName = medForm.name.trim();
    const dose = medForm.dose.trim();
    const parsedHours = Number(medForm.hours);
    const minimumIntervalHours =
      medForm.hours.trim() && Number.isFinite(parsedHours) && parsedHours > 0
        ? parsedHours
        : undefined;
    const at = nowISO();

    await updateData((current) => ({
      ...current,
      logEvents: [
        {
          id: `log-${crypto.randomUUID()}`,
          child: selectedChild,
          kind: "medication" as const,
          at,
          recordedBy,
          medicineName,
          dose,
        },
        ...(current.logEvents ?? []),
      ],
      medicationEntries: [
        {
          id: `med-${crypto.randomUUID()}`,
          child: selectedChild,
          medicineName,
          dose,
          givenAt: at,
          givenBy: recordedBy,
          minimumIntervalHours,
        },
        ...current.medicationEntries,
      ],
    }));

    setMedForm(blankMedForm);
    setActivePanel(null);
  }

  function openAdjust(event: LogEvent) {
    setAdjustingId(event.id);
    setAdjustStart(toDatetimeLocalValue(event.at));
    setAdjustEnd(event.endedAt ? toDatetimeLocalValue(event.endedAt) : "");
  }

  async function saveAdjust(target: LogEvent) {
    if (!adjustStart) {
      return;
    }
    await updateData((current) => ({
      ...current,
      logEvents: (current.logEvents ?? []).map((event) => {
        if (event.id !== target.id) {
          return event;
        }
        const next: LogEvent = {
          ...event,
          at: fromDatetimeLocalValue(adjustStart),
        };
        if (event.kind === "nap") {
          next.endedAt = adjustEnd
            ? fromDatetimeLocalValue(adjustEnd)
            : undefined;
        }
        return next;
      }),
    }));
    setAdjustingId(null);
  }

  async function removeEvent(event: LogEvent) {
    const message =
      event.kind === "medication"
        ? "Delete this medication entry from the day log? The matching safety entry on the Medication page stays — remove it there too if it was logged by mistake."
        : "Delete this entry from the day log?";
    if (!window.confirm(message)) {
      return;
    }
    await updateData((current) => ({
      ...current,
      logEvents: (current.logEvents ?? []).filter(
        (item) => item.id !== event.id,
      ),
    }));
  }

  async function generateDigest() {
    setDigestBusy(true);
    setDigestError(null);
    try {
      const response = await fetch("/api/ai/daily-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not generate the day digest.");
      }
      await refresh();
    } catch (requestError) {
      setDigestError(
        requestError instanceof Error
          ? requestError.message
          : "Could not generate the day digest.",
      );
    } finally {
      setDigestBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Care log" title="Day Log" />

      <section className="mb-3 rounded-2xl border border-[#d7c8b4] bg-white p-2 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => setDate((current) => shiftDateString(current, -1))}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#dfd1bd] bg-white text-[#314057] shadow-sm transition hover:bg-[#f4eadc]"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
          <div className="min-w-0 text-center">
            <p className="text-lg font-black text-[#172033]">
              {isToday ? "Today" : formatDayHeading(date)}
            </p>
            {isToday ? (
              <p className="text-xs font-bold text-[#667085]">
                {formatDayHeading(date)}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setDate(todayFamilyDateString())}
                className="text-xs font-black text-[#2f83c5] underline-offset-2 hover:underline"
              >
                Jump to today
              </button>
            )}
          </div>
          <button
            type="button"
            aria-label="Next day"
            disabled={isToday}
            onClick={() =>
              setDate((current) =>
                current < today ? shiftDateString(current, 1) : current,
              )
            }
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#dfd1bd] bg-white text-[#314057] shadow-sm transition hover:bg-[#f4eadc] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
      </section>

      <div
        role="group"
        aria-label="Choose child"
        className="mb-3 grid grid-cols-2 gap-1 rounded-2xl border border-[#dfd1bd] bg-white p-1 shadow-sm"
      >
        {CHILDREN.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setChild(name)}
            className={`min-h-12 rounded-xl text-base font-black transition ${
              child === name
                ? "bg-[#2f83c5] text-white shadow-sm"
                : "text-[#536076] hover:bg-[#f4eadc]"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mb-3 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#b42318]">
          {error}
        </p>
      ) : null}

      {!data ? (
        <div className="rounded-2xl border border-[#e8d7bd] bg-white p-5 font-bold text-[#536076]">
          Loading the day log...
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:items-start">
          <div className="space-y-3">
            {isToday && status ? (
              <section className="rounded-2xl border border-[#d7c8b4] bg-white p-4 shadow-sm">
                {status.napping && status.napStartedAt ? (
                  <div className="rounded-2xl bg-[#ebe7fc] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#46389e]">
                      Napping
                    </p>
                    <p className="mt-1 text-2xl font-black text-[#172033]">
                      Since {formatFamilyTime(status.napStartedAt)} (
                      {liveNapMinutes} min)
                    </p>
                    <ActionButton
                      onClick={() => void toggleNap()}
                      disabled={saving}
                      className="mt-3 min-h-[3.5rem] w-full text-base"
                    >
                      <Sun size={18} aria-hidden />
                      End Nap
                    </ActionButton>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#fff3df] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7a4b12]">
                      Awake
                    </p>
                    <p className="mt-1 text-2xl font-black text-[#172033]">
                      {child} is up
                    </p>
                    <ActionButton
                      onClick={() => void toggleNap()}
                      disabled={saving}
                      className="mt-3 min-h-[3.5rem] w-full text-base"
                    >
                      <Moon size={18} aria-hidden />
                      Start Nap
                    </ActionButton>
                  </div>
                )}

                <div className="mt-3 space-y-2 text-sm font-bold text-[#536076]">
                  <p className="flex items-start gap-2">
                    <Milk
                      size={16}
                      className="mt-0.5 shrink-0 text-[#2f83c5]"
                      aria-hidden
                    />
                    <span>
                      {status.lastFeed
                        ? describeLogEvent(status.lastFeed)
                        : "No feeds logged yet"}
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Baby
                      size={16}
                      className="mt-0.5 shrink-0 text-[#2f83c5]"
                      aria-hidden
                    />
                    <span>
                      {status.lastDiaper
                        ? describeLogEvent(status.lastDiaper)
                        : "No diapers logged yet"}
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Pill
                      size={16}
                      className="mt-0.5 shrink-0 text-[#2f83c5]"
                      aria-hidden
                    />
                    <span>
                      {status.lastMedication ? (
                        <>
                          {status.lastMedication.entry.medicineName}{" "}
                          {status.lastMedication.entry.dose} at{" "}
                          {formatDateTime(status.lastMedication.entry.givenAt)}
                          {nextAllowedAt ? (
                            <span
                              className={
                                nextDoseWaiting
                                  ? " font-black text-[#b42318]"
                                  : ""
                              }
                            >
                              {" "}
                              • next dose OK after{" "}
                              {formatNextAllowed(nextAllowedAt, today)}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        "No medication logged"
                      )}
                    </span>
                  </p>
                </div>

                <TotalsChips
                  napCount={status.napCount}
                  napMinutesTotal={status.totalNapMinutes}
                  feedCount={status.feedCount}
                  diaperCount={status.diaperCount}
                  dirtyCount={status.dirtyDiaperCount}
                />
              </section>
            ) : (
              <section className="rounded-2xl border border-[#d7c8b4] bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#d97706]">
                  Day totals
                </p>
                <h2 className="text-lg font-black text-[#172033]">
                  {child} on {formatDayHeading(date)}
                </h2>
                <TotalsChips
                  napCount={dayTotals.napCount}
                  napMinutesTotal={dayTotals.napMinutesTotal}
                  feedCount={dayTotals.feedCount}
                  diaperCount={dayTotals.diaperCount}
                  dirtyCount={dayTotals.dirtyCount}
                />
                <p className="mt-3 text-xs font-bold text-[#667085]">
                  Viewing a past day. Quick logging is off, but you can still
                  adjust times or delete entries below.
                </p>
              </section>
            )}

            {isToday ? (
              <section className="rounded-2xl border border-[#d7c8b4] bg-[#fffaf0] p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#d97706]">
                  Quick log
                </p>
                <h2 className="text-lg font-black text-[#172033]">
                  One tap for {child}
                </h2>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void toggleNap()}
                    className={`${tileClass} ${tileIdle}`}
                  >
                    {status?.napping ? (
                      <Sun size={20} className="text-[#2f83c5]" aria-hidden />
                    ) : (
                      <Moon size={20} className="text-[#2f83c5]" aria-hidden />
                    )}
                    <span>{status?.napping ? "End Nap" : "Start Nap"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPanel("bottle")}
                    className={`${tileClass} ${
                      activePanel === "bottle" ? tileActive : tileIdle
                    }`}
                  >
                    <Milk size={20} className="text-[#2f83c5]" aria-hidden />
                    <span>Bottle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPanel("meal")}
                    className={`${tileClass} ${
                      activePanel === "meal" ? tileActive : tileIdle
                    }`}
                  >
                    <Utensils size={20} className="text-[#2f83c5]" aria-hidden />
                    <span>Meal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPanel("snack")}
                    className={`${tileClass} ${
                      activePanel === "snack" ? tileActive : tileIdle
                    }`}
                  >
                    <Cookie size={20} className="text-[#2f83c5]" aria-hidden />
                    <span>Snack</span>
                  </button>
                </div>

                <div className="mt-3">
                  <p className="mb-1 text-xs font-black uppercase tracking-[0.12em] text-[#667085]">
                    Diaper — one tap
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {DIAPER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          void logQuickEvent("diaper", {
                            diaperType: option.value,
                          })
                        }
                        className="min-h-12 rounded-xl border border-[#eadfcd] bg-white text-sm font-black text-[#172033] shadow-sm transition hover:border-[#2f83c5] hover:bg-[#e8f6fc] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="mb-1 text-xs font-black uppercase tracking-[0.12em] text-[#667085]">
                    Mood — one tap
                  </p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {MOOD_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            void logQuickEvent("mood", { mood: option.value })
                          }
                          className="flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl border border-[#eadfcd] bg-white px-1 text-[11px] font-black text-[#172033] shadow-sm transition hover:border-[#2f83c5] hover:bg-[#e8f6fc] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          <Icon
                            size={18}
                            className="text-[#2f83c5]"
                            aria-hidden
                          />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => openPanel("medication")}
                    className={`${tileClass} ${
                      activePanel === "medication" ? tileActive : tileIdle
                    }`}
                  >
                    <Pill size={20} className="text-[#2f83c5]" aria-hidden />
                    <span>Medicine</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPanel("note")}
                    className={`${tileClass} ${
                      activePanel === "note" ? tileActive : tileIdle
                    }`}
                  >
                    <StickyNote
                      size={20}
                      className="text-[#2f83c5]"
                      aria-hidden
                    />
                    <span>Note</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPanel("activity")}
                    className={`${tileClass} ${
                      activePanel === "activity" ? tileActive : tileIdle
                    }`}
                  >
                    <Puzzle size={20} className="text-[#2f83c5]" aria-hidden />
                    <span>Activity</span>
                  </button>
                </div>

                {activePanel === "bottle" ? (
                  <div className="mt-3 rounded-2xl border border-[#e8d7bd] bg-white p-3">
                    <p className="text-sm font-black text-[#172033]">
                      Bottle for {child}
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {BOTTLE_AMOUNTS.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          disabled={saving}
                          onClick={() => void logBottle(amount)}
                          className="min-h-12 rounded-xl bg-[#e8f6fc] text-base font-black text-[#184b72] transition hover:bg-[#d3ecfa] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={bottleCustom}
                        onChange={(event) =>
                          setBottleCustom(event.target.value)
                        }
                        placeholder="Custom — 3 oz, half bottle..."
                        className="h-12 min-w-0 flex-1 rounded-xl border border-[#dfd1bd] bg-white px-3 font-semibold"
                      />
                      <ActionButton
                        onClick={() => void logBottle(bottleCustom.trim())}
                        disabled={saving || !bottleCustom.trim()}
                      >
                        Log
                      </ActionButton>
                    </div>
                  </div>
                ) : null}

                {activePanel === "meal" || activePanel === "snack" ? (
                  <div className="mt-3 rounded-2xl border border-[#e8d7bd] bg-white p-3">
                    <p className="text-sm font-black text-[#172033]">
                      {activePanel === "meal" ? "Meal" : "Snack"} for {child}
                    </p>
                    <input
                      value={panelText}
                      onChange={(event) => setPanelText(event.target.value)}
                      placeholder={
                        activePanel === "meal"
                          ? "What was eaten? (optional)"
                          : "What snack? (optional)"
                      }
                      className="mt-2 h-12 w-full rounded-xl border border-[#dfd1bd] bg-white px-3 font-semibold"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <ActionButton
                        onClick={() => void logMealOrSnack(activePanel)}
                        disabled={saving}
                      >
                        Log {activePanel === "meal" ? "Meal" : "Snack"}
                      </ActionButton>
                      <ActionButton
                        tone="quiet"
                        onClick={() => setActivePanel(null)}
                      >
                        Cancel
                      </ActionButton>
                    </div>
                  </div>
                ) : null}

                {activePanel === "medication" ? (
                  <div className="mt-3 rounded-2xl border border-[#e8d7bd] bg-white p-3">
                    <p className="text-sm font-black text-[#172033]">
                      Medication for {child}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {MEDICINE_SUGGESTIONS.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() =>
                            setMedForm((current) => ({ ...current, name }))
                          }
                          className={`min-h-11 rounded-xl px-4 text-sm font-black transition ${
                            medForm.name === name
                              ? "bg-[#2f83c5] text-white"
                              : "bg-[#e8f6fc] text-[#184b72] hover:bg-[#d3ecfa]"
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <label>
                        <span className="mb-1 block text-xs font-black">
                          Medicine
                        </span>
                        <input
                          value={medForm.name}
                          onChange={(event) =>
                            setMedForm((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          className="h-12 w-full rounded-xl border border-[#dfd1bd] bg-white px-3 font-semibold"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-black">
                          Dose
                        </span>
                        <input
                          value={medForm.dose}
                          onChange={(event) =>
                            setMedForm((current) => ({
                              ...current,
                              dose: event.target.value,
                            }))
                          }
                          placeholder="2.5 ml"
                          className="h-12 w-full rounded-xl border border-[#dfd1bd] bg-white px-3 font-semibold"
                        />
                      </label>
                    </div>
                    <label className="mt-2 block">
                      <span className="mb-1 block text-xs font-black">
                        Minimum hours between doses (optional)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={medForm.hours}
                        onChange={(event) =>
                          setMedForm((current) => ({
                            ...current,
                            hours: event.target.value,
                          }))
                        }
                        className="h-12 w-full rounded-xl border border-[#dfd1bd] bg-white px-3 font-semibold"
                      />
                    </label>
                    <p className="mt-2 text-xs font-bold text-[#667085]">
                      Also saved to the Medication page so next-dose timing
                      stays tracked.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <ActionButton
                        onClick={() => void logMedication()}
                        disabled={
                          saving ||
                          !medForm.name.trim() ||
                          !medForm.dose.trim()
                        }
                      >
                        Log Medication
                      </ActionButton>
                      <ActionButton
                        tone="quiet"
                        onClick={() => setActivePanel(null)}
                      >
                        Cancel
                      </ActionButton>
                    </div>
                  </div>
                ) : null}

                {activePanel === "note" || activePanel === "activity" ? (
                  <div className="mt-3 rounded-2xl border border-[#e8d7bd] bg-white p-3">
                    <p className="text-sm font-black text-[#172033]">
                      {activePanel === "note" ? "Note" : "Activity"} for {child}
                    </p>
                    <textarea
                      value={panelText}
                      onChange={(event) => setPanelText(event.target.value)}
                      rows={3}
                      placeholder={
                        activePanel === "note"
                          ? "Anything worth remembering..."
                          : "Park trip, tummy time, story..."
                      }
                      className="mt-2 w-full rounded-xl border border-[#dfd1bd] bg-white px-3 py-2 font-semibold"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <ActionButton
                        onClick={() => void logTextEvent(activePanel)}
                        disabled={saving || !panelText.trim()}
                      >
                        Save {activePanel === "note" ? "Note" : "Activity"}
                      </ActionButton>
                      <ActionButton
                        tone="quiet"
                        onClick={() => setActivePanel(null)}
                      >
                        Cancel
                      </ActionButton>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>

          <div className="space-y-3">
            <section className="rounded-2xl border border-[#d7c8b4] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-black text-[#172033]">
                  Timeline
                </h2>
                <span className="inline-flex min-w-8 justify-center rounded-full bg-[#fff3df] px-2 py-1 text-xs font-black text-[#7a4b12]">
                  {timelineEvents.length}
                </span>
              </div>
              {timelineEvents.length ? (
                <ol className="space-y-2">
                  {timelineEvents.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-2xl border border-[#eadfcd] bg-[#fffaf0] p-3"
                    >
                      <div className="flex gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f6fc] text-[#184b72]">
                          <KindIcon event={event} size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black leading-snug text-[#172033]">
                            {describeLogEvent(event)}
                          </p>
                          {event.details &&
                          event.kind !== "note" &&
                          event.kind !== "activity" ? (
                            <p className="mt-0.5 text-sm leading-5 text-[#536076]">
                              {event.details}
                            </p>
                          ) : null}
                          <p className="mt-1 text-xs font-bold text-[#667085]">
                            by {event.recordedBy}
                          </p>

                          {adjustingId === event.id ? (
                            <div className="mt-2 rounded-xl border border-[#e8d7bd] bg-white p-3">
                              <label className="block">
                                <span className="mb-1 block text-xs font-black">
                                  {event.kind === "nap" ? "Start time" : "Time"}
                                </span>
                                <input
                                  type="datetime-local"
                                  value={adjustStart}
                                  onChange={(changeEvent) =>
                                    setAdjustStart(changeEvent.target.value)
                                  }
                                  className="h-12 w-full rounded-xl border border-[#dfd1bd] bg-white px-3 font-semibold"
                                />
                              </label>
                              {event.kind === "nap" ? (
                                <label className="mt-2 block">
                                  <span className="mb-1 block text-xs font-black">
                                    End time
                                  </span>
                                  <input
                                    type="datetime-local"
                                    value={adjustEnd}
                                    onChange={(changeEvent) =>
                                      setAdjustEnd(changeEvent.target.value)
                                    }
                                    className="h-12 w-full rounded-xl border border-[#dfd1bd] bg-white px-3 font-semibold"
                                  />
                                  <span className="mt-1 block text-xs font-bold text-[#667085]">
                                    Leave empty if the nap is still going.
                                  </span>
                                </label>
                              ) : null}
                              <div className="mt-2 flex flex-wrap gap-2">
                                <ActionButton
                                  onClick={() => void saveAdjust(event)}
                                  disabled={saving || !adjustStart}
                                >
                                  Save Time
                                </ActionButton>
                                <ActionButton
                                  tone="quiet"
                                  onClick={() => setAdjustingId(null)}
                                >
                                  Cancel
                                </ActionButton>
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col gap-1.5">
                          <button
                            type="button"
                            aria-label="Adjust time"
                            title="Adjust time"
                            onClick={() =>
                              adjustingId === event.id
                                ? setAdjustingId(null)
                                : openAdjust(event)
                            }
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#dfd1bd] bg-white text-[#314057] transition hover:bg-[#f4eadc]"
                          >
                            <Clock3 size={16} aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete entry"
                            title="Delete entry"
                            onClick={() => void removeEvent(event)}
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#f3a5a5] bg-white text-[#b42318] transition hover:bg-[#fff0ee]"
                          >
                            <Trash2 size={16} aria-hidden />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState
                  text={
                    isToday
                      ? `Nothing logged yet today for ${child}. The buttons above make it quick.`
                      : `Nothing was logged for ${child} on this day.`
                  }
                />
              )}
            </section>

            <section className="rounded-2xl border border-[#f5bf7d] bg-[#fff3df] p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#c75c00]">
                    Day digest
                  </p>
                  <h2 className="text-lg font-black text-[#172033]">
                    {isToday ? "Today, in one read" : "The day, in one read"}
                  </h2>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#c75c00]">
                  <Sparkles size={18} aria-hidden />
                </span>
              </div>

              {digest ? (
                <>
                  <p className="text-sm font-semibold leading-6 text-[#314057]">
                    {digest.summary}
                  </p>
                  {digest.flags.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {digest.flags.map((flag) => (
                        <li
                          key={flag}
                          className="rounded-xl bg-white/80 px-3 py-2 text-sm font-bold text-[#7a4b12]"
                        >
                          {flag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-2 text-xs font-bold text-[#7a4b12]">
                    {digest.source === "ai" ? "AI digest" : "Local digest"} •
                    generated {formatDateTime(digest.generatedAt)} by{" "}
                    {digest.generatedBy}
                  </p>
                  <ActionButton
                    tone="quiet"
                    onClick={() => void generateDigest()}
                    disabled={digestBusy}
                    className="mt-3"
                  >
                    {digestBusy ? (
                      <Loader2 className="animate-spin" size={16} aria-hidden />
                    ) : (
                      <Sparkles size={16} aria-hidden />
                    )}
                    Regenerate
                  </ActionButton>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold leading-6 text-[#7a4b12]">
                    No digest for this day yet. Generate one to hand off the
                    whole day in a single read.
                  </p>
                  <ActionButton
                    onClick={() => void generateDigest()}
                    disabled={digestBusy}
                    className="mt-3"
                  >
                    {digestBusy ? (
                      <Loader2 className="animate-spin" size={16} aria-hidden />
                    ) : (
                      <Sparkles size={16} aria-hidden />
                    )}
                    Generate Day Digest
                  </ActionButton>
                </>
              )}

              {digestError ? (
                <p className="mt-3 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#b42318]">
                  {digestError}
                </p>
              ) : null}
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function TotalsChips({
  napCount,
  napMinutesTotal,
  feedCount,
  diaperCount,
  dirtyCount,
}: {
  napCount: number;
  napMinutesTotal: number;
  feedCount: number;
  diaperCount: number;
  dirtyCount: number;
}) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-xl bg-[#fffaf0] px-2 py-2">
        <span className="block text-lg font-black text-[#172033]">
          {napCount}
        </span>
        <span className="block text-[11px] font-bold text-[#667085]">
          naps • {napMinutesTotal} min
        </span>
      </div>
      <div className="rounded-xl bg-[#fffaf0] px-2 py-2">
        <span className="block text-lg font-black text-[#172033]">
          {feedCount}
        </span>
        <span className="block text-[11px] font-bold text-[#667085]">
          feeds
        </span>
      </div>
      <div className="rounded-xl bg-[#fffaf0] px-2 py-2">
        <span className="block text-lg font-black text-[#172033]">
          {diaperCount}
        </span>
        <span className="block text-[11px] font-bold text-[#667085]">
          diapers • {dirtyCount} dirty
        </span>
      </div>
    </div>
  );
}

function KindIcon({ event, size }: { event: LogEvent; size: number }) {
  switch (event.kind) {
    case "nap":
      return <Moon size={size} aria-hidden />;
    case "feed":
      return event.feedType === "bottle" ? (
        <Milk size={size} aria-hidden />
      ) : (
        <Utensils size={size} aria-hidden />
      );
    case "diaper":
      return <Baby size={size} aria-hidden />;
    case "medication":
      return <Pill size={size} aria-hidden />;
    case "mood":
      return <Smile size={size} aria-hidden />;
    case "activity":
      return <Puzzle size={size} aria-hidden />;
    case "note":
    default:
      return <StickyNote size={size} aria-hidden />;
  }
}
