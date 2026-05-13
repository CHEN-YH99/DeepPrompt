"use client";

const SESSION_KEY = "dp.telemetry.sid";

function getApiBase(): string | null {
  if (typeof window === "undefined") return null;
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";
}

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing && existing.length > 0) return existing;
    const fresh = `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return "anon";
  }
}

function postTelemetry(body: Record<string, unknown>) {
  const base = getApiBase();
  if (!base) return;
  const payload = JSON.stringify(body);
  const url = `${base}/v1/telemetry`;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: payload
    }).catch(() => undefined);
  } catch {
    /* swallow - telemetry must never break UX */
  }
}

export function trackEvent(name: string, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  postTelemetry({
    kind: "event",
    name: name.slice(0, 96),
    route: window.location.pathname,
    session_id: getSessionId(),
    payload: payload ?? {}
  });
}

export function trackError(name: string, error: unknown, extra?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const normalized =
    error instanceof Error
      ? { message: error.message, stack: error.stack?.slice(0, 4000) }
      : { message: String(error) };
  postTelemetry({
    kind: "error",
    name: name.slice(0, 96),
    route: window.location.pathname,
    session_id: getSessionId(),
    payload: { ...normalized, ...(extra ?? {}) }
  });
}

export function trackPageView(route?: string) {
  if (typeof window === "undefined") return;
  trackEvent("page.view", { route: route ?? window.location.pathname });
}
