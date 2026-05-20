"use client";

import { useEffect, useState, useTransition } from "react";

import { broadcastCacheInvalidation } from "@/components/cache-sync-provider";

import type { Dictionary } from "@/lib/i18n";

type CopyPromptButtonProps = {
  promptId: string;
  promptText: string;
  labels: Dictionary["common"]["actions"];
};

type CopyState = "idle" | "success" | "error";

export function CopyPromptButton({ promptId, promptText, labels }: CopyPromptButtonProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (copyState === "idle") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCopyState("idle");
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copyState]);

  function getLabel() {
    if (isPending) {
      return labels.copying;
    }
    if (copyState === "success") {
      return labels.copied;
    }
    if (copyState === "error") {
      return labels.copyFailed;
    }
    return labels.copyPrompt;
  }

  function handleCopy() {
    startTransition(() => {
      void (async () => {
        try {
          await navigator.clipboard.writeText(promptText);
          setCopyState("success");

          await fetch(`/api/prompts/${promptId}/copy`, {
            method: "POST",
            headers: {
              "x-deepprompt-copy": "fetch"
            },
            cache: "no-store"
          }).then((res) => {
            if (res.ok) {
              broadcastCacheInvalidation("copy", promptId);
            }
          });
        } catch {
          setCopyState("error");
        }
      })();
    });
  }

  const toastMessage =
    copyState === "success" ? labels.copied : copyState === "error" ? labels.copyFailed : "";

  return (
    <>
      <button
        className={`${copyState === "idle" ? "ghost-action" : "action"}${isPending ? " btn-loading" : ""}`}
        disabled={isPending}
        onClick={handleCopy}
        type="button"
      >
        {getLabel()}
      </button>
      {/*
        aria-live polite 区域：
        - 屏幕阅读器在 copyState 变化时读出"已复制 / 复制失败"。
        - 视觉上做成右下角浮动 toast，2 秒自动消失，与按钮 setTimeout 同步。
        - 用户视线在 prompt 文本上时也能感知到反馈。
      */}
      <span
        aria-atomic="true"
        aria-live="polite"
        className={`copy-toast${copyState !== "idle" ? " is-visible" : ""}`}
        data-state={copyState}
        role="status"
      >
        {toastMessage}
      </span>
    </>
  );
}
