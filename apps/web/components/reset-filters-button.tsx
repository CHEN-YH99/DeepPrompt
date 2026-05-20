"use client";

import { usePathname, useRouter } from "next/navigation";

type ResetFiltersButtonProps = {
  label: string;
  className?: string;
};

// 之前是 <a href="/search">，整页刷新滚回顶部、scroll position 丢。
// 改成 router.replace 同步路径但保留滚动位置；search 页 hero 区不会被重置。
export function ResetFiltersButton({ label, className }: ResetFiltersButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <button
      className={className ?? "ghost-action"}
      onClick={() => router.replace(pathname, { scroll: false })}
      type="button"
    >
      {label}
    </button>
  );
}
