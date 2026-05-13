import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const payload = {
    account: String(formData.get("account") ?? ""),
    password: String(formData.get("password") ?? "")
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
    return NextResponse.redirect(new URL("/login?error=invalid_credentials", request.url), {
      status: 303
    });
  }

  const json = (await response.json()) as {
    data?: {
      access_token?: string;
      refresh_token?: string;
      user?: { nickname?: string };
    };
  };
  const accessToken = json.data?.access_token;
  const refreshToken = json.data?.refresh_token;
  const nickname = json.data?.user?.nickname ?? "";
  const sessionMaxAge = 7 * 24 * 60 * 60;
  const result = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  if (accessToken) {
    result.cookies.set("access_token", accessToken, {
      httpOnly: true,
      maxAge: 15 * 60,
      path: "/",
      sameSite: "lax",
      secure: false
    });
  }
  if (refreshToken) {
    result.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      maxAge: sessionMaxAge,
      path: "/",
      sameSite: "lax",
      secure: false
    });
  }
  if (nickname) {
    result.cookies.set("user_nickname", nickname, {
      httpOnly: false,
      maxAge: sessionMaxAge,
      path: "/",
      sameSite: "lax",
      secure: false
    });
  }

  return result;
}
