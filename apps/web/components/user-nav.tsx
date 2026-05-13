"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  const [nickname, setNickname] = useState<string | null>(initialNickname);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const latestRequestId = useRef(0);

  useEffect(() => {
    const requestId = ++latestRequestId.current;
    const controller = new AbortController();

    fetch("/api/auth/session", { signal: controller.signal, cache: "no-store" })
      .then((res) => res.json())
      .then((json: { data?: { nickname?: string } | null }) => {
        if (requestId !== latestRequestId.current) return;
        const fetchedNickname = json.data?.nickname ?? null;
        if (fetchedNickname) {
          setNickname(fetchedNickname);
          return;
        }
        // 仅当本地没有任何会话痕迹时，才清空登录态，避免抖动/竞态误登出
        const hasNicknameCookie =
          typeof document !== "undefined" &&
          document.cookie.split(";").some((entry) => entry.trim().startsWith("user_nickname="));
        if (!hasNicknameCookie) {
          setNickname(null);
        }
      })
      .catch(() => {
        // 网络错误时保留当前状态
      });

    return () => {
      controller.abort();
    };
  }, []);

  function handleLogout() {
    document.cookie = "user_nickname=; max-age=0; path=/";
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
