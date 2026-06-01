"use client";

import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { ActionButton } from "../ActionButton";
import { AppShell } from "../AppShell";
import { ChildBadge } from "../ChildBadge";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { useAppData } from "@/hooks/useAppData";
import { formatShortDate, todayISO } from "@/lib/dateUtils";
import type { ChildName, Milestone } from "@/lib/types";

const blankForm = {
  child: "Kieran" as ChildName,
  title: "",
  description: "",
  date: todayISO(),
};

export function MilestonesPage() {
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
      const existing = current.milestones.find((item) => item.id === editingId);
      const nextMilestone: Milestone = {
        id: editingId ?? `milestone-${crypto.randomUUID()}`,
        child: form.child,
        title: form.title.trim(),
        description: form.description.trim(),
        date: new Date(form.date).toISOString(),
        createdBy: existing?.createdBy ?? "Tina",
      };

      return {
        ...current,
        milestones: editingId
          ? current.milestones.map((item) =>
              item.id === editingId ? nextMilestone : item,
            )
          : [nextMilestone, ...current.milestones],
      };
    });

    setForm(blankForm);
    setEditingId(null);
    setFormOpen(false);
  }

  async function remove(id: string) {
    await updateData((current) => ({
      ...current,
      milestones: current.milestones.filter((item) => item.id !== id),
    }));
  }

  function edit(item: Milestone) {
    setEditingId(item.id);
    setFormOpen(true);
    setForm({
      child: item.child,
      title: item.title,
      description: item.description,
      date: item.date.slice(0, 10),
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
      <PageHeader eyebrow="Moments" title="Milestones">
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
              {editingId ? "Edit milestone" : "Add milestone"}
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
              <span className="mb-1 block text-sm font-black">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
              />
            </label>
          </div>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-black">Title</span>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
            />
          </label>
          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-black">Description</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              rows={5}
              className="w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 py-3 font-semibold"
            />
          </label>
            <div className="flex flex-wrap gap-2">
              <ActionButton type="submit" disabled={saving}>
                Save Milestone
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
            <EmptyState text="Loading milestones..." />
          ) : data.milestones.length ? (
            data.milestones
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-[#e8d7bd] bg-white p-4 shadow-sm"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <ChildBadge child={item.child} />
                    <h3 className="text-lg font-black">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-6 text-[#536076]">{item.description}</p>
                  <p className="mt-1 text-xs font-bold text-[#667085]">
                    {formatShortDate(item.date)} by {item.createdBy}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ActionButton tone="quiet" onClick={() => edit(item)}>
                      Edit
                    </ActionButton>
                    <ActionButton tone="danger" onClick={() => remove(item.id)}>
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
