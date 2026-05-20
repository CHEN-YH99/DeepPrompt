"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

type BackToSearchProps = {
  label: string;
};

function subscribe() {
  return () => {};
}

function getSnapshot(): boolean {
  try {
    const ref = document.referrer;
    return Boolean(ref && new URL(ref).pathname.startsWith("/search"));
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function BackToSearch({ label }: BackToSearchProps) {
  const router = useRouter();
  const show = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!show) return null;

  return (
    <button
      type="button"
      className="ghost-action back-to-search"
      onClick={() => router.back()}
    >
      ← {label}
    </button>
  );
}
