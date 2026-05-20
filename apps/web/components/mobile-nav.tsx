"use client";

import { useCallback, useSyncExternalStore } from "react";

type MobileNavProps = {
  children: React.ReactNode;
  ariaLabel: string;
};

const STORAGE_KEY = "nav-open";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function MobileNav({ children, ariaLabel }: MobileNavProps) {
  const open = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    try {
      const next = localStorage.getItem(STORAGE_KEY) === "1" ? "0" : "1";
      localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    } catch {
      // localStorage 不可用时静默降级
    }
  }, []);

  return (
    <nav className="nav-strip" aria-label={ariaLabel}>
      {/* 桌面端：直接展示 */}
      <div className="nav-desktop">
        {children}
      </div>
      {/* 移动端：内联展开，容器高度固定 */}
      <div className={`nav-inline-wrap${open ? " is-open" : ""}`}>
        <button
          type="button"
          className="nav-inline-toggle"
          onClick={toggle}
          aria-expanded={open}
          aria-label={open ? "收起导航" : "展开导航"}
        >
          <span className="nav-toggle-icon" />
        </button>
        <div className={`nav-inline-menu${open ? " is-visible" : ""}`} role="menu">
          {children}
        </div>
      </div>
    </nav>
  );
}
