"use client";

import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { ActionButton } from "../ActionButton";
import { AppShell } from "../AppShell";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { PriorityPill } from "../PriorityPill";
import { useAppData } from "@/hooks/useAppData";
import {
  calculateNextDueDate,
  formatDateTime,
  formatShortDate,
  nowISO,
} from "@/lib/dateUtils";
import type { Chore, ChoreFrequency, UserName } from "@/lib/types";

const blankForm = {
  title: "",
  description: "",
  frequency: "weekly" as ChoreFrequency,
  nextDueAt: "",
  assignedTo: "Faith" as UserName,
  showWhenDue: true,
};

export function ChoresPage() {
  const { data, loading, saving, error, updateData } = useAppData();
  const [form, setForm] = useState(blankForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) {
      return;
    }

    await updateData((current) => {
      const existing = current.chores.find((chore) => chore.id === editingId);
      const nextChore: Chore = {
        id: editingId ?? `chore-${crypto.randomUUID()}`,
        title: form.title.trim(),
        description: form.description.trim(),
        frequency: form.frequency,
        lastCompletedAt: existing?.lastCompletedAt,
        nextDueAt: form.nextDueAt
          ? new Date(form.nextDueAt).toISOString()
          : existing?.nextDueAt,
        assignedTo: form.assignedTo,
        showWhenDue: form.showWhenDue,
      };

      return {
        ...current,
        chores: editingId
          ? current.chores.map((chore) =>
              chore.id === editingId ? nextChore : chore,
            )
          : [nextChore, ...current.chores],
      };
    });

    setForm(blankForm);
    setEditingId(null);
    setFormOpen(false);
  }

  async function complete(id: string) {
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

  async function remove(id: string) {
    await updateData((current) => ({
      ...current,
      chores: current.chores.filter((chore) => chore.id !== id),
    }));
  }

  function edit(chore: Chore) {
    setEditingId(chore.id);
    setFormOpen(true);
    setForm({
      title: chore.title,
      description: chore.description,
      frequency: chore.frequency,
      nextDueAt: chore.nextDueAt ? chore.nextDueAt.slice(0, 10) : "",
      assignedTo: chore.assignedTo ?? "Faith",
      showWhenDue: chore.showWhenDue,
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

  return (
    <AppShell>
      <PageHeader eyebrow="Recurring work" title="Chores">
        <ActionButton tone="quiet" onClick={startAdd}>
          <Plus size={16} aria-hidden />
          Add Entry
        </ActionButton>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        {formOpen ? (
          <form
            onSubmit={submit}
            className="order-1 rounded-3xl border border-[#e8d7bd] bg-[#fffaf0] p-4 shadow-sm"
          >
            <h2 className="mb-3 text-lg font-black">
              {editingId ? "Edit chore" : "Add chore"}
            </h2>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-black">Task</span>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
            />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-black">Details</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              rows={4}
              className="w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 py-3 font-semibold"
            />
          </label>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-black">Frequency</span>
              <select
                value={form.frequency}
                onChange={(event) =>
                  setForm({
                    ...form,
                    frequency: event.target.value as ChoreFrequency,
                  })
                }
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="as_needed">As needed</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-sm font-black">Next due</span>
              <input
                type="date"
                value={form.nextDueAt}
                onChange={(event) =>
                  setForm({ ...form, nextDueAt: event.target.value })
                }
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
              />
            </label>
          </div>
          <label className="mb-4 flex items-center gap-2 text-sm font-black">
            <input
              type="checkbox"
              checked={form.showWhenDue}
              onChange={(event) =>
                setForm({ ...form, showWhenDue: event.target.checked })
              }
              className="h-5 w-5 accent-[#2f83c5]"
            />
            Show when due
          </label>
            <div className="flex flex-wrap gap-2">
              <ActionButton type="submit" disabled={saving}>
                Save Chore
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

        <section className={formOpen ? "order-2 space-y-3" : "space-y-3"}>
          {loading || !data ? (
            <EmptyState text="Loading chores..." />
          ) : data.chores.length ? (
            data.chores.map((chore) => (
              <article
                key={chore.id}
                className="rounded-3xl border border-[#e8d7bd] bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black">{chore.title}</h3>
                  {chore.nextDueAt ? <PriorityPill value="due" /> : null}
                </div>
                <p className="text-sm leading-6 text-[#536076]">
                  {chore.description || "No details added."}
                </p>
                <div className="mt-2 grid gap-1 text-sm font-bold text-[#667085]">
                  <span>Frequency: {chore.frequency.replaceAll("_", " ")}</span>
                  <span>Next due: {formatShortDate(chore.nextDueAt)}</span>
                  <span>Last done: {formatDateTime(chore.lastCompletedAt)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton tone="secondary" onClick={() => complete(chore.id)}>
                    Complete
                  </ActionButton>
                  <ActionButton tone="quiet" onClick={() => edit(chore)}>
                    Edit
                  </ActionButton>
                  <ActionButton tone="danger" onClick={() => remove(chore.id)}>
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
