"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppData } from "@/lib/types";

export function useAppData() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/data", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Could not load family data.");
      }
      setData((await response.json()) as AppData);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load family data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const response = await fetch("/api/data", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Could not load family data.");
        }
        const nextData = (await response.json()) as AppData;
        if (active) {
          setData(nextData);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Could not load family data.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  const saveData = useCallback(async (nextData: AppData) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextData),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Could not save family data.");
      }
      const saved = (await response.json()) as AppData;
      setData(saved);
      return saved;
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Could not save family data.";
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateData = useCallback(
    async (updater: (current: AppData) => AppData) => {
      if (!data) {
        throw new Error("Family data has not loaded yet.");
      }
      return saveData(updater(data));
    },
    [data, saveData],
  );

  return useMemo(
    () => ({ data, loading, saving, error, refresh, saveData, updateData }),
    [data, loading, saving, error, refresh, saveData, updateData],
  );
}
