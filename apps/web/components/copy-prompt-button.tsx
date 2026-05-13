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

  return (
    <button
      className={copyState === "idle" ? "ghost-action" : "action"}
      onClick={handleCopy}
      type="button"
    >
      {getLabel()}
    </button>
  );
}
