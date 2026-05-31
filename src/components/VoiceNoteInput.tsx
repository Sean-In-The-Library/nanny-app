"use client";

import { Loader2, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "./ActionButton";

export function VoiceNoteInput({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Audio recording is not supported in this browser.");
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
      void transcribe(new Blob(chunksRef.current, { type: recorder.mimeType }));
      stream.getTracks().forEach((track) => track.stop());
    });
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function transcribe(blob: Blob) {
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set(
        "audio",
        new File([blob], "care-notes.webm", { type: blob.type || "audio/webm" }),
      );
      const response = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not transcribe recording.");
      }
      onTranscript(payload.text ?? "");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not transcribe recording.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {recording ? (
        <ActionButton tone="danger" onClick={stop}>
          <Square size={16} aria-hidden />
          Stop
        </ActionButton>
      ) : (
        <ActionButton tone="quiet" onClick={start} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" size={16} aria-hidden /> : <Mic size={16} aria-hidden />}
          Record Notes
        </ActionButton>
      )}
      {error ? <span className="text-sm font-bold text-[#b42318]">{error}</span> : null}
    </div>
  );
}

