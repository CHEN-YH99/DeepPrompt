import { NextRequest, NextResponse } from "next/server";

import { CLEAR_COOKIE_OPTIONS } from "@/lib/cookie-defaults";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (refreshToken) {
    try {
      await fetch(`${apiBaseUrl}/v1/auth/logout`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store"
      });
    } catch {
      // ignore — local cookies are cleared regardless
    }
  }

  const result = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  const clear = (name: string, httpOnly: boolean) =>
    result.cookies.set(name, "", { ...CLEAR_COOKIE_OPTIONS, httpOnly });
  clear("access_token", true);
  clear("refresh_token", true);
  return result;
}
