"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ActionButton } from "../ActionButton";
import { AppShell } from "../AppShell";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { useAppData } from "@/hooks/useAppData";
import { useOpenEntryFromQuery } from "@/hooks/useOpenEntryFromQuery";
import { formatDateTime, toDatetimeLocalValue } from "@/lib/dateUtils";
import type { CalendarCategory, CalendarEvent } from "@/lib/types";

const blankForm = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  category: "household" as CalendarCategory,
  showOnDashboard: true,
};

export function CalendarPage() {
  const { data, loading, saving, error, updateData } = useAppData();
  const [form, setForm] = useState(blankForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.startDate) {
      return;
    }

    await updateData((current) => {
      const existing = current.calendarEvents.find((item) => item.id === editingId);
      const nextEvent: CalendarEvent = {
        id: editingId ?? `calendar-${crypto.randomUUID()}`,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        category: form.category,
        createdBy: existing?.createdBy ?? "Tina",
        showOnDashboard: form.showOnDashboard,
      };

      return {
        ...current,
        calendarEvents: editingId
          ? current.calendarEvents.map((item) =>
              item.id === editingId ? nextEvent : item,
            )
          : [nextEvent, ...current.calendarEvents],
      };
    });

    setForm(blankForm);
    setEditingId(null);
    setFormOpen(false);
  }

  async function remove(id: string) {
    await updateData((current) => ({
      ...current,
      calendarEvents: current.calendarEvents.filter((item) => item.id !== id),
    }));
  }

  function edit(item: CalendarEvent) {
    setEditingId(item.id);
    setFormOpen(true);
    setForm({
      title: item.title,
      description: item.description ?? "",
      startDate: toDatetimeLocalValue(item.startDate),
      endDate: toDatetimeLocalValue(item.endDate),
      category: item.category,
      showOnDashboard: item.showOnDashboard,
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
      <PageHeader eyebrow="More" title="Calendar">
        <div className="flex flex-wrap gap-2">
          <ActionButton tone="quiet" onClick={startAdd}>
            <Plus size={16} aria-hidden />
            Add Entry
          </ActionButton>
          <Link className="rounded-xl bg-white px-3 py-2 text-sm font-black text-[#314057]" href="/medication">
            Medication
          </Link>
          <Link className="rounded-xl bg-white px-3 py-2 text-sm font-black text-[#314057]" href="/milestones">
            Milestones
          </Link>
        </div>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
        {formOpen ? (
          <form
            onSubmit={submit}
            className="rounded-2xl border border-[#e8d7bd] bg-[#fffaf0] p-4 shadow-sm lg:order-2 lg:sticky lg:top-20"
          >
            <h2 className="mb-3 text-lg font-black">
              {editingId ? "Edit event" : "Add event"}
            </h2>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-black">Title</span>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
            />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-black">Description</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              rows={3}
              className="w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 py-3 font-semibold"
            />
          </label>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-black">Starts</span>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(event) =>
                  setForm({ ...form, startDate: event.target.value })
                }
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-black">Ends</span>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(event) =>
                  setForm({ ...form, endDate: event.target.value })
                }
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
              />
            </label>
          </div>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-black">Category</span>
            <select
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value as CalendarCategory })
              }
              className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
            >
              <option value="travel">Travel</option>
              <option value="appointment">Appointment</option>
              <option value="faith_time_off">Faith time off</option>
              <option value="household">Household</option>
              <option value="birthday">Birthday</option>
              <option value="other">Other</option>
            </select>
          </label>
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
                Save Event
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
            <EmptyState text="Loading calendar..." />
          ) : data.calendarEvents.length ? (
            data.calendarEvents
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
              )
              .map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[#e8d7bd] bg-white p-4 shadow-sm"
                >
                  <h3 className="text-lg font-black">{item.title}</h3>
                  <p className="mt-1 text-sm font-bold text-[#667085]">
                    {formatDateTime(item.startDate)} - {item.category.replaceAll("_", " ")}
                  </p>
                  {item.description ? (
                    <p className="mt-2 text-sm leading-6 text-[#536076]">
                      {item.description}
                    </p>
                  ) : null}
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
