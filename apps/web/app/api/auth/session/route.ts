import { NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE_OPTIONS } from "@/lib/cookie-defaults";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

async function fetchMe(token: string) {
  try {
    const response = await fetch(`${apiBaseUrl}/v1/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!response.ok) return null;
    const json = (await response.json()) as {
      data?: { nickname?: string; id?: string; role?: string };
    };
    const data = json.data ?? null;
    if (data && (data.role === "admin" || data.role === "moderator")) {
      data.nickname = "小灰超管";
    }
    return data;
  } catch {
    return null;
  }
}

async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string | null } | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/v1/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store"
    });
    if (!response.ok) return null;
    const json = (await response.json()) as {
      data?: { access_token?: string; refresh_token?: string };
    };
    const accessToken = json.data?.access_token;
    if (!accessToken) return null;
    return { accessToken, refreshToken: json.data?.refresh_token ?? null };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (accessToken) {
    const me = await fetchMe(accessToken);
    if (me) {
      return NextResponse.json({ data: me });
    }
  }

  if (refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) {
      const me = await fetchMe(refreshed.accessToken);
      const response = NextResponse.json({ data: me ?? null });
      response.cookies.set("access_token", refreshed.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
      if (refreshed.refreshToken) {
        response.cookies.set("refresh_token", refreshed.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
      }
      return response;
    }
  }

  return NextResponse.json({ data: null });
}
