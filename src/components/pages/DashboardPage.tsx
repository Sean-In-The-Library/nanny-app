"use client";

import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  HeartHandshake,
  HeartPulse,
  ListFilter,
  PackageOpen,
  Pill,
  Sparkles,
  StickyNote,
  TimerReset,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ActionButton } from "../ActionButton";
import { AppShell } from "../AppShell";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { PriorityPill } from "../PriorityPill";
import { TinaCommandCenter } from "../TinaCommandCenter";
import { useAppData } from "@/hooks/useAppData";
import { useSession } from "@/hooks/useSession";
import { calculateNextDueDate, nowISO } from "@/lib/dateUtils";
import {
  type DashboardBucket,
  type DashboardData,
  type DashboardItem,
  getDashboardData,
} from "@/lib/dashboard";
import type { AppData } from "@/lib/types";

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
    }
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Home" title="Family priority map">
        <Link
          href="/notes"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#2f83c5] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#246ca3]"
        >
          Add Note
        </Link>
      </PageHeader>

      {loading || !data ? (
        <div className="rounded-2xl border border-[#e8d7bd] bg-white p-5 font-bold text-[#536076]">
          Loading family dashboard...
        </div>
      ) : (
        <DashboardContent
          dashboard={getDashboardData(data)}
          data={data}
          error={error}
          saving={saving}
          activeBucket={activeBucket}
          onBucketChange={setActiveBucket}
          onItemAction={handleItemAction}
          onSave={saveData}
          isParent={user?.role === "parent"}
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

      <PriorityOverview
        dashboard={dashboard}
        activeBucket={activeBucket}
        onBucketChange={onBucketChange}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.85fr)] xl:items-start">
        <main className="space-y-4">
          <FocusFeed
            dashboard={dashboard}
            activeBucket={activeBucket}
            onBucketChange={onBucketChange}
            onItemAction={onItemAction}
          />
        </main>

        <aside className="space-y-4 xl:sticky xl:top-24">
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
          {counts.overdue} overdue chores
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
    default:
      return <StickyNote size={size} aria-hidden />;
  }
}
