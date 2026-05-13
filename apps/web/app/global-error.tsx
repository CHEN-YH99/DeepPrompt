"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    if (!apiBase) return;
    void fetch(`${apiBase}/v1/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        kind: "error",
        name: "app.global_error",
        route: window.location.pathname,
        payload: {
          message: error.message,
          digest: error.digest,
          stack: error.stack?.slice(0, 4000)
        }
      })
    }).catch(() => undefined);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body>
        <main style={{ padding: 32, fontFamily: "monospace" }}>
          <h1>系统级异常</h1>
          <p>{error.message}</p>
          <button type="button" onClick={() => reset()}>
            重试
          </button>
        </main>
      </body>
    </html>
  );
}
