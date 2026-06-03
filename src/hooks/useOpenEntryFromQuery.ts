"use client";

import { useEffect, useRef } from "react";

export function useOpenEntryFromQuery(
  onOpen: () => void,
  queryKey = "new",
) {
  const consumedRef = useRef(false);

  useEffect(() => {
    if (consumedRef.current || typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    if (url.searchParams.get(queryKey) !== "1") {
      return;
    }

    consumedRef.current = true;
    onOpen();

    url.searchParams.delete(queryKey);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [onOpen, queryKey]);
}
