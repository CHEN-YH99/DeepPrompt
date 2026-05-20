"use client";

import { useEffect, useRef } from "react";

const DRAFT_KEY = "publish_local_draft";
const DEBOUNCE_MS = 1500;

export function PublishFormGuard() {
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>("form[action='/api/prompts']");
    if (!form) return;

    // 恢复本地草稿
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved) as Record<string, string>;
        for (const [name, value] of Object.entries(draft)) {
          const el = form.elements.namedItem(name);
          if (el instanceof HTMLInputElement && el.type !== "file" && el.type !== "hidden") {
            if (!el.value) el.value = value;
          } else if (el instanceof HTMLTextAreaElement) {
            if (!el.value) el.value = value;
          }
        }
      }
    } catch {
      // 解析失败静默忽略
    }

    function saveDraft() {
      if (!form) return;
      const data: Record<string, string> = {};
      const fields = ["title", "prompt_text", "negative_prompt", "usage_note", "image_url"];
      for (const name of fields) {
        const el = form.elements.namedItem(name);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          if (el.value) data[name] = el.value;
        }
      }
      if (Object.keys(data).length > 0) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        dirtyRef.current = true;
      } else {
        localStorage.removeItem(DRAFT_KEY);
        dirtyRef.current = false;
      }
    }

    function handleInput() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(saveDraft, DEBOUNCE_MS);
    }

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (dirtyRef.current) {
        e.preventDefault();
      }
    }

    function handleSubmit() {
      dirtyRef.current = false;
      localStorage.removeItem(DRAFT_KEY);
    }

    form.addEventListener("input", handleInput);
    form.addEventListener("submit", handleSubmit);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      form.removeEventListener("input", handleInput);
      form.removeEventListener("submit", handleSubmit);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
