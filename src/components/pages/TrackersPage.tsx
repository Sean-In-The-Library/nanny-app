"use client";

import { FormEvent, useState } from "react";
import { ActionButton } from "../ActionButton";
import { AppShell } from "../AppShell";
import { ChildBadge } from "../ChildBadge";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { PriorityPill } from "../PriorityPill";
import { useAppData } from "@/hooks/useAppData";
import { formatDateTime, nowISO } from "@/lib/dateUtils";
import type { ChildName, Tracker, TrackerType } from "@/lib/types";

const blankForm = {
  child: "Kieran" as ChildName,
  type: "other" as TrackerType,
  details: "",
};

export function TrackersPage() {
  const { data, loading, saving, error, updateData } = useAppData();
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.details.trim()) {
      return;
    }

    await updateData((current) => {
      const existing = current.trackers.find((tracker) => tracker.id === editingId);
      const nextTracker: Tracker = {
        id: editingId ?? `tracker-${crypto.randomUUID()}`,
        child: form.child,
        type: form.type,
        details: form.details.trim(),
        createdBy: existing?.createdBy ?? "Tina",
        createdAt: existing?.createdAt ?? nowISO(),
        resolved: existing?.resolved ?? false,
        resolvedAt: existing?.resolvedAt,
      };

      return {
        ...current,
        trackers: editingId
          ? current.trackers.map((tracker) =>
              tracker.id === editingId ? nextTracker : tracker,
            )
          : [nextTracker, ...current.trackers],
      };
    });

    setForm(blankForm);
    setEditingId(null);
  }

  async function resolve(id: string, resolved: boolean) {
    await updateData((current) => ({
      ...current,
      trackers: current.trackers.map((tracker) =>
        tracker.id === id
          ? { ...tracker, resolved, resolvedAt: resolved ? nowISO() : undefined }
          : tracker,
      ),
    }));
  }

  async function remove(id: string) {
    await updateData((current) => ({
      ...current,
      trackers: current.trackers.filter((tracker) => tracker.id !== id),
    }));
  }

  function edit(tracker: Tracker) {
    setEditingId(tracker.id);
    setForm({
      child: tracker.child,
      type: tracker.type,
      details: tracker.details,
    });
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Child status" title="Trackers" />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={submit}
          className="rounded-3xl border border-[#e8d7bd] bg-[#fffaf0] p-4 shadow-sm"
        >
          <h2 className="mb-3 text-lg font-black">
            {editingId ? "Edit tracker" : "Add tracker"}
          </h2>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-black">Child</span>
              <select
                value={form.child}
                onChange={(event) =>
                  setForm({ ...form, child: event.target.value as ChildName })
                }
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
              >
                <option value="Kieran">Kieran</option>
                <option value="Connor">Connor</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-sm font-black">Type</span>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value as TrackerType })
                }
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
              >
                <option value="no_poop">No poop</option>
                <option value="refused_meal">Refused meal</option>
                <option value="poor_sleep">Poor sleep</option>
                <option value="rash">Rash</option>
                <option value="behavior">Behavior</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-black">Details</span>
            <textarea
              value={form.details}
              onChange={(event) =>
                setForm({ ...form, details: event.target.value })
              }
              rows={5}
              className="w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 py-3 font-semibold"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <ActionButton type="submit" disabled={saving}>
              Save Tracker
            </ActionButton>
            {editingId ? (
              <ActionButton
                tone="quiet"
                onClick={() => {
                  setEditingId(null);
                  setForm(blankForm);
                }}
              >
                Cancel
              </ActionButton>
            ) : null}
          </div>
          {error ? (
            <p className="mt-3 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#b42318]">
              {error}
            </p>
          ) : null}
        </form>

        <section className="space-y-3">
          {loading || !data ? (
            <EmptyState text="Loading trackers..." />
          ) : data.trackers.length ? (
            data.trackers.map((tracker) => (
              <article
                key={tracker.id}
                className="rounded-3xl border border-[#e8d7bd] bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <ChildBadge child={tracker.child} />
                  <h3 className="text-lg font-black capitalize">
                    {tracker.type.replaceAll("_", " ")}
                  </h3>
                  {tracker.resolved ? <PriorityPill value="resolved" /> : null}
                </div>
                <p className="text-sm leading-6 text-[#536076]">{tracker.details}</p>
                <p className="mt-1 text-xs font-bold text-[#667085]">
                  {tracker.createdBy} - {formatDateTime(tracker.createdAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton
                    tone={tracker.resolved ? "secondary" : "quiet"}
                    onClick={() => resolve(tracker.id, !tracker.resolved)}
                  >
                    {tracker.resolved ? "Reopen" : "Resolved"}
                  </ActionButton>
                  <ActionButton tone="quiet" onClick={() => edit(tracker)}>
                    Edit
                  </ActionButton>
                  <ActionButton tone="danger" onClick={() => remove(tracker.id)}>
                    Delete
                  </ActionButton>
                </div>
              </article>
            ))
          ) : (
            <EmptyState />
          )}
        </section>
      </div>
    </AppShell>
  );
}

