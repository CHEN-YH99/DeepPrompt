import { cache } from "react";

import { dictionaries, type Dictionary, type Locale } from "./dictionaries";

export type { Locale, Dictionary } from "./dictionaries";

const FALLBACK_LOCALE: Locale = "zh-CN";

function isLocale(value: string): value is Locale {
  return value in dictionaries;
}

function readEnvLocale(): Locale | null {
  const value = process.env.NEXT_PUBLIC_DEFAULT_LOCALE;
  if (typeof value === "string" && isLocale(value)) {
    return value;
  }
  return null;
}

export const getLocale = cache((): Locale => {
  return readEnvLocale() ?? FALLBACK_LOCALE;
});

export const getDictionary = cache((locale?: Locale): Dictionary => {
  return dictionaries[locale ?? getLocale()] ?? dictionaries[FALLBACK_LOCALE];
});

export function applyVars(template: string, vars?: Record<string, string | number>) {
  if (!vars) {
    return template;
  }
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.split(`{${key}}`).join(String(value)),
    template
  );
}
