"use client";

import { FormEvent, useState } from "react";
import { ActionButton } from "../ActionButton";
import { AppShell } from "../AppShell";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { useAppData } from "@/hooks/useAppData";
import { useSession } from "@/hooks/useSession";
import { formatDateTime, formatShortDate, nowISO, toDateInputValue } from "@/lib/dateUtils";
import type { AdminCategory, AdminItem, UserName } from "@/lib/types";

const blankForm = {
  title: "",
  details: "",
  category: "tax" as AdminCategory,
  dueDate: "",
  owner: "Tina" as UserName,
  showOnDashboard: true,
};

const categoryLabels: Record<AdminCategory, string> = {
  contract: "Contract",
  payroll: "Payroll",
  tax: "Tax",
  form: "Form",
  other: "Other",
};

export function AdminPage() {
  const { data, loading, saving, error, updateData } = useAppData();
  const { user } = useSession();
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) {
      return;
    }

    await updateData((current) => {
      const existing = current.adminItems.find((item) => item.id === editingId);
      const nextItem: AdminItem = {
        id: editingId ?? `admin-${crypto.randomUUID()}`,
        title: form.title.trim(),
        details: form.details.trim(),
        category: form.category,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        owner: form.owner,
        status: existing?.status ?? "open",
        completedAt: existing?.completedAt,
        showOnDashboard: form.showOnDashboard,
        createdAt: existing?.createdAt ?? nowISO(),
      };

      return {
        ...current,
        adminItems: editingId
          ? current.adminItems.map((item) =>
              item.id === editingId ? nextItem : item,
            )
          : [nextItem, ...current.adminItems],
      };
    });

    setForm(blankForm);
    setEditingId(null);
  }

  async function setStatus(id: string, status: AdminItem["status"]) {
    await updateData((current) => ({
      ...current,
      adminItems: current.adminItems.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              completedAt: status === "done" ? nowISO() : undefined,
            }
          : item,
      ),
    }));
  }

  async function remove(id: string) {
    await updateData((current) => ({
      ...current,
      adminItems: current.adminItems.filter((item) => item.id !== id),
    }));
  }

  function edit(item: AdminItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      details: item.details,
      category: item.category,
      dueDate: toDateInputValue(item.dueDate),
      owner: item.owner,
      showOnDashboard: item.showOnDashboard,
    });
  }

  const items = data?.adminItems.slice().sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "open" ? -1 : 1;
    }

    return getTime(a.dueDate) - getTime(b.dueDate);
  });

  if (user?.role === "nanny") {
    return (
      <AppShell>
        <PageHeader eyebrow="Household admin" title="Nanny admin" />
        <EmptyState text="Admin reminders are managed by Sean and Tina." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Household admin" title="Nanny admin" />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={submit}
          className="rounded-3xl border border-[#e8d7bd] bg-[#fffaf0] p-4 shadow-sm"
        >
          <h2 className="mb-3 text-lg font-black">
            {editingId ? "Edit reminder" : "Add admin reminder"}
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
            <span className="mb-1 block text-sm font-black">Details</span>
            <textarea
              value={form.details}
              onChange={(event) =>
                setForm({ ...form, details: event.target.value })
              }
              rows={4}
              className="w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 py-3 font-semibold"
            />
          </label>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-black">Category</span>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category: event.target.value as AdminCategory,
                  })
                }
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
              >
                <option value="contract">Contract</option>
                <option value="payroll">Payroll</option>
                <option value="tax">Tax</option>
                <option value="form">Form</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-sm font-black">Due date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm({ ...form, dueDate: event.target.value })
                }
                className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
              />
            </label>
          </div>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-black">Owner</span>
            <select
              value={form.owner}
              onChange={(event) =>
                setForm({ ...form, owner: event.target.value as UserName })
              }
              className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
            >
              <option value="Tina">Tina</option>
              <option value="Sean">Sean</option>
              <option value="Faith">Faith</option>
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
              Save Reminder
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
          {loading || !items ? (
            <EmptyState text="Loading admin reminders..." />
          ) : items.length ? (
            items.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-[#e8d7bd] bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black">{item.title}</h3>
                  <span className="rounded-full bg-[#e8f6fc] px-2.5 py-1 text-xs font-black text-[#184b72]">
                    {categoryLabels[item.category]}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-black ${
                      item.status === "open"
                        ? "bg-[#fff3df] text-[#7a4b12]"
                        : "bg-[#d1fadf] text-[#05603a]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-sm leading-6 text-[#536076]">
                  {item.details || "No details added."}
                </p>
                <div className="mt-2 grid gap-1 text-sm font-bold text-[#667085]">
                  <span>Owner: {item.owner}</span>
                  <span>Due: {formatShortDate(item.dueDate)}</span>
                  <span>Created: {formatDateTime(item.createdAt)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.status === "open" ? (
                    <ActionButton
                      tone="secondary"
                      onClick={() => setStatus(item.id, "done")}
                    >
                      Done
                    </ActionButton>
                  ) : (
                    <ActionButton
                      tone="quiet"
                      onClick={() => setStatus(item.id, "open")}
                    >
                      Reopen
                    </ActionButton>
                  )}
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
            <EmptyState text="No admin reminders yet." />
          )}
        </section>
      </div>
    </AppShell>
  );
}

function getTime(value?: string) {
  return value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER;
}
