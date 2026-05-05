import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const payload = {
    nickname: String(formData.get("nickname") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  };

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/v1/auth/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
  } catch {
    return NextResponse.redirect(new URL("/register?error=api_unreachable", request.url));
  }

  if (!response.ok) {
    let error = "register_failed";
    try {
      const json = (await response.json()) as {
        error?: { code?: string; message?: string };
      };
      const code = json.error?.code;
      if (code === "CONFLICT") {
        error = "email_or_phone_exists";
      } else if (code === "BAD_REQUEST") {
        error = "invalid_register_payload";
      }
    } catch {
      error = "register_failed";
    }
    return NextResponse.redirect(new URL(`/register?error=${error}`, request.url));
  }

  return NextResponse.redirect(new URL("/login?registered=1", request.url));
}
