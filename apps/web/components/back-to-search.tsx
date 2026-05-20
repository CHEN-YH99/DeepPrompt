"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type BackToSearchProps = {
  label: string;
};

export function BackToSearch({ label }: BackToSearchProps) {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const ref = document.referrer;
      if (ref && new URL(ref).pathname.startsWith("/search")) {
        setShow(true);
      }
    } catch {
      // referrer 解析失败就不显示
    }
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      className="ghost-action back-to-search"
      onClick={() => router.back()}
    >
      ← {label}
    </button>
  );
}
