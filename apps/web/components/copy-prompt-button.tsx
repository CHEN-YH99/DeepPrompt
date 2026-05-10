"use client";

import { useEffect, useState, useTransition } from "react";

type CopyPromptButtonProps = {
  promptId: string;
  promptText: string;
};

type CopyState = "idle" | "success" | "error";

export function CopyPromptButton({ promptId, promptText }: CopyPromptButtonProps) {
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
      return "COPYING...";
    }
    if (copyState === "success") {
      return "COPIED";
    }
    if (copyState === "error") {
      return "COPY FAILED";
    }
    return "COPY PROMPT";
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
