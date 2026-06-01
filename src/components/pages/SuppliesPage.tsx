"use client";

import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { ActionButton } from "../ActionButton";
import { AppShell } from "../AppShell";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { PriorityPill } from "../PriorityPill";
import { useAppData } from "@/hooks/useAppData";
import { formatDateTime, nowISO } from "@/lib/dateUtils";
import type { Supply, SupplyStatus } from "@/lib/types";

const blankForm = {
  itemName: "",
  status: "running_low" as SupplyStatus,
  notes: "",
  showOnDashboard: true,
};

export function SuppliesPage() {
  const { data, loading, saving, error, updateData } = useAppData();
  const [form, setForm] = useState(blankForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.itemName.trim()) {
      return;
    }

    await updateData((current) => {
      const existing = current.supplies.find((supply) => supply.id === editingId);
      const nextSupply: Supply = {
        id: editingId ?? `supply-${crypto.randomUUID()}`,
        itemName: form.itemName.trim(),
        status: form.status,
        notes: form.notes.trim() || undefined,
        reportedBy: existing?.reportedBy ?? "Tina",
        createdAt: existing?.createdAt ?? nowISO(),
        resolvedAt: form.status === "resolved" ? existing?.resolvedAt ?? nowISO() : undefined,
        showOnDashboard: form.showOnDashboard,
      };

      return {
        ...current,
        supplies: editingId
          ? current.supplies.map((supply) =>
              supply.id === editingId ? nextSupply : supply,
            )
          : [nextSupply, ...current.supplies],
      };
    });

    setForm(blankForm);
    setEditingId(null);
    setFormOpen(false);
  }

  async function setStatus(id: string, status: SupplyStatus) {
    await updateData((current) => ({
      ...current,
      supplies: current.supplies.map((supply) =>
        supply.id === id
          ? {
              ...supply,
              status,
              resolvedAt: status === "resolved" ? nowISO() : undefined,
            }
          : supply,
      ),
    }));
  }

  async function remove(id: string) {
    await updateData((current) => ({
      ...current,
      supplies: current.supplies.filter((supply) => supply.id !== id),
    }));
  }

  function edit(supply: Supply) {
    setEditingId(supply.id);
    setFormOpen(true);
    setForm({
      itemName: supply.itemName,
      status: supply.status,
      notes: supply.notes ?? "",
      showOnDashboard: supply.showOnDashboard,
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
      <PageHeader eyebrow="Inventory" title="Supplies">
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
              {editingId ? "Edit supply" : "Add supply alert"}
            </h2>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-black">Item</span>
            <input
              value={form.itemName}
              onChange={(event) =>
                setForm({ ...form, itemName: event.target.value })
              }
              className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
            />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-black">Status</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as SupplyStatus })
              }
              className="h-12 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 font-semibold"
            >
              <option value="running_low">Running low</option>
              <option value="last_one_opened">Last one opened</option>
              <option value="out">Out</option>
              <option value="ordered">Ordered</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-black">Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              rows={4}
              className="w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 py-3 font-semibold"
            />
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
            Show active alert
          </label>
            <div className="flex flex-wrap gap-2">
              <ActionButton type="submit" disabled={saving}>
                Save Supply
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
            <EmptyState text="Loading supplies..." />
          ) : data.supplies.length ? (
            data.supplies.map((supply) => (
              <article
                key={supply.id}
                className="rounded-3xl border border-[#e8d7bd] bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black">{supply.itemName}</h3>
                  <PriorityPill value={supply.status} />
                </div>
                {supply.notes ? (
                  <p className="text-sm leading-6 text-[#536076]">{supply.notes}</p>
                ) : null}
                <p className="mt-1 text-xs font-bold text-[#667085]">
                  Reported by {supply.reportedBy} {formatDateTime(supply.createdAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton tone="quiet" onClick={() => setStatus(supply.id, "ordered")}>
                    Ordered
                  </ActionButton>
                  <ActionButton tone="secondary" onClick={() => setStatus(supply.id, "resolved")}>
                    Resolved
                  </ActionButton>
                  <ActionButton tone="quiet" onClick={() => edit(supply)}>
                    Edit
                  </ActionButton>
                  <ActionButton tone="danger" onClick={() => remove(supply.id)}>
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
