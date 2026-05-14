"use client";

import { useEffect } from "react";

const IDLE_AFTER_MS = 600;

export function ScrollStateProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    function markScrolling() {
      root.dataset.scrolling = "true";
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        delete root.dataset.scrolling;
        idleTimer = null;
      }, IDLE_AFTER_MS);
    }

    window.addEventListener("scroll", markScrolling, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", markScrolling, { capture: true });
      if (idleTimer) clearTimeout(idleTimer);
      delete root.dataset.scrolling;
    };
  }, []);

  return null;
}
