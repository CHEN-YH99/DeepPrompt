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
    return NextResponse.redirect(new URL("/login?error=api_unreachable", request.url));
  }

  if (!response.ok) {
    return NextResponse.redirect(new URL("/login?error=invalid_credentials", request.url));
  }

  const json = (await response.json()) as {
    data?: { access_token?: string };
  };
  const accessToken = json.data?.access_token;
  const result = NextResponse.redirect(new URL("/me/prompts", request.url));
  if (accessToken) {
    result.cookies.set("access_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    });
  }

  return result;
}
