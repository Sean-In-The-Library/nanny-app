"use client";

import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { ActionButton } from "../ActionButton";
import { AppShell } from "../AppShell";
import { ChildBadge } from "../ChildBadge";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { PriorityPill } from "../PriorityPill";
import { useAppData } from "@/hooks/useAppData";
import { useOpenEntryFromQuery } from "@/hooks/useOpenEntryFromQuery";
import { formatDateTime, nowISO } from "@/lib/dateUtils";
import type { ChildName, DevelopmentGoal } from "@/lib/types";

const blankForm = {
  child: "Kieran" as ChildName,
  goal: "",
  details: "",
  active: true,
  showOnDashboard: true,
};

export function DevelopmentPage() {
  const { data, loading, saving, error, updateData } = useAppData();
  const [form, setForm] = useState(blankForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.goal.trim()) {
      return;
    }

    await updateData((current) => {
      const existing = current.developmentGoals.find((goal) => goal.id === editingId);
      const nextGoal: DevelopmentGoal = {
        id: editingId ?? `dev-${crypto.randomUUID()}`,
        child: form.child,
        goal: form.goal.trim(),
        details: form.details.trim(),
        active: form.active,
        createdAt: existing?.createdAt ?? nowISO(),
        updatedAt: nowISO(),
        showOnDashboard: form.showOnDashboard,
      };

      return {
        ...current,
        developmentGoals: editingId
          ? current.developmentGoals.map((goal) =>
              goal.id === editingId ? nextGoal : goal,
            )
          : [nextGoal, ...current.developmentGoals],
      };
    });

    setForm(blankForm);
    setEditingId(null);
    setFormOpen(false);
  }

  async function toggle(id: string, active: boolean) {
    await updateData((current) => ({
      ...current,
      developmentGoals: current.developmentGoals.map((goal) =>
        goal.id === id ? { ...goal, active, updatedAt: nowISO() } : goal,
      ),
    }));
  }

  async function remove(id: string) {
    await updateData((current) => ({
      ...current,
      developmentGoals: current.developmentGoals.filter((goal) => goal.id !== id),
    }));
  }

  function edit(goal: DevelopmentGoal) {
    setEditingId(goal.id);
    setFormOpen(true);
    setForm({
      child: goal.child,
      goal: goal.goal,
      details: goal.details,
      active: goal.active,
      showOnDashboard: goal.showOnDashboard,
    });
  }

  function startAdd() {
    setEditingId(null);
    setForm(blankForm);
    setFormOpen(true);
  }

  function closeForm() {
    setEditingId(null);
    setForm(blankForm);
    setFormOpen(false);
  }

  useOpenEntryFromQuery(startAdd);

  return (
    <AppShell>
      <PageHeader eyebrow="Practice" title="Development">
        <ActionButton tone="quiet" onClick={startAdd}>
          <Plus size={16} aria-hidden />
          Add Entry
        </ActionButton>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
        {formOpen ? (
          <form
            onSubmit={submit}
            className="rounded-2xl border border-[#e8d7bd] bg-[#fffaf0] p-4 shadow-sm lg:order-2 lg:sticky lg:top-20"
          >
            <h2 className="mb-3 text-lg font-black">
              {editingId ? "Edit goal" : "Add goal"}
            </h2>
          <label className="mb-3 block">
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
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-black">Goal</span>
            <input
              value={form.goal}
              onChange={(event) => setForm({ ...form, goal: event.target.value })}
              className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
            />
          </label>
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
          <div className="mb-4 grid gap-2">
            <label className="flex items-center gap-2 text-sm font-black">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm({ ...form, active: event.target.checked })
                }
                className="h-5 w-5 accent-[#2f83c5]"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm font-black">
              <input
                type="checkbox"
                checked={form.showOnDashboard}
                onChange={(event) =>
                  setForm({ ...form, showOnDashboard: event.target.checked })
                }
                className="h-5 w-5 accent-[#2f83c5]"
              />
              Show on dashboard
            </label>
          </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton type="submit" disabled={saving}>
                Save Goal
              </ActionButton>
              <ActionButton tone="quiet" onClick={closeForm}>
                Cancel
              </ActionButton>
            </div>
          {error ? (
            <p className="mt-3 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#b42318]">
              {error}
            </p>
          ) : null}
          </form>
        ) : null}

        <section className={formOpen ? "space-y-3 lg:order-1" : "space-y-3"}>
          {loading || !data ? (
            <EmptyState text="Loading goals..." />
          ) : data.developmentGoals.length ? (
            data.developmentGoals.map((goal) => (
              <article
                key={goal.id}
                className="rounded-2xl border border-[#e8d7bd] bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <ChildBadge child={goal.child} />
                  <h3 className="text-lg font-black">{goal.goal}</h3>
                  {goal.active ? null : <PriorityPill value="resolved" />}
                </div>
                <p className="text-sm leading-6 text-[#536076]">{goal.details}</p>
                <p className="mt-1 text-xs font-bold text-[#667085]">
                  Updated {formatDateTime(goal.updatedAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton
                    tone={goal.active ? "quiet" : "secondary"}
                    onClick={() => toggle(goal.id, !goal.active)}
                  >
                    {goal.active ? "Pause" : "Activate"}
                  </ActionButton>
                  <ActionButton tone="quiet" onClick={() => edit(goal)}>
                    Edit
                  </ActionButton>
                  <ActionButton tone="danger" onClick={() => remove(goal.id)}>
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
