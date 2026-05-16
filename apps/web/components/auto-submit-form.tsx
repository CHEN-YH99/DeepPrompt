"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type FormEvent, type FormHTMLAttributes, type ReactNode } from "react";

type AutoSubmitFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "method" | "action"> & {
  children: ReactNode;
};

const CLEAR_DEBOUNCE_MS = 200;

function isTextInput(target: EventTarget | null): target is HTMLInputElement {
  if (!(target instanceof HTMLInputElement)) return false;
  const type = target.type;
  return type === "text" || type === "search" || type === "" || type === "url" || type === "email";
}

export function AutoSubmitForm({ children, ...props }: AutoSubmitFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current !== null) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  function cancelPendingClear() {
    if (clearTimerRef.current !== null) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
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
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (
      (target instanceof HTMLInputElement && target.type === "checkbox") ||
      target instanceof HTMLSelectElement
    ) {
      cancelPendingClear();
      navigate(event.currentTarget);
      return;
    }

    if (isTextInput(target)) {
      if (target.value === "") {
        const form = event.currentTarget;
        cancelPendingClear();
        clearTimerRef.current = setTimeout(() => {
          clearTimerRef.current = null;
          navigate(form);
        }, CLEAR_DEBOUNCE_MS);
      } else {
        cancelPendingClear();
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    cancelPendingClear();
    navigate(event.currentTarget);
  }

  return (
    <form onChange={handleChange} onSubmit={handleSubmit} {...props}>
      {children}
    </form>
  );
}
