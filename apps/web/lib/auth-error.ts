import { ErrorCode } from "@deepprompt/types";

export async function handleAuthError(response: Response): Promise<boolean> {
  if (response.status !== 401) return false;

  try {
    const json = (await response.clone().json()) as { error?: { code?: string } };
    const code = json.error?.code;

    if (code === ErrorCode.AUTH_TOKEN_EXPIRED) {
      const refreshResponse = await fetch("/api/auth/session", { cache: "no-store" });
      if (refreshResponse.ok) {
        return true;
      }
    }

    window.location.href = "/login?error=login_required";
    return false;
  } catch {
    window.location.href = "/login?error=login_required";
    return false;
  }
}
