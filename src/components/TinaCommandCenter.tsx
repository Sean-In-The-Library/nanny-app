"use client";

import { Check, Loader2, Mic, Square, Upload, WandSparkles } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { ActionButton } from "./ActionButton";
import { applyActionDrafts } from "@/lib/actionDrafts";
import type { ActionDraft, AppData, UserName } from "@/lib/types";

type ActionizeResponse = {
  drafts: ActionDraft[];
  caregiverMessage: string;
  questions: string[];
};

export function TinaCommandCenter({
  data,
  saving,
  onSave,
  createdBy = "Tina",
}: {
  data: AppData;
  saving: boolean;
  onSave: (nextData: AppData) => Promise<AppData>;
  createdBy?: UserName;
}) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [drafts, setDrafts] = useState<ActionDraft[]>([]);
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    setError(null);
    setMessage(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support in-app audio recording.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    });

    recorder.addEventListener("stop", () => {
      const recordingFile = new File(
        chunksRef.current,
        "tina-dictation.webm",
        { type: recorder.mimeType || "audio/webm" },
      );
      void transcribeFile(recordingFile);
      stream.getTracks().forEach((track) => track.stop());
    });

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function transcribeFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("audio", file);
      const response = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not transcribe the recording.");
      }
      setTranscript(payload.text ?? "");
      setMessage("Transcript ready for review.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not transcribe the recording.",
      );
    } finally {
      setBusy(false);
    }
  }

  function chooseRecordingFile() {
    fileInputRef.current?.click();
  }

  function handleRecordingFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    void transcribeFile(file);
  }

  async function makeActionItems() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/ai/actionize-dictation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, createdBy }),
      });
      const payload = (await response.json().catch(() => null)) as
        | ActionizeResponse
        | { error?: string }
        | null;
      if (!payload) {
        throw new Error("Could not make action items.");
      }
      if ("error" in payload) {
        throw new Error(payload.error ?? "Could not make action items.");
      }
      if (!response.ok) {
        throw new Error("Could not make action items.");
      }
      const result = isActionizeResponse(payload) ? payload : null;
      if (!result) {
        throw new Error("Could not make action items.");
      }
      setDrafts(result.drafts);
      setSelectedDraftIds(new Set(result.drafts.map((draft) => draft.id)));
      setQuestions(result.questions);
      setMessage(result.caregiverMessage || "Action items ready.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not make action items.",
      );
    } finally {
      setBusy(false);
    }
  }

  function isActionizeResponse(
    payload: ActionizeResponse | { error?: string } | null,
  ): payload is ActionizeResponse {
    return Boolean(
      payload &&
        "drafts" in payload &&
        Array.isArray(payload.drafts) &&
        Array.isArray(payload.questions),
    );
  }

  async function saveSelectedDrafts() {
    const selectedDrafts = drafts.filter((draft) => selectedDraftIds.has(draft.id));
    if (selectedDrafts.length === 0) {
      setError("Select at least one action item to save.");
      return;
    }

    await onSave(applyActionDrafts(data, selectedDrafts, createdBy));
    setDrafts([]);
    setSelectedDraftIds(new Set());
    setTranscript("");
    setQuestions([]);
    setMessage("Saved to the dashboard.");
  }

  function toggleDraft(id: string) {
    setSelectedDraftIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <section className="rounded-3xl border border-[#f5bf7d] bg-[#fff3df] p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#c75c00]">
            Tina command center
          </p>
          <h2 className="text-xl font-black text-[#172033]">
            Dictate once, save clean tasks
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {recording ? (
            <ActionButton tone="danger" onClick={stopRecording}>
              <Square size={16} aria-hidden />
              Stop
            </ActionButton>
          ) : (
            <ActionButton onClick={startRecording} disabled={busy}>
              <Mic size={16} aria-hidden />
              Record
            </ActionButton>
          )}
          <ActionButton
            tone="secondary"
            onClick={makeActionItems}
            disabled={busy || transcript.trim().length < 3}
          >
            {busy ? <Loader2 className="animate-spin" size={16} aria-hidden /> : <WandSparkles size={16} aria-hidden />}
            Make Items
          </ActionButton>
          <ActionButton tone="quiet" onClick={chooseRecordingFile} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" size={16} aria-hidden /> : <Upload size={16} aria-hidden />}
            Upload File
          </ActionButton>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/mp4,video/quicktime,video/x-m4v,.m4a,.mp4,.mov,.m4v,.aac,.wav,.mp3,.webm,.caf,.aiff"
        onChange={handleRecordingFile}
        className="sr-only"
      />

      <textarea
        value={transcript}
        onChange={(event) => setTranscript(event.target.value)}
        rows={4}
        placeholder="Record or type: Please have Faith restock diapers, watch Connor's rash, and wipe the Wonder Wagon before Friday."
        className="min-h-28 w-full rounded-2xl border border-[#e7c188] bg-white px-4 py-3 text-base font-medium text-[#172033] outline-none ring-[#2f83c5] transition placeholder:text-[#98a2b3] focus:ring-4"
      />

      {error ? (
        <p className="mt-3 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#b42318]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm font-bold text-[#314057]">
          {message}
        </p>
      ) : null}

      {drafts.length > 0 ? (
        <div className="mt-4 space-y-3">
          {drafts.map((draft) => (
            <label
              key={draft.id}
              className="flex gap-3 rounded-2xl border border-[#ead5b7] bg-white p-3 shadow-sm"
            >
              <input
                type="checkbox"
                checked={selectedDraftIds.has(draft.id)}
                onChange={() => toggleDraft(draft.id)}
                className="mt-1 h-5 w-5 accent-[#2f83c5]"
              />
              <span className="min-w-0 flex-1">
                <span className="mb-1 inline-flex rounded-full bg-[#e8f6fc] px-2 py-1 text-xs font-black uppercase text-[#184b72]">
                  {draft.kind}
                </span>
                <span className="block text-sm font-black text-[#172033]">
                  {draft.title}
                </span>
                <span className="block text-sm leading-6 text-[#536076]">
                  {draft.details}
                </span>
              </span>
            </label>
          ))}
          {questions.length > 0 ? (
            <div className="rounded-2xl bg-[#fffaf0] p-3 text-sm font-semibold text-[#7a4b12]">
              {questions.map((question) => (
                <p key={question}>{question}</p>
              ))}
            </div>
          ) : null}
          <ActionButton onClick={saveSelectedDrafts} disabled={saving}>
            <Check size={16} aria-hidden />
            Save Selected
          </ActionButton>
        </div>
      ) : null}
    </section>
  );
}
