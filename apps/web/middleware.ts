import { NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE_OPTIONS } from "@/lib/cookie-defaults";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

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

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (accessToken || !refreshToken) {
    return NextResponse.next();
  }

  const refreshed = await refreshAccessToken(refreshToken);
  if (!refreshed) {
    return NextResponse.next();
  }

  // 把新 token 注入到本次请求的 cookie header，下游 SSR 通过 cookies() 即可拿到
  const requestHeaders = new Headers(request.headers);
  const existingCookie = requestHeaders.get("cookie") ?? "";
  const accessCookieSegment = `access_token=${refreshed.accessToken}`;
  const refreshCookieSegment = refreshed.refreshToken ? `refresh_token=${refreshed.refreshToken}` : "";
  const merged = [existingCookie, accessCookieSegment, refreshCookieSegment]
    .filter((segment) => segment.length > 0)
    .join("; ");
  requestHeaders.set("cookie", merged);

  const response = NextResponse.next({
    request: { headers: requestHeaders }
  });
  response.cookies.set("access_token", refreshed.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  if (refreshed.refreshToken) {
    response.cookies.set("refresh_token", refreshed.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
  }
  return response;
}

export const config = {
  // 避开 /api/auth/*（自身就在处理 token）、静态资源与 Next 内部路径
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"
  ]
};
