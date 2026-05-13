"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";

type UserNavProps = {
  loginLabel: string;
  logoutLabel: string;
  confirmLogoutLabel: string;
};

function readNicknameCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)user_nickname=([^;]*)/);
  return match ? decodeURIComponent(match[1] ?? "") : null;
}

export function UserNav({ loginLabel, logoutLabel, confirmLogoutLabel }: UserNavProps) {
  const [nickname, setNickname] = useState<string | null>(readNicknameCookie);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((json) => {
        setNickname(json.data?.nickname ?? null);
      })
      .catch(() => setNickname(null));
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
      <div className="user-nav" suppressHydrationWarning>
        <Link className="nav-link" href="/login">
          {loginLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="user-nav" suppressHydrationWarning>
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
