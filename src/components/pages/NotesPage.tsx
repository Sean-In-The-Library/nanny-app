"use client";

import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { ActionButton } from "../ActionButton";
import { AppShell } from "../AppShell";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { PriorityPill } from "../PriorityPill";
import { useAppData } from "@/hooks/useAppData";
import { useOpenEntryFromQuery } from "@/hooks/useOpenEntryFromQuery";
import { nowISO } from "@/lib/dateUtils";
import type { Note, Priority } from "@/lib/types";

const blankForm = {
  title: "",
  body: "",
  priority: "important" as Priority,
  expiresAt: "",
  showOnDashboard: true,
};

export function NotesPage() {
  const { data, loading, saving, error, updateData } = useAppData();
  const [form, setForm] = useState(blankForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      return;
    }

    await updateData((current) => {
      const nextNote: Note = {
        id: editingId ?? `note-${crypto.randomUUID()}`,
        title: form.title.trim(),
        body: form.body.trim(),
        priority: form.priority,
        createdBy: "Tina",
        createdAt:
          current.notes.find((note) => note.id === editingId)?.createdAt ?? nowISO(),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        showOnDashboard: form.showOnDashboard,
        resolved:
          current.notes.find((note) => note.id === editingId)?.resolved ?? false,
      };

      return {
        ...current,
        notes: editingId
          ? current.notes.map((note) => (note.id === editingId ? nextNote : note))
          : [nextNote, ...current.notes],
      };
    });

    setForm(blankForm);
    setEditingId(null);
    setFormOpen(false);
  }

  async function resolve(id: string, resolved: boolean) {
    await updateData((current) => ({
      ...current,
      notes: current.notes.map((note) =>
        note.id === id ? { ...note, resolved } : note,
      ),
    }));
  }

  async function remove(id: string) {
    await updateData((current) => ({
      ...current,
      notes: current.notes.filter((note) => note.id !== id),
    }));
  }

  function edit(note: Note) {
    setEditingId(note.id);
    setFormOpen(true);
    setForm({
      title: note.title,
      body: note.body,
      priority: note.priority,
      expiresAt: note.expiresAt ? note.expiresAt.slice(0, 10) : "",
      showOnDashboard: note.showOnDashboard,
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
      <PageHeader eyebrow="Quick requests" title="Immediate Notes">
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
              {editingId ? "Edit note" : "Add note"}
            </h2>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-black">Title</span>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold outline-none ring-[#2f83c5] focus:ring-4"
            />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-black">Message for Faith</span>
            <textarea
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              rows={5}
              className="w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 py-3 font-semibold outline-none ring-[#2f83c5] focus:ring-4"
            />
          </label>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-black">Priority</span>
              <select
                value={form.priority}
                onChange={(event) =>
                  setForm({ ...form, priority: event.target.value as Priority })
                }
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-sm font-black">Expires</span>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm({ ...form, expiresAt: event.target.value })
                }
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
              />
            </label>
          </div>
          <label className="mb-4 flex items-center gap-2 text-sm font-black">
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
            <div className="flex flex-wrap gap-2">
              <ActionButton type="submit" disabled={saving}>
                Save Note
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
            <EmptyState text="Loading notes..." />
          ) : data.notes.length ? (
            data.notes.map((note) => (
              <article
                key={note.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${
                  note.resolved ? "border-[#d9e0ea] opacity-70" : "border-[#e8d7bd]"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <PriorityPill value={note.priority} />
                  <span className="text-xs font-bold text-[#667085]">
                    {note.createdBy}
                  </span>
                  {note.resolved ? <PriorityPill value="resolved" /> : null}
                </div>
                <h3 className="text-lg font-black">{note.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[#536076]">{note.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton tone="quiet" onClick={() => edit(note)}>
                    Edit
                  </ActionButton>
                  <ActionButton
                    tone={note.resolved ? "secondary" : "quiet"}
                    onClick={() => resolve(note.id, !note.resolved)}
                  >
                    {note.resolved ? "Reopen" : "Resolve"}
                  </ActionButton>
                  <ActionButton tone="danger" onClick={() => remove(note.id)}>
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
