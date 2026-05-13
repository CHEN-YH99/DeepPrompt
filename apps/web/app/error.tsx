"use client";

import { useEffect } from "react";

import { trackError } from "@/lib/telemetry";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    trackError("app.unhandled", error, {
      digest: error.digest,
      stack: error.stack?.slice(0, 4000)
    });
  }, [error]);

  return (
    <main className="shell">
      <section className="page-grid">
        <div className="section" data-unit="UNIT / FAULT">
          <div className="eyebrow">STATUS / 500</div>
          <h1 className="headline">系统出现异常</h1>
          <p className="lede">
            {error.message || "Unhandled exception"}
            {error.digest ? ` (digest: ${error.digest})` : ""}
          </p>
          <div className="action-row" style={{ marginTop: 18 }}>
            <button className="action" onClick={() => reset()} type="button">
              重试当前请求
            </button>
            <a className="ghost-action" href="/">
              回到首页
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
