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

const NICKNAME_CACHE_KEY = "deepprompt:nickname";

function readCachedNickname(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(NICKNAME_CACHE_KEY);
  } catch {
    return null;
  }
}

function writeCachedNickname(nickname: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (nickname) {
      window.localStorage.setItem(NICKNAME_CACHE_KEY, nickname);
    } else {
      window.localStorage.removeItem(NICKNAME_CACHE_KEY);
    }
  } catch {
    // ignore
  }
}

export function UserNav({
  initialNickname,
  loginLabel,
  logoutLabel,
  confirmLogoutLabel
}: UserNavProps) {
  const [nickname, setNickname] = useState<string | null>(initialNickname);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const latestRequestId = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // hydrate 后用 microtask 修正为 localStorage 缓存值，避免 SSR cookie 残留随机名导致的闪烁
    queueMicrotask(() => {
      if (!mountedRef.current) return;
      const cached = readCachedNickname();
      if (cached && cached !== initialNickname) {
        setNickname((prev) => (prev === cached ? prev : cached));
      }
    });

    const requestId = ++latestRequestId.current;
    // 不在 unmount 时 abort：让响应里的 Set-Cookie 一定能落地，下次 SSR 才能拿到正确昵称
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { data?: { nickname?: string } | null }) => {
        if (!mountedRef.current || requestId !== latestRequestId.current) return;
        const fetchedNickname = json.data?.nickname ?? null;
        if (fetchedNickname) {
          writeCachedNickname(fetchedNickname);
          setNickname((prev) => (prev === fetchedNickname ? prev : fetchedNickname));
          return;
        }
        // 仅当本地没有任何会话痕迹时，才清空登录态，避免抖动/竞态误登出
        const hasNicknameCookie =
          typeof document !== "undefined" &&
          document.cookie.split(";").some((entry) => entry.trim().startsWith("user_nickname="));
        if (!hasNicknameCookie) {
          writeCachedNickname(null);
          setNickname(null);
        }
      })
      .catch(() => {
        // 网络错误时保留当前状态
      });

    return () => {
      mountedRef.current = false;
    };
  }, [initialNickname]);

  function handleLogout() {
    document.cookie = "user_nickname=; max-age=0; path=/";
    writeCachedNickname(null);
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
