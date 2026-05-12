"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { CopyPromptButton } from "@/components/copy-prompt-button";
import { toggleInteraction } from "@/lib/data";
import type { Dictionary } from "@/lib/i18n";

type InteractionBarProps = {
  promptId: string;
  promptText: string;
  initialLiked: boolean;
  initialCollected: boolean;
  initialLikeCount: number;
  initialCollectCount: number;
  isLoggedIn: boolean;
  labels: Dictionary["interactions"];
  copyLabels: Dictionary["common"]["actions"];
  loginHref: string;
};

type BusyKind = "like" | "collect" | null;

export function InteractionBar({
  promptId,
  promptText,
  initialLiked,
  initialCollected,
  initialLikeCount,
  initialCollectCount,
  isLoggedIn,
  labels,
  copyLabels,
  loginHref
}: InteractionBarProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [collected, setCollected] = useState(initialCollected);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [collectCount, setCollectCount] = useState(initialCollectCount);
  const [busy, setBusy] = useState<BusyKind>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(kind: "like" | "collect") {
    if (!isLoggedIn) {
      router.push(loginHref);
      return;
    }
    setBusy(kind);
    setError(null);
    const currentlyOn = kind === "like" ? liked : collected;
    const optimisticState = !currentlyOn;
    if (kind === "like") {
      setLiked(optimisticState);
      setLikeCount((value) => Math.max(0, value + (optimisticState ? 1 : -1)));
    } else {
      setCollected(optimisticState);
      setCollectCount((value) => Math.max(0, value + (optimisticState ? 1 : -1)));
    }

    const result = await toggleInteraction(promptId, kind, optimisticState);
    if (!result.ok) {
      if (kind === "like") {
        setLiked(currentlyOn);
        setLikeCount((value) => Math.max(0, value + (optimisticState ? -1 : 1)));
      } else {
        setCollected(currentlyOn);
        setCollectCount((value) => Math.max(0, value + (optimisticState ? -1 : 1)));
      }
      setError(labels.interactionStatus);
    } else {
      if (kind === "like") {
        setLikeCount(result.total);
      } else {
        setCollectCount(result.total);
      }
    }
    setBusy(null);
  }

  const likeLabel = busy === "like" ? labels.likePending : liked ? labels.likedAction : labels.likeAction;
  const collectLabel =
    busy === "collect" ? labels.collectPending : collected ? labels.collectedAction : labels.collectAction;

  return (
    <div className="action-row" data-component="interaction-bar">
      <button
        className={liked ? "action" : "ghost-action"}
        data-active={liked}
        disabled={busy === "like"}
        onClick={() => handleToggle("like")}
        type="button"
      >
        {likeLabel} · {likeCount}
      </button>
      <button
        className={collected ? "action" : "ghost-action"}
        data-active={collected}
        disabled={busy === "collect"}
        onClick={() => handleToggle("collect")}
        type="button"
      >
        {collectLabel} · {collectCount}
      </button>
      <CopyPromptButton labels={copyLabels} promptId={promptId} promptText={promptText} />
      {!isLoggedIn ? <span className="field-hint">{labels.loginToInteract}</span> : null}
      {error ? <span className="field-hint">{error}</span> : null}
    </div>
  );
}
