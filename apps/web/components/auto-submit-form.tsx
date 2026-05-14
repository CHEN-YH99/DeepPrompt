"use client";

import { usePathname, useRouter } from "next/navigation";
import type { FormEvent, FormHTMLAttributes, ReactNode } from "react";

type AutoSubmitFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "method" | "action"> & {
  children: ReactNode;
};

export function AutoSubmitForm({ children, ...props }: AutoSubmitFormProps) {
  const router = useRouter();
  const pathname = usePathname();

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
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target as HTMLElement;
    if (
      (target instanceof HTMLInputElement && target.type === "checkbox") ||
      target instanceof HTMLSelectElement
    ) {
      navigate(event.currentTarget);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(event.currentTarget);
  }

  return (
    <form onChange={handleChange} onSubmit={handleSubmit} {...props}>
      {children}
    </form>
  );
}
