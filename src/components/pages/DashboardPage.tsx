"use client";

import {
  Baby,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  HeartHandshake,
  HeartPulse,
  ListFilter,
  Milk,
  PackageOpen,
  Pill,
  Plus,
  Sparkles,
  StickyNote,
  TimerReset,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ActionButton } from "../ActionButton";
import { AppShell } from "../AppShell";
import { ChildBadge } from "../ChildBadge";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { PriorityPill } from "../PriorityPill";
import { QuickActionStrip } from "../QuickActions";
import { TinaCommandCenter } from "../TinaCommandCenter";
import { useAppData } from "@/hooks/useAppData";
import { useSession } from "@/hooks/useSession";
import { calculateNextDueDate, formatDateTime, nowISO } from "@/lib/dateUtils";
import {
  type DashboardBucket,
  type DashboardData,
  type DashboardItem,
  getDashboardData,
} from "@/lib/dashboard";
import {
  CHILDREN,
  buildChildDayStatus,
  eventDateString,
  formatFamilyTime,
  todayFamilyDateString,
} from "@/lib/dayLog";
import type { AppData, ChildName } from "@/lib/types";

const BUCKETS: Array<{
  key: DashboardBucket;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    key: "today",
    label: "Today",
    shortLabel: "Now",
    description: "Urgent, due, or time-sensitive",
  },
  {
    key: "laterToday",
    label: "Later Today",
    shortLabel: "Later",
    description: "Useful soon, not urgent",
  },
  {
    key: "month",
    label: "This Month",
    shortLabel: "Month",
    description: "Deadlines, events, and goals",
  },
  {
    key: "canWait",
    label: "Can Wait",
    shortLabel: "Wait",
    description: "Low-pressure follow-up",
  },
];

export function DashboardPage() {
  const { data, loading, saving, error, saveData, updateData } = useAppData();
  const { user } = useSession();
  const [activeBucket, setActiveBucket] = useState<DashboardBucket>("today");
  const [viewMode, setViewMode] = useState<"parent" | "nanny">("parent");

  const canPreviewNannyView = user?.name === "Tina";
  const isNannyPreview = canPreviewNannyView && viewMode === "nanny";
  const effectiveIsParent = user?.role === "parent" && !isNannyPreview;

  async function resolveNote(id: string) {
    await updateData((current) => ({
      ...current,
      notes: current.notes.map((note) =>
        note.id === id ? { ...note, resolved: true } : note,
      ),
    }));
  }

  async function completeChore(id: string) {
    await updateData((current) => ({
      ...current,
      chores: current.chores.map((chore) => {
        if (chore.id !== id) {
          return chore;
        }
        const completedAt = nowISO();
        return {
          ...chore,
          lastCompletedAt: completedAt,
          nextDueAt: calculateNextDueDate(completedAt, chore.frequency),
        };
      }),
    }));
  }

  async function resolveSupply(id: string) {
    await updateData((current) => ({
      ...current,
      supplies: current.supplies.map((supply) =>
        supply.id === id
          ? { ...supply, status: "resolved", resolvedAt: nowISO() }
          : supply,
      ),
    }));
  }

  async function resolveTracker(id: string) {
    await updateData((current) => ({
      ...current,
      trackers: current.trackers.map((tracker) =>
        tracker.id === id
          ? { ...tracker, resolved: true, resolvedAt: nowISO() }
          : tracker,
      ),
    }));
  }

  async function handleItemAction(item: DashboardItem) {
    if (item.sourceType === "note") {
      await resolveNote(item.sourceId);
      return;
    }
    if (item.sourceType === "chore") {
      await completeChore(item.sourceId);
      return;
    }
    if (item.sourceType === "supply") {
      await resolveSupply(item.sourceId);
      return;
    }
    if (item.sourceType === "tracker") {
      await resolveTracker(item.sourceId);
      return;
    }
    if (item.sourceType === "admin") {
      await completeAdminItem(item.sourceId);
    }
  }

  async function completeAdminItem(id: string) {
    await updateData((current) => ({
      ...current,
      adminItems: current.adminItems.map((item) =>
        item.id === id
          ? { ...item, status: "done", completedAt: nowISO() }
          : item,
      ),
    }));
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Home" title="Family priority map">
        <div className="flex flex-wrap items-center gap-2">
          {canPreviewNannyView ? (
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          ) : null}
          <Link
            href="/notes?new=1"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#2f83c5] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#246ca3]"
          >
            <Plus size={16} aria-hidden />
            Add Note
          </Link>
        </div>
      </PageHeader>

      {loading || !data ? (
        <div className="rounded-2xl border border-[#e8d7bd] bg-white p-5 font-bold text-[#536076]">
          Loading family dashboard...
        </div>
      ) : (
        <DashboardContent
          dashboard={getDashboardData(data, { includeAdmin: effectiveIsParent })}
          data={data}
          error={error}
          saving={saving}
          activeBucket={activeBucket}
          onBucketChange={setActiveBucket}
          onItemAction={handleItemAction}
          onSave={saveData}
          isNannyPreview={isNannyPreview}
          isParent={effectiveIsParent}
        />
      )}
    </AppShell>
  );
}

function DashboardContent({
  dashboard,
  data,
  error,
  saving,
  activeBucket,
  isNannyPreview,
  isParent,
  onBucketChange,
  onItemAction,
  onSave,
}: {
  dashboard: DashboardData;
  data: AppData;
  error: string | null;
  saving: boolean;
  activeBucket: DashboardBucket;
  isNannyPreview: boolean;
  isParent: boolean;
  onBucketChange: (bucket: DashboardBucket) => void;
  onItemAction: (item: DashboardItem) => Promise<void>;
  onSave: (nextData: AppData) => Promise<AppData>;
}) {
  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#b42318]">
          {error}
        </p>
      ) : null}

      <RightNowStrip data={data} />

      <TodayDigestCard data={data} />

      <QuickActionStrip mode={isParent ? "parent" : "nanny"} />

      {isNannyPreview ? <NannyPreviewBanner /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.85fr)] xl:items-start">
        <main className="order-2 space-y-4 xl:order-1">
          <FocusFeed
            dashboard={dashboard}
            activeBucket={activeBucket}
            onBucketChange={onBucketChange}
            onItemAction={onItemAction}
          />
          <PriorityOverview
            dashboard={dashboard}
            activeBucket={activeBucket}
            onBucketChange={onBucketChange}
          />
        </main>

        <aside className="order-1 space-y-4 xl:sticky xl:top-24 xl:order-2">
          {isParent ? (
            <TinaCommandCenter data={data} saving={saving} onSave={onSave} />
          ) : (
            <NannyDashboardIntro />
          )}

          <ContextPanel
            title="This Month"
            items={dashboard.focus.month}
            empty="No monthly context yet."
          />
          <ContextPanel
            title="Later Today"
            items={dashboard.focus.laterToday}
            empty="No later-day reminders."
          />
          <ContextPanel
            title="Can Wait"
            items={dashboard.focus.canWait}
            empty="Nothing waiting."
          />
        </aside>
      </div>
    </div>
  );
}

function ViewModeToggle({
  onChange,
  value,
}: {
  onChange: (value: "parent" | "nanny") => void;
  value: "parent" | "nanny";
}) {
  return (
    <div
      aria-label="Dashboard view mode"
      className="grid grid-cols-2 rounded-xl border border-[#dfd1bd] bg-white p-1 shadow-sm"
      role="group"
    >
      {(["parent", "nanny"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`min-h-9 rounded-lg px-3 text-sm font-black transition ${
            value === mode
              ? "bg-[#2f83c5] text-white"
              : "text-[#536076] hover:bg-[#f4eadc]"
          }`}
        >
          {mode === "parent" ? "Parent" : "Nanny preview"}
        </button>
      ))}
    </div>
  );
}

function NannyPreviewBanner() {
  return (
    <section className="rounded-2xl border border-[#b8ddb9] bg-[#edf8ed] p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#3a6b42]">
            Tina previewing Faith&apos;s view
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#3a6b42]">
            Admin reminders and parent-only command tools are hidden. The feed
            now reflects the simplified nanny-facing dashboard.
          </p>
        </div>
      </div>
    </section>
  );
}

function PriorityOverview({
  dashboard,
  activeBucket,
  onBucketChange,
}: {
  dashboard: DashboardData;
  activeBucket: DashboardBucket;
  onBucketChange: (bucket: DashboardBucket) => void;
}) {
  const counts = dashboard.summary;

  return (
    <section className="rounded-2xl border border-[#d7c8b4] bg-white p-3 shadow-sm sm:p-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {BUCKETS.map((bucket) => {
          const active = activeBucket === bucket.key;
          return (
            <button
              key={bucket.key}
              type="button"
              onClick={() => onBucketChange(bucket.key)}
              className={`min-h-[88px] rounded-xl border p-3 text-left transition ${
                active
                  ? "border-[#2f83c5] bg-[#e8f6fc] shadow-sm"
                  : "border-[#eadfcd] bg-[#fffaf0] hover:bg-[#f4eadc]"
              }`}
            >
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-xs font-black uppercase tracking-[0.12em] text-[#667085]">
                    {bucket.shortLabel}
                  </span>
                  <span className="mt-1 block text-2xl font-black text-[#172033]">
                    {counts[bucket.key]}
                  </span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#2f83c5]">
                  <BucketIcon bucket={bucket.key} />
                </span>
              </span>
              <span className="mt-2 block text-sm font-bold leading-5 text-[#536076]">
                {bucket.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid gap-2 text-sm font-bold text-[#536076] sm:grid-cols-2">
        <p className="rounded-xl bg-[#fff3df] px-3 py-2">
          {counts.urgent} urgent today
        </p>
        <p className="rounded-xl bg-[#fff0ee] px-3 py-2">
          {counts.overdue} overdue items
        </p>
      </div>
    </section>
  );
}

function FocusFeed({
  dashboard,
  activeBucket,
  onBucketChange,
  onItemAction,
}: {
  dashboard: DashboardData;
  activeBucket: DashboardBucket;
  onBucketChange: (bucket: DashboardBucket) => void;
  onItemAction: (item: DashboardItem) => Promise<void>;
}) {
  const items = dashboard.focus[activeBucket];
  const activeConfig = BUCKETS.find((bucket) => bucket.key === activeBucket) ?? BUCKETS[0];

  return (
    <section className="rounded-2xl border border-[#d7c8b4] bg-[#fffaf0] p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#d97706]">
            Focus feed
          </p>
          <h2 className="text-xl font-black text-[#172033]">
            {activeConfig.label}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#667085]">
            {activeConfig.description}
          </p>
        </div>
        <Link
          href={items[0]?.href ?? "/notes"}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#dfd1bd] bg-white px-3 text-sm font-black text-[#314057] shadow-sm transition hover:bg-[#f4eadc]"
        >
          Open Source
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BUCKETS.map((bucket) => (
          <button
            key={bucket.key}
            type="button"
            onClick={() => onBucketChange(bucket.key)}
            className={`min-h-10 rounded-xl px-3 text-sm font-black transition ${
              activeBucket === bucket.key
                ? "bg-[#2f83c5] text-white"
                : "bg-white text-[#536076] hover:bg-[#f4eadc]"
            }`}
          >
            {bucket.label}
          </button>
        ))}
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <DashboardItemCard
              key={item.id}
              item={item}
              onItemAction={onItemAction}
            />
          ))}
        </div>
      ) : (
        <EmptyState text="Nothing in this bucket." />
      )}
    </section>
  );
}

function DashboardItemCard({
  item,
  onItemAction,
}: {
  item: DashboardItem;
  onItemAction: (item: DashboardItem) => Promise<void>;
}) {
  return (
    <article className="rounded-2xl border border-[#eadfcd] bg-white p-3 shadow-sm sm:p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f6fc] text-[#184b72]">
          <SourceIcon type={item.sourceType} size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <PriorityPill value={item.priority} />
            <span className="text-xs font-bold text-[#667085]">{item.meta}</span>
          </div>
          <h3 className="text-base font-black leading-snug text-[#172033]">
            {item.title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-[#536076]">{item.details}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.actionLabel ? (
              <ActionButton tone="quiet" onClick={() => void onItemAction(item)}>
                <CheckCircle2 size={16} aria-hidden />
                {item.actionLabel}
              </ActionButton>
            ) : null}
            <Link
              href={item.href}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#dfd1bd] bg-white px-4 text-sm font-black text-[#314057] shadow-sm transition hover:bg-[#f4eadc]"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function ContextPanel({
  title,
  items,
  empty,
}: {
  title: string;
  items: DashboardItem[];
  empty: string;
}) {
  const visibleItems = items.slice(0, 4);

  return (
    <section className="rounded-2xl border border-[#d7c8b4] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-[#172033]">{title}</h2>
        <span className="inline-flex min-w-8 justify-center rounded-full bg-[#fff3df] px-2 py-1 text-xs font-black text-[#7a4b12]">
          {items.length}
        </span>
      </div>
      {visibleItems.length ? (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex gap-3 rounded-xl bg-[#fffaf0] p-3 transition hover:bg-[#f4eadc]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#2f83c5]">
                  <SourceIcon type={item.sourceType} size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-[#172033]">
                    {item.title}
                  </span>
                  <span className="block truncate text-xs font-semibold text-[#667085]">
                    {item.meta}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState text={empty} />
      )}
    </section>
  );
}

function NannyDashboardIntro() {
  return (
    <section className="rounded-2xl border border-[#b8ddb9] bg-[#edf8ed] p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#245b2d] shadow-sm">
          <HeartHandshake size={20} aria-hidden />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#3a6b42]">
            Faith view
          </p>
          <h2 className="text-xl font-black text-[#172033]">
            Today&apos;s care notes
          </h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#3a6b42]">
            Start with urgent items, then move through chores, supplies, and
            child status notes as the day allows.
          </p>
        </div>
      </div>
    </section>
  );
}

function RightNowStrip({ data }: { data: AppData }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const today = todayFamilyDateString(now);

  return (
    <section className="rounded-2xl border border-[#d7c8b4] bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#d97706]">
          Right now
        </p>
        <Link
          href="/day"
          className="text-xs font-black text-[#2f83c5] underline-offset-2 hover:underline"
        >
          Open Day Log
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CHILDREN.map((child) => (
          <RightNowChildCard
            key={child}
            data={data}
            child={child}
            now={now}
            today={today}
          />
        ))}
      </div>
    </section>
  );
}

function RightNowChildCard({
  data,
  child,
  now,
  today,
}: {
  data: AppData;
  child: ChildName;
  now: Date;
  today: string;
}) {
  const status = buildChildDayStatus(data, child, now);
  const liveNapMinutes =
    status.napping && status.napStartedAt
      ? Math.max(
          0,
          Math.round(
            (now.getTime() - new Date(status.napStartedAt).getTime()) / 60000,
          ),
        )
      : 0;
  const med = status.lastMedication;
  const medGivenToday = med
    ? eventDateString(med.entry.givenAt) === today
    : false;
  const nextDoseWaiting = Boolean(
    med?.nextAllowedAt &&
      new Date(med.nextAllowedAt).getTime() > now.getTime(),
  );
  const hasAnythingToday = status.eventCount > 0 || medGivenToday;

  return (
    <Link
      href="/day"
      className="block rounded-xl border border-[#eadfcd] bg-[#fffaf0] p-3 transition hover:border-[#2f83c5] hover:bg-[#e8f6fc]"
    >
      <span className="flex items-center justify-between gap-2">
        <ChildBadge child={child} />
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-black ${
            status.napping
              ? "bg-[#e9e6fb] text-[#46389e]"
              : "bg-[#fff3df] text-[#7a4b12]"
          }`}
        >
          {status.napping ? `Asleep • ${liveNapMinutes}m` : "Awake"}
        </span>
      </span>
      {hasAnythingToday ? (
        <span className="mt-2 block space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#536076]">
            <Milk size={13} className="shrink-0 text-[#2f83c5]" aria-hidden />
            <span className="min-w-0 truncate">
              {status.lastFeed
                ? `${formatFamilyTime(status.lastFeed.at)} • ${
                    status.lastFeed.feedType ?? "feed"
                  }${status.lastFeed.amount ? ` ${status.lastFeed.amount}` : ""}`
                : "No feeds yet"}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#536076]">
            <Baby size={13} className="shrink-0 text-[#2f83c5]" aria-hidden />
            <span className="min-w-0 truncate">
              {status.lastDiaper
                ? `${formatFamilyTime(status.lastDiaper.at)} • ${
                    status.lastDiaper.diaperType ?? "changed"
                  }`
                : "No diapers yet"}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#536076]">
            <Pill size={13} className="shrink-0 text-[#2f83c5]" aria-hidden />
            <span className="min-w-0 truncate">
              {med && (medGivenToday || nextDoseWaiting) ? (
                <>
                  {medGivenToday
                    ? formatFamilyTime(med.entry.givenAt)
                    : formatDateTime(med.entry.givenAt)}{" "}
                  • {med.entry.medicineName}
                  {med.nextAllowedAt ? (
                    <span
                      className={nextDoseWaiting ? " text-[#b42318]" : ""}
                    >
                      {" "}
                      • OK after {formatFamilyTime(med.nextAllowedAt)}
                    </span>
                  ) : null}
                </>
              ) : (
                "No meds today"
              )}
            </span>
          </span>
        </span>
      ) : (
        <span className="mt-2 block text-xs font-bold leading-5 text-[#667085]">
          Nothing logged yet today — tap to open the Day Log.
        </span>
      )}
    </Link>
  );
}

function TodayDigestCard({ data }: { data: AppData }) {
  const digest = (data.dayDigests ?? []).find(
    (entry) => entry.date === todayFamilyDateString(),
  );

  if (!digest) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[#f5bf7d] bg-[#fff3df] p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#c75c00]">
            Today&apos;s digest
          </p>
          <h2 className="text-lg font-black text-[#172033]">
            How the day went
          </h2>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#c75c00]">
          <Sparkles size={18} aria-hidden />
        </span>
      </div>
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
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-[#7a4b12]">
          {digest.source === "ai" ? "AI digest" : "Local digest"} •{" "}
          {formatDateTime(digest.generatedAt)} • by {digest.generatedBy}
        </p>
        <Link
          href="/day"
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#e7c188] bg-white px-3 text-sm font-black text-[#7a4b12] transition hover:bg-[#fff7e8]"
        >
          Open Day Log
        </Link>
      </div>
    </section>
  );
}

function BucketIcon({ bucket }: { bucket: DashboardBucket }) {
  switch (bucket) {
    case "today":
      return <TimerReset size={18} aria-hidden />;
    case "laterToday":
      return <Clock3 size={18} aria-hidden />;
    case "month":
      return <CalendarClock size={18} aria-hidden />;
    case "canWait":
      return <ListFilter size={18} aria-hidden />;
    default:
      return <ListFilter size={18} aria-hidden />;
  }
}

function SourceIcon({
  type,
  size,
}: {
  type: DashboardItem["sourceType"];
  size: number;
}) {
  switch (type) {
    case "note":
      return <StickyNote size={size} aria-hidden />;
    case "chore":
      return <ClipboardCheck size={size} aria-hidden />;
    case "supply":
      return <PackageOpen size={size} aria-hidden />;
    case "tracker":
      return <HeartPulse size={size} aria-hidden />;
    case "calendar":
      return <CalendarClock size={size} aria-hidden />;
    case "development":
      return <Sparkles size={size} aria-hidden />;
    case "medication":
      return <Pill size={size} aria-hidden />;
    case "milestone":
      return <Sparkles size={size} aria-hidden />;
    case "admin":
      return <FileText size={size} aria-hidden />;
    default:
      return <StickyNote size={size} aria-hidden />;
  }
}
