import { NextRequest, NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_OPTIONS,
  NICKNAME_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_OPTIONS
} from "@/lib/cookie-defaults";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const payload = {
    account: String(formData.get("account") ?? ""),
    password: String(formData.get("password") ?? ""),
    captcha_token: String(formData.get("cf-turnstile-response") ?? "")
  };

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/v1/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
  } catch {
    return NextResponse.redirect(new URL("/login?error=api_unreachable", request.url), {
      status: 303
    });
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as {
      error?: { code?: string };
    };
    const errorCode = errorBody.error?.code === "CAPTCHA_REQUIRED" ? "captcha_required" : "invalid_credentials";
    return NextResponse.redirect(new URL(`/login?error=${errorCode}`, request.url), {
      status: 303
    });
  }

  const json = (await response.json()) as {
    data?: {
      access_token?: string;
      refresh_token?: string;
      user?: { nickname?: string; role?: string };
    };
  };
  const accessToken = json.data?.access_token;
  const refreshToken = json.data?.refresh_token;
  const isAdmin = json.data?.user?.role === "admin" || json.data?.user?.role === "moderator";
  const nickname = isAdmin ? "小灰超管" : (json.data?.user?.nickname ?? "");
  const result = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  if (accessToken) {
    result.cookies.set("access_token", accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  }
  if (refreshToken) {
    result.cookies.set("refresh_token", refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
  }
  if (nickname) {
    result.cookies.set("user_nickname", nickname, NICKNAME_COOKIE_OPTIONS);
  }

  return result;
}
