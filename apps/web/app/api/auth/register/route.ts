import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const payload = {
    nickname: String(formData.get("nickname") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  };

  const response = await fetch(`${apiBaseUrl}/v1/auth/register`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL("/register?error=register_failed", request.url));
  }

  return NextResponse.redirect(new URL("/login?registered=1", request.url));
}
