"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { broadcastCacheInvalidation } from "@/components/cache-sync-provider";
import { submitModerationAction } from "@/lib/data";
import type { Dictionary } from "@/lib/i18n";
import type { ModerationAction } from "@deepprompt/types";

type ModerationActionsProps = {
  promptId: string;
  labels: Dictionary["moderation"];
};

const ACTIONS: Array<{ action: ModerationAction; styleKey: "action" | "ghost-action"; labelKey: keyof Dictionary["moderation"] }> = [
  { action: "approve", styleKey: "action", labelKey: "approve" },
  { action: "reject", styleKey: "ghost-action", labelKey: "reject" },
  { action: "archive", styleKey: "ghost-action", labelKey: "archive" }
];

export function ModerationActions({ promptId, labels }: ModerationActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<ModerationAction | null>(null);
  const [, startTransition] = useTransition();

  async function commit(action: ModerationAction) {
    setPendingAction(action);
    const ok = await submitModerationAction(promptId, action);
    if (ok) {
      startTransition(() => router.refresh());
      broadcastCacheInvalidation("moderation", promptId);
    }
    setPendingAction(null);
  }

  return (
    <div className="action-row" style={{ flexWrap: "wrap" }}>
      {ACTIONS.map((entry) => {
        const isActive = pendingAction === entry.action;
        return (
          <button
            className={`${entry.styleKey}${isActive ? " btn-loading" : ""}`}
            disabled={pendingAction !== null}
            key={entry.action}
            onClick={() => commit(entry.action)}
            type="button"
          >
            {labels[entry.labelKey]}
          </button>
        );
      })}
    </div>
  );
}
