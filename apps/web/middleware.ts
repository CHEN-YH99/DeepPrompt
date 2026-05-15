import { NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE_OPTIONS } from "@/lib/cookie-defaults";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/v1/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store"
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: { access_token?: string } };
    return json.data?.access_token ?? null;
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

  const newAccessToken = await refreshAccessToken(refreshToken);
  if (!newAccessToken) {
    return NextResponse.next();
  }

  // 把新 token 注入到本次请求的 cookie header，下游 SSR 通过 cookies() 即可拿到
  const requestHeaders = new Headers(request.headers);
  const existingCookie = requestHeaders.get("cookie") ?? "";
  const mergedCookie = existingCookie
    ? `${existingCookie}; access_token=${newAccessToken}`
    : `access_token=${newAccessToken}`;
  requestHeaders.set("cookie", mergedCookie);

  const response = NextResponse.next({
    request: { headers: requestHeaders }
  });
  response.cookies.set("access_token", newAccessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  return response;
}

export const config = {
  // 避开 /api/auth/*（自身就在处理 token）、静态资源与 Next 内部路径
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"
  ]
};
