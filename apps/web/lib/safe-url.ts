const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function isSafeImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function safeImageUrl(url: string | null | undefined, fallback = ""): string {
  return isSafeImageUrl(url) ? (url as string).trim() : fallback;
}
