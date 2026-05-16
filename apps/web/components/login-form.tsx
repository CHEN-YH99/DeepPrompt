"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import type { Dictionary } from "@/lib/i18n";

const SliderCaptcha = dynamic(
  () => import("@/components/slider-captcha").then((m) => m.SliderCaptcha),
  { ssr: false }
);

type LoginFormProps = {
  labels: Dictionary["login"];
  commonLabels: Dictionary["common"];
  message: string;
  presetAccount: string;
};

export function LoginForm({
  labels,
  commonLabels,
  message,
  presetAccount
}: LoginFormProps) {
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaHint, setCaptchaHint] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      // Turnstile widget 在表单中注入 input[name="cf-turnstile-response"]，
      // 这里再做一道前端拦截，未完成验证时直接阻止提交。
      if (!captchaToken) {
        e.preventDefault();
        setCaptchaHint((labels as Record<string, string>).captchaHint ?? "请先完成验证");
      }
    },
    [captchaToken, labels]
  );

  const handleVerified = useCallback((token: string) => {
    setCaptchaToken(token);
    setCaptchaHint("");
  }, []);

  const isMessageSuccess = message && !message.includes("错误") && !message.includes("不可达");

  return (
    <>
      {message ? (
        <div
          style={{
            marginTop: 14,
            border: isMessageSuccess ? "1px solid #22c55e" : "1px solid #ef4444",
            padding: "10px 12px",
            color: isMessageSuccess ? "#bbf7d0" : "#fecaca",
            background: isMessageSuccess ? "rgba(20, 83, 45, 0.25)" : "rgba(127, 29, 29, 0.28)"
          }}
        >
          {message}
        </div>
      ) : null}
      <form
        action="/api/auth/login"
        className="form-stack"
        method="post"
        onSubmit={handleSubmit}
        style={{ marginTop: 18 }}
      >
        <div className="field">
          <label className="field-label" htmlFor="account">
            {(labels as Record<string, string>).account}
          </label>
          <input
            defaultValue={presetAccount}
            id="account"
            name="account"
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="password">
            {(labels as Record<string, string>).password}
          </label>
          <input
            id="password"
            name="password"
            required
            type="password"
          />
        </div>
        <SliderCaptcha
          label={(labels as Record<string, string>).captchaLabel ?? "请完成人机验证"}
          onVerified={handleVerified}
          successLabel={(labels as Record<string, string>).captchaSuccess ?? "验证成功"}
        />
        {captchaHint ? (
          <div className="field-error">{captchaHint}</div>
        ) : null}
        <div className="action-row">
          <button className="action" type="submit">
            {commonLabels.actions.enterSystem}
          </button>
          <a className="ghost-action" href="/register">
            {commonLabels.actions.createAccount}
          </a>
        </div>
        <div className="panel-grid">
          <button className="ghost-action" type="button">
            {(labels as Record<string, string>).google}
          </button>
          <button className="ghost-action" type="button">
            {(labels as Record<string, string>).github}
          </button>
          <button className="ghost-action" type="button">
            {(labels as Record<string, string>).wechat}
          </button>
        </div>
      </form>
    </>
  );
}
