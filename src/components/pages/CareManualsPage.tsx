"use client";

import { Loader2, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionButton } from "../ActionButton";
import { AppShell } from "../AppShell";
import { ChildBadge } from "../ChildBadge";
import { EmptyState } from "../EmptyState";
import { PageHeader } from "../PageHeader";
import { VoiceNoteInput } from "../VoiceNoteInput";
import { useAppData } from "@/hooks/useAppData";
import { useOpenEntryFromQuery } from "@/hooks/useOpenEntryFromQuery";
import { nowISO } from "@/lib/dateUtils";
import type { ChildName } from "@/lib/types";

type SummaryResult = {
  summary: string;
  suggestedSchedule: string;
  questions: string[];
};

const sectionLabels = {
  morningRoutine: "Morning routine",
  meals: "Meals",
  napSchedule: "Nap schedule",
  pottyTraining: "Potty training",
  diapering: "Diapering",
  outsideRoutine: "Park/outside routine",
  comfortItems: "Comfort items",
  developmentNotes: "Development notes",
  thingsToAvoid: "Things to avoid",
  currentScheduleSummary: "Current schedule summary",
};

export function CareManualsPage() {
  const { data, loading, saving, error, updateData } = useAppData();
  const [child, setChild] = useState<ChildName>("Kieran");
  const [rawNotes, setRawNotes] = useState("");
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);

  useOpenEntryFromQuery(openDraft, "draft");

  const manual = useMemo(
    () => data?.careManuals.find((item) => item.child === child),
    [child, data],
  );

  function openDraft() {
    setDraftOpen(true);
  }

  async function generateManual() {
    setAiBusy(true);
    setAiError(null);
    setSummary(null);
    try {
      const response = await fetch("/api/ai/summarize-care-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childName: child, rawNotes }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not generate care manual.");
      }
      setSummary(payload as SummaryResult);
    } catch (requestError) {
      setAiError(
        requestError instanceof Error
          ? requestError.message
          : "Could not generate care manual.",
      );
    } finally {
      setAiBusy(false);
    }
  }

  async function approveSummary() {
    if (!summary) {
      return;
    }

    await updateData((current) => ({
      ...current,
      careManuals: current.careManuals.map((item) =>
        item.child === child
          ? {
              ...item,
              updatedAt: nowISO(),
              sections: {
                ...item.sections,
                currentScheduleSummary: summary.suggestedSchedule || summary.summary,
                developmentNotes: [
                  item.sections.developmentNotes,
                  summary.summary,
                  summary.questions.length
                    ? `Questions: ${summary.questions.join("; ")}`
                    : "",
                ]
                  .filter(Boolean)
                  .join("\n\n"),
              },
            }
          : item,
      ),
    }));

    setSummary(null);
    setRawNotes("");
    setDraftOpen(false);
  }

  async function updateSection(key: keyof typeof sectionLabels, value: string) {
    await updateData((current) => ({
      ...current,
      careManuals: current.careManuals.map((item) =>
        item.child === child
          ? {
              ...item,
              updatedAt: nowISO(),
              sections: {
                ...item.sections,
                [key]: value,
              },
            }
          : item,
      ),
    }));
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Care source of truth" title="Care Manuals">
        <ActionButton tone="quiet" onClick={openDraft}>
          <WandSparkles size={16} aria-hidden />
          Generate Draft
        </ActionButton>
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["Kieran", "Connor"] as ChildName[]).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setChild(name)}
            className={`min-h-11 rounded-xl px-4 text-sm font-black shadow-sm ${
              child === name ? "bg-[#2f83c5] text-white" : "bg-white text-[#314057]"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] xl:items-start">
        {draftOpen ? (
          <section className="rounded-2xl border border-[#f5bf7d] bg-[#fff3df] p-4 shadow-sm xl:order-2 xl:sticky xl:top-20">
            <div className="mb-3 flex items-center gap-2">
              <ChildBadge child={child} />
              <h2 className="text-lg font-black">Rough notes to manual</h2>
            </div>
            <VoiceNoteInput
              onTranscript={(text) =>
                setRawNotes((current) => [current, text].filter(Boolean).join("\n\n"))
              }
            />
            <textarea
              value={rawNotes}
              onChange={(event) => setRawNotes(event.target.value)}
              rows={8}
              placeholder="Paste or record several days of schedule notes here."
              className="mt-3 w-full rounded-2xl border border-[#dfd1bd] bg-white px-4 py-3 font-semibold"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionButton
                onClick={generateManual}
                disabled={aiBusy || rawNotes.trim().length < 10}
              >
                {aiBusy ? <Loader2 className="animate-spin" size={16} aria-hidden /> : <WandSparkles size={16} aria-hidden />}
                Generate Draft
              </ActionButton>
              <ActionButton
                tone="quiet"
                onClick={() => {
                  setDraftOpen(false);
                  setSummary(null);
                  setAiError(null);
                }}
              >
                Cancel
              </ActionButton>
            </div>
            {aiError ? (
              <p className="mt-3 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#b42318]">
                {aiError}
              </p>
            ) : null}
            {summary ? (
              <div className="mt-4 space-y-3 rounded-2xl bg-white p-4 shadow-sm">
                <div>
                  <h3 className="font-black">Generated manual draft</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#536076]">
                    {summary.summary}
                  </p>
                </div>
                <div>
                  <h3 className="font-black">Suggested schedule</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#536076]">
                    {summary.suggestedSchedule}
                  </p>
                </div>
                {summary.questions.length ? (
                  <div>
                    <h3 className="font-black">Questions</h3>
                    <ul className="mt-1 space-y-1 text-sm font-semibold text-[#7a4b12]">
                      {summary.questions.map((question) => (
                        <li key={question}>{question}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <ActionButton onClick={approveSummary} disabled={saving}>
                  Approve and Save
                </ActionButton>
              </div>
            ) : null}
            {error ? (
              <p className="mt-3 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#b42318]">
                {error}
              </p>
            ) : null}
          </section>
        ) : null}

        <section className={draftOpen ? "space-y-3 xl:order-1" : "space-y-3"}>
          {loading || !manual ? (
            <EmptyState text="Loading care manual..." />
          ) : (
            Object.entries(sectionLabels).map(([key, label]) => (
              <label
                key={key}
                className="block rounded-2xl border border-[#e8d7bd] bg-white p-4 shadow-sm"
              >
                <span className="mb-2 block text-base font-black">{label}</span>
                <textarea
                  value={manual.sections[key as keyof typeof sectionLabels]}
                  onChange={(event) =>
                    void updateSection(
                      key as keyof typeof sectionLabels,
                      event.target.value,
                    )
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-[#dfd1bd] bg-[#fffaf0] px-4 py-3 text-sm font-semibold leading-6"
                />
              </label>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}
