"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent, type FormHTMLAttributes, type ReactNode } from "react";

type AutoSubmitFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "method" | "action"> & {
  children: ReactNode;
};

// 文本输入统一走 350ms 防抖（业内标配），不再区分"清空"和"有内容"特例。
// checkbox / select 仍然立即触发，符合用户对筛选器的直觉。
const TEXT_DEBOUNCE_MS = 350;

function isTextInput(target: EventTarget | null): target is HTMLInputElement {
  if (!(target instanceof HTMLInputElement)) return false;
  const type = target.type;
  return type === "text" || type === "search" || type === "" || type === "url" || type === "email";
}

export function AutoSubmitForm({ children, ...props }: AutoSubmitFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingDebounce, setPendingDebounce] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  function cancelPendingDebounce() {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setPendingDebounce(false);
  }

  function navigate(form: HTMLFormElement) {
    const formData = new FormData(form);
    const grouped = new Map<string, string[]>();

    for (const [key, value] of formData.entries()) {
      const str = String(value);
      if (!str) continue;
      const list = grouped.get(key) ?? [];
      if (!list.includes(str)) list.push(str);
      grouped.set(key, list);
    }

    const params = new URLSearchParams();
    for (const [key, values] of grouped) {
      for (const val of values) params.append(key, val);
    }

    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (
      (target instanceof HTMLInputElement && target.type === "checkbox") ||
      target instanceof HTMLSelectElement
    ) {
      cancelPendingDebounce();
      navigate(event.currentTarget);
      return;
    }

    if (isTextInput(target)) {
      const form = event.currentTarget;
      cancelPendingDebounce();
      setPendingDebounce(true);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        setPendingDebounce(false);
        navigate(form);
      }, TEXT_DEBOUNCE_MS);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    cancelPendingDebounce();
    navigate(event.currentTarget);
  }

  const showLoading = pendingDebounce || isPending;

  return (
    <form
      onChange={handleChange}
      onSubmit={handleSubmit}
      data-loading={showLoading}
      {...props}
    >
      {children}
    </form>
  );
}
