import { NextRequest, NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_OPTIONS,
  NICKNAME_COOKIE_OPTIONS
} from "@/lib/cookie-defaults";

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

async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await fetch(`${apiBaseUrl}/v1/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store"
    });
    if (!response.ok) return null;
    const json = (await response.json()) as {
      data?: { access_token?: string };
    };
    return json.data?.access_token ?? null;
  } catch {
    return null;
  }
}

function syncNicknameCookie(
  response: NextResponse,
  nickname: string | null | undefined,
  current: string | null
) {
  if (!nickname || nickname === current) return;
  response.cookies.set("user_nickname", nickname, NICKNAME_COOKIE_OPTIONS);
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const fallbackNickname = request.cookies.get("user_nickname")?.value ?? null;

  if (accessToken) {
    const me = await fetchMe(accessToken);
    if (me) {
      const response = NextResponse.json({ data: me });
      syncNicknameCookie(response, me.nickname, fallbackNickname);
      return response;
    }
  }

  if (refreshToken) {
    const newAccessToken = await refreshAccessToken(refreshToken);
    if (newAccessToken) {
      const me = await fetchMe(newAccessToken);
      const response = NextResponse.json({ data: me ?? null });
      response.cookies.set("access_token", newAccessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
      syncNicknameCookie(response, me?.nickname, fallbackNickname);
      return response;
    }
  }

  if (fallbackNickname) {
    return NextResponse.json({ data: { nickname: fallbackNickname }, stale: true });
  }

  return NextResponse.json({ data: null });
}
