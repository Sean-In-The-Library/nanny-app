"use client";

import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { ActionButton } from "../ActionButton";
import { AppShell } from "../AppShell";
import { ChildBadge } from "../ChildBadge";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { useAppData } from "@/hooks/useAppData";
import {
  formatDateTime,
  nextAllowedMedicationTime,
  toDatetimeLocalValue,
} from "@/lib/dateUtils";
import type { ChildName, MedicationEntry } from "@/lib/types";

const blankForm = {
  child: "Kieran" as ChildName,
  medicineName: "",
  dose: "",
  givenAt: toDatetimeLocalValue(new Date().toISOString()),
  minimumIntervalHours: "4",
  notes: "",
};

function createBlankForm() {
  return {
    ...blankForm,
    givenAt: toDatetimeLocalValue(new Date().toISOString()),
  };
}

export function MedicationPage() {
  const { data, loading, saving, error, updateData } = useAppData();
  const [form, setForm] = useState(createBlankForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.medicineName.trim() || !form.dose.trim() || !form.givenAt) {
      return;
    }

    await updateData((current) => {
      const existing = current.medicationEntries.find((entry) => entry.id === editingId);
      const nextEntry: MedicationEntry = {
        id: editingId ?? `med-${crypto.randomUUID()}`,
        child: form.child,
        medicineName: form.medicineName.trim(),
        dose: form.dose.trim(),
        givenAt: new Date(form.givenAt).toISOString(),
        givenBy: existing?.givenBy ?? "Tina",
        minimumIntervalHours: form.minimumIntervalHours
          ? Number(form.minimumIntervalHours)
          : undefined,
        notes: form.notes.trim() || undefined,
      };

      return {
        ...current,
        medicationEntries: editingId
          ? current.medicationEntries.map((entry) =>
              entry.id === editingId ? nextEntry : entry,
            )
          : [nextEntry, ...current.medicationEntries],
      };
    });

    setForm(createBlankForm());
    setEditingId(null);
    setFormOpen(false);
  }

  async function remove(id: string) {
    await updateData((current) => ({
      ...current,
      medicationEntries: current.medicationEntries.filter((entry) => entry.id !== id),
    }));
  }

  function edit(entry: MedicationEntry) {
    setEditingId(entry.id);
    setFormOpen(true);
    setForm({
      child: entry.child,
      medicineName: entry.medicineName,
      dose: entry.dose,
      givenAt: toDatetimeLocalValue(entry.givenAt),
      minimumIntervalHours: entry.minimumIntervalHours
        ? String(entry.minimumIntervalHours)
        : "",
      notes: entry.notes ?? "",
    });
  }

  function startAdd() {
    setEditingId(null);
    setForm(createBlankForm());
    setFormOpen(true);
  }

  function closeForm() {
    setEditingId(null);
    setForm(createBlankForm());
    setFormOpen(false);
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Health" title="Medication">
        <ActionButton tone="quiet" onClick={startAdd}>
          <Plus size={16} aria-hidden />
          Add Entry
        </ActionButton>
      </PageHeader>
      <div className="mb-4 rounded-2xl border border-[#f3a5a5] bg-[#fff0ee] p-4 text-sm font-bold leading-6 text-[#7a271a]">
        This app only tracks logged entries. Always follow medication labels,
        pediatrician guidance, and caregiver judgment.
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        {formOpen ? (
          <form
            onSubmit={submit}
            className="order-1 rounded-3xl border border-[#e8d7bd] bg-[#fffaf0] p-4 shadow-sm"
          >
            <h2 className="mb-3 text-lg font-black">
              {editingId ? "Edit entry" : "Log medicine"}
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
              <span className="mb-1 block text-sm font-black">Given at</span>
              <input
                type="datetime-local"
                value={form.givenAt}
                onChange={(event) =>
                  setForm({ ...form, givenAt: event.target.value })
                }
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
              />
            </label>
          </div>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-black">Medicine</span>
              <input
                value={form.medicineName}
                onChange={(event) =>
                  setForm({ ...form, medicineName: event.target.value })
                }
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-black">Dose</span>
              <input
                value={form.dose}
                onChange={(event) => setForm({ ...form, dose: event.target.value })}
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
              />
            </label>
          </div>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-black">Minimum interval hours</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.minimumIntervalHours}
              onChange={(event) =>
                setForm({ ...form, minimumIntervalHours: event.target.value })
              }
              className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
            />
          </label>
          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-black">Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              rows={3}
              className="w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 py-3 font-semibold"
            />
          </label>
            <div className="flex flex-wrap gap-2">
              <ActionButton type="submit" disabled={saving}>
                Save Entry
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
            <EmptyState text="Loading medication..." />
          ) : data.medicationEntries.length ? (
            data.medicationEntries
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.givenAt).getTime() - new Date(a.givenAt).getTime(),
              )
              .map((entry) => {
                const nextAllowed = nextAllowedMedicationTime(
                  entry.givenAt,
                  entry.minimumIntervalHours,
                );
                return (
                  <article
                    key={entry.id}
                    className="rounded-3xl border border-[#e8d7bd] bg-white p-4 shadow-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <ChildBadge child={entry.child} />
                      <h3 className="text-lg font-black">{entry.medicineName}</h3>
                    </div>
                    <p className="text-sm leading-6 text-[#536076]">
                      {entry.dose} given {formatDateTime(entry.givenAt)} by{" "}
                      {entry.givenBy}.
                    </p>
                    {nextAllowed ? (
                      <p className="mt-1 text-sm font-black text-[#b42318]">
                        Next allowed after {formatDateTime(nextAllowed)}.
                      </p>
                    ) : null}
                    {entry.notes ? (
                      <p className="mt-2 text-sm leading-6 text-[#536076]">
                        {entry.notes}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ActionButton tone="quiet" onClick={() => edit(entry)}>
                        Edit
                      </ActionButton>
                      <ActionButton tone="danger" onClick={() => remove(entry.id)}>
                        Delete
                      </ActionButton>
                    </div>
                  </article>
                );
              })
          ) : (
            <EmptyState />
          )}
        </section>
      </div>
    </AppShell>
  );
}
