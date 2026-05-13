"use client";

import { useCallback, useState } from "react";

import type { Dictionary } from "@/lib/i18n";

type RegisterFormProps = {
  labels: Dictionary["register"];
  commonLabels: Dictionary["common"];
  errorMessage: string;
  presetInvite: string;
  inviteRequired: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function getPasswordStrength(pwd: string): "weak" | "medium" | "strong" {
  if (pwd.length < 8 || !/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) return "weak";
  if (pwd.length >= 12 && /[^A-Za-z\d]/.test(pwd) && /[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) return "strong";
  return "medium";
}

export function RegisterForm({
  labels,
  commonLabels,
  errorMessage,
  presetInvite,
  inviteRequired
}: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const strength = getPasswordStrength(password);

  const validateEmail = useCallback((value: string) => {
    if (!value) return "";
    return EMAIL_RE.test(value) ? "" : (labels as Record<string, string>).emailInvalid ?? "邮箱格式不正确";
  }, [labels]);

  const validatePassword = useCallback((value: string) => {
    if (!value) return "";
    return PASSWORD_RE.test(value) ? "" : (labels as Record<string, string>).passwordInvalid ?? "密码至少8位，需含字母和数字";
  }, [labels]);

  const handleEmailBlur = useCallback(() => {
    setTouched((t) => ({ ...t, email: true }));
    setEmailError(validateEmail(email));
  }, [email, validateEmail]);

  const handlePasswordBlur = useCallback(() => {
    setTouched((t) => ({ ...t, password: true }));
    setPasswordError(validatePassword(password));
  }, [password, validatePassword]);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (touched.email) setEmailError(validateEmail(value));
  }, [touched.email, validateEmail]);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    if (touched.password) setPasswordError(validatePassword(value));
  }, [touched.password, validatePassword]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    const emailErr = validateEmail(email);
    const pwdErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(pwdErr);
    setTouched({ email: true, password: true });
    if (emailErr || pwdErr) {
      e.preventDefault();
    }
  }, [email, password, validateEmail, validatePassword]);

  const strengthLabels: Record<string, string> = {
    weak: (labels as Record<string, string>).strengthWeak ?? "弱",
    medium: (labels as Record<string, string>).strengthMedium ?? "中",
    strong: (labels as Record<string, string>).strengthStrong ?? "强"
  };

  return (
    <>
      {errorMessage ? (
        <div
          style={{
            marginTop: 14,
            border: "1px solid #ef4444",
            padding: "10px 12px",
            color: "#fecaca",
            background: "rgba(127, 29, 29, 0.28)"
          }}
        >
          {errorMessage}
        </div>
      ) : null}
      <form
        action="/api/auth/register"
        className="form-stack"
        method="post"
        onSubmit={handleSubmit}
        style={{ marginTop: 18 }}
      >
        <div className="field">
          <label className="field-label" htmlFor="email">
            {(labels as Record<string, string>).email}
          </label>
          <input
            id="email"
            name="email"
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={handleEmailBlur}
            required
            type="email"
            value={email}
          />
          {touched.email && emailError ? (
            <div className="field-error">{emailError}</div>
          ) : null}
        </div>
        <div className="field">
          <label className="field-label" htmlFor="password">
            {(labels as Record<string, string>).password}
          </label>
          <input
            id="password"
            minLength={8}
            name="password"
            onChange={(e) => handlePasswordChange(e.target.value)}
            onBlur={handlePasswordBlur}
            required
            type="password"
            value={password}
          />
          {password.length > 0 && (
            <div className="strength-bar">
              <div className="strength-segment" data-active={strength === "weak" || strength === "medium" || strength === "strong"} />
              <div className="strength-segment" data-active={strength === "medium" || strength === "strong"} />
              <div className="strength-segment" data-active={strength === "strong"} />
              <span className="strength-label">{strengthLabels[strength]}</span>
            </div>
          )}
          {touched.password && passwordError ? (
            <div className="field-error">{passwordError}</div>
          ) : null}
        </div>
        <div className="field">
          <label className="field-label" htmlFor="invite_code">
            邀请码{inviteRequired ? "（必填）" : "（可选）"}
          </label>
          <input
            defaultValue={presetInvite}
            id="invite_code"
            name="invite_code"
            placeholder="DP-XXXXXXXX"
            required={inviteRequired}
          />
        </div>
        <div className="action-row">
          <button className="action" type="submit">
            {commonLabels.actions.createAccount}
          </button>
          <a className="ghost-action" href="/login">
            {commonLabels.actions.backToLogin}
          </a>
        </div>
      </form>
    </>
  );
}
