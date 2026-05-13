import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const inviteCode = String(formData.get("invite_code") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const payload: Record<string, string> = {
    email,
    password: String(formData.get("password") ?? "")
  };
  if (inviteCode.length > 0) {
    payload.invite_code = inviteCode;
  }

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
    return NextResponse.redirect(new URL("/register?error=api_unreachable", request.url), {
      status: 303
    });
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
      } else if (code === "INVITE_REQUIRED") {
        error = "invite_required";
      } else if (code === "INVITE_NOT_FOUND" || code === "INVITE_EXHAUSTED" || code === "INVITE_DISABLED") {
        error = "invite_invalid";
      } else if (code === "INVITE_EXPIRED") {
        error = "invite_expired";
      }
    } catch {
      error = "register_failed";
    }
    return NextResponse.redirect(new URL(`/register?error=${error}`, request.url), {
      status: 303
    });
  }

  const emailParam = email ? `&email=${encodeURIComponent(email)}` : "";
  return NextResponse.redirect(new URL(`/login?registered=1${emailParam}`, request.url), { status: 303 });
}
