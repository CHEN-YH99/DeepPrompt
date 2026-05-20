"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import type { Dictionary } from "@/lib/i18n";

const SliderCaptcha = dynamic(
  () => import("@/components/slider-captcha").then((m) => m.SliderCaptcha),
  { ssr: false }
);

// 之前用 message.includes("错误") 判断红绿，i18n 一翻就翻车，现在直接由上游传 kind。
type LoginMessage = { kind: "success" | "error"; text: string } | null;

type LoginFormProps = {
  labels: Dictionary["login"];
  commonLabels: Dictionary["common"];
  message: LoginMessage;
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
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      if (!captchaToken) {
        e.preventDefault();
        setCaptchaHint((labels as Record<string, string>).captchaHint ?? "请先完成验证");
        return;
      }
      // 表单走原生提交跳转，提交瞬间锁住按钮防重复点击
      setSubmitting(true);
    },
    [captchaToken, labels]
  );

  const handleVerified = useCallback((token: string) => {
    setCaptchaToken(token);
    setCaptchaHint("");
  }, []);

  const isMessageSuccess = message?.kind === "success";

  return (
    <>
      {message ? (
        <div
          role={isMessageSuccess ? "status" : "alert"}
          aria-live={isMessageSuccess ? "polite" : "assertive"}
          style={{
            marginTop: 14,
            border: isMessageSuccess ? "1px solid #22c55e" : "1px solid #ef4444",
            padding: "10px 12px",
            color: isMessageSuccess ? "#bbf7d0" : "#fecaca",
            background: isMessageSuccess ? "rgba(20, 83, 45, 0.25)" : "rgba(127, 29, 29, 0.28)"
          }}
        >
          {message.text}
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
          <button
            className={`action${submitting ? " btn-loading" : ""}`}
            disabled={submitting}
            type="submit"
          >
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
