"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

const CHANNEL_NAME = "deepprompt:cache-sync";

export type CacheSyncScope = "moderation" | "interaction" | "copy";

export type CacheSyncMessage = {
  type: "invalidate";
  scope: CacheSyncScope;
  promptId?: string;
};

const DEBOUNCE_MS = 150;

export function CacheSyncProvider() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMessage = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      router.refresh();
      timerRef.current = null;
    }, DEBOUNCE_MS);
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [handleMessage]);

  return null;
}

export function broadcastCacheInvalidation(scope: CacheSyncScope, promptId?: string) {
  if (typeof window === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ type: "invalidate", scope, promptId } satisfies CacheSyncMessage);
  channel.close();
}
