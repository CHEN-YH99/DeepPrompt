"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { trackEvent, trackError } from "@/lib/telemetry";

export function TelemetryProvider() {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent("page.view", { route: pathname ?? "/" });
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function onError(event: ErrorEvent) {
      trackError("window.error", event.error ?? event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    }
    function onRejection(event: PromiseRejectionEvent) {
      trackError("window.unhandled_rejection", event.reason);
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
