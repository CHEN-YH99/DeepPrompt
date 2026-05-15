"use client";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";

type SliderCaptchaProps = {
  // 兼容旧 props，仅用于在 widget 加载前显示占位文字。
  label?: string;
  successLabel?: string;
  onVerified?: (token: string) => void;
};

const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";

// Cloudflare 提供的 always-pass 测试 key，仅在未配置 NEXT_PUBLIC_TURNSTILE_SITE_KEY 时使用。
// 文档：https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const DEV_TEST_SITE_KEY = "1x00000000000000000000AA";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          appearance?: "always" | "execute" | "interaction-only";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export function SliderCaptcha({ label, onVerified }: SliderCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const containerId = useId();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || DEV_TEST_SITE_KEY;

  useEffect(() => {
    let cancelled = false;

    function tryRender() {
      if (cancelled) return;
      if (!containerRef.current) return;
      if (!window.turnstile) {
        // 等 Turnstile script 注入 window.turnstile 后再渲染
        window.setTimeout(tryRender, 200);
        return;
      }
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onVerified?.(token),
        "expired-callback": () => {
          if (widgetIdRef.current) {
            window.turnstile?.reset(widgetIdRef.current);
          }
        },
        theme: "dark"
      });
    }

    tryRender();

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onVerified]);

  return (
    <>
      <Script src={TURNSTILE_SCRIPT_URL} strategy="afterInteractive" async defer />
      <div className="captcha-shell">
        <div id={containerId} ref={containerRef} />
        {/* fallback 文案，widget 渲染完成后会被替换 */}
        <noscript>
          <span className="captcha-label">{label ?? "请启用 JavaScript 完成验证"}</span>
        </noscript>
      </div>
    </>
  );
}
