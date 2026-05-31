"use client";

import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  PackageOpen,
  Pill,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { ActionButton } from "../ActionButton";
import { AppShell } from "../AppShell";
import { ChildBadge } from "../ChildBadge";
import { DashboardCard } from "../DashboardCard";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { PriorityPill } from "../PriorityPill";
import { TinaCommandCenter } from "../TinaCommandCenter";
import { useAppData } from "@/hooks/useAppData";
import {
  calculateNextDueDate,
  formatDateTime,
  formatShortDate,
  nowISO,
} from "@/lib/dateUtils";
import { getDashboardData } from "@/lib/dashboard";

export function DashboardPage() {
  const { data, loading, saving, error, saveData, updateData } = useAppData();

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

  return (
    <AppShell>
      <PageHeader eyebrow="Today" title="On the radar">
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
        <div className="space-y-5">
          {error ? (
            <p className="rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#b42318]">
              {error}
            </p>
          ) : null}

          <TinaCommandCenter data={data} saving={saving} onSave={saveData} />

          <DashboardSections
            dashboard={getDashboardData(data)}
            onResolveNote={resolveNote}
            onCompleteChore={completeChore}
            onResolveSupply={resolveSupply}
            onResolveTracker={resolveTracker}
          />
        </div>
      )}
    </AppShell>
  );
}

type DashboardSectionsProps = {
  dashboard: ReturnType<typeof getDashboardData>;
  onResolveNote: (id: string) => Promise<void>;
  onCompleteChore: (id: string) => Promise<void>;
  onResolveSupply: (id: string) => Promise<void>;
  onResolveTracker: (id: string) => Promise<void>;
};

function DashboardSections({
  dashboard,
  onResolveNote,
  onCompleteChore,
  onResolveSupply,
  onResolveTracker,
}: DashboardSectionsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DashboardCard
        title="Medication Window"
        count={dashboard.medicationWindows.length}
        tone="red"
      >
        {dashboard.medicationWindows.length ? (
          <div className="space-y-3">
            {dashboard.medicationWindows.map(({ entry, nextAllowedAt }) => (
              <div key={entry.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="mb-1 flex items-center gap-2">
                  <Pill size={16} aria-hidden />
                  <ChildBadge child={entry.child} />
                  <strong>{entry.medicineName}</strong>
                </div>
                <p className="text-sm text-[#536076]">
                  {entry.dose} given {formatDateTime(entry.givenAt)} by{" "}
                  {entry.givenBy}.
                </p>
                {nextAllowedAt ? (
                  <p className="mt-1 text-sm font-black text-[#b42318]">
                    Next allowed after {formatDateTime(nextAllowedAt)}.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </DashboardCard>

      <DashboardCard title="Immediate Notes" count={dashboard.urgentNotes.length} tone="orange">
        {dashboard.urgentNotes.length ? (
          <div className="space-y-3">
            {dashboard.urgentNotes.map((note) => (
              <div key={note.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <PriorityPill value={note.priority} />
                  <span className="text-xs font-bold text-[#667085]">
                    From {note.createdBy}
                  </span>
                </div>
                <h3 className="font-black text-[#172033]">{note.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[#536076]">{note.body}</p>
                <ActionButton
                  tone="quiet"
                  className="mt-3"
                  onClick={() => onResolveNote(note.id)}
                >
                  <CheckCircle2 size={16} aria-hidden />
                  Resolve
                </ActionButton>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </DashboardCard>

      <DashboardCard title="Child Status Alerts" count={dashboard.unresolvedTrackers.length} tone="blue">
        {dashboard.unresolvedTrackers.length ? (
          <div className="space-y-3">
            {dashboard.unresolvedTrackers.map((tracker) => (
              <div key={tracker.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <HeartPulse size={16} aria-hidden />
                  <ChildBadge child={tracker.child} />
                  <strong className="capitalize">
                    {tracker.type.replaceAll("_", " ")}
                  </strong>
                </div>
                <p className="text-sm leading-6 text-[#536076]">{tracker.details}</p>
                <ActionButton
                  tone="quiet"
                  className="mt-3"
                  onClick={() => onResolveTracker(tracker.id)}
                >
                  <CheckCircle2 size={16} aria-hidden />
                  Resolved
                </ActionButton>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </DashboardCard>

      <DashboardCard title="Upcoming Calendar" count={dashboard.upcomingEvents.length} tone="green">
        {dashboard.upcomingEvents.length ? (
          <div className="space-y-3">
            {dashboard.upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href="/calendar"
                className="block rounded-2xl bg-white p-3 shadow-sm transition hover:bg-[#f8fbff]"
              >
                <div className="mb-1 flex items-center gap-2">
                  <CalendarClock size={16} aria-hidden />
                  <strong>{event.title}</strong>
                </div>
                <p className="text-sm text-[#536076]">
                  {formatDateTime(event.startDate)} - {event.category.replaceAll("_", " ")}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </DashboardCard>

      <DashboardCard title="Due Chores" count={dashboard.dueChores.length} tone="cream">
        {dashboard.dueChores.length ? (
          <div className="space-y-3">
            {dashboard.dueChores.map((chore) => (
              <div key={chore.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <ClipboardCheck size={16} aria-hidden />
                  <strong>{chore.title}</strong>
                  <PriorityPill value="due" />
                </div>
                <p className="text-sm text-[#536076]">{chore.description}</p>
                <p className="mt-1 text-xs font-bold text-[#667085]">
                  Due {formatShortDate(chore.nextDueAt)}
                </p>
                <ActionButton
                  tone="secondary"
                  className="mt-3"
                  onClick={() => onCompleteChore(chore.id)}
                >
                  <CheckCircle2 size={16} aria-hidden />
                  Complete
                </ActionButton>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </DashboardCard>

      <DashboardCard title="Low Supplies" count={dashboard.lowSupplies.length} tone="orange">
        {dashboard.lowSupplies.length ? (
          <div className="space-y-3">
            {dashboard.lowSupplies.map((supply) => (
              <div key={supply.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <PackageOpen size={16} aria-hidden />
                  <strong>{supply.itemName}</strong>
                  <PriorityPill value={supply.status} />
                </div>
                {supply.notes ? (
                  <p className="text-sm text-[#536076]">{supply.notes}</p>
                ) : null}
                <ActionButton
                  tone="quiet"
                  className="mt-3"
                  onClick={() => onResolveSupply(supply.id)}
                >
                  <CheckCircle2 size={16} aria-hidden />
                  Resolved
                </ActionButton>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </DashboardCard>

      <DashboardCard
        title="Development Focus"
        count={dashboard.activeDevelopmentGoals.length}
        tone="blue"
      >
        {dashboard.activeDevelopmentGoals.length ? (
          <div className="space-y-3">
            {dashboard.activeDevelopmentGoals.map((goal) => (
              <Link
                key={goal.id}
                href="/development"
                className="block rounded-2xl bg-white p-3 shadow-sm transition hover:bg-[#f8fbff]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles size={16} aria-hidden />
                  <ChildBadge child={goal.child} />
                  <strong>{goal.goal}</strong>
                </div>
                <p className="text-sm text-[#536076]">{goal.details}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </DashboardCard>
    </div>
  );
}
