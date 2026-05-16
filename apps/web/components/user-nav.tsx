"use client";

import Link from "next/link";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";

type UserNavProps = {
  initialNickname: string | null;
  loginLabel: string;
  logoutLabel: string;
  confirmLogoutLabel: string;
};

export function UserNav({
  initialNickname,
  loginLabel,
  logoutLabel,
  confirmLogoutLabel
}: UserNavProps) {
  // Shell SSR 已经读 cookie 解出真实昵称；layout 提升后每次路由都会重新 SSR Shell，
  // 客户端不再发 /api/auth/session。logout 走 window.location.href 触发完整刷新，
  // 因此 prop 变化只在 hard reload 时发生 —— derived state 完全够用。
  const [nickname, setNickname] = useState<string | null>(initialNickname);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  function handleLogout() {
    setNickname(null);
    setShowLogoutConfirm(false);
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      window.location.href = "/";
    });
  }

  if (!nickname) {
    return (
      <div className="user-nav">
        <Link className="nav-link" href="/login">
          {loginLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="user-nav">
      <button
        className="nav-link nav-user"
        onClick={() => setShowLogoutConfirm(true)}
        type="button"
      >
        {nickname}
      </button>
      {showLogoutConfirm && (
        <ConfirmDialog
          cancelLabel="取消"
          confirmLabel={logoutLabel}
          message={confirmLogoutLabel}
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}
