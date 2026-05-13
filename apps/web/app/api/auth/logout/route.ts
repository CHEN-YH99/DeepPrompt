import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const result = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  result.cookies.set("access_token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: false
  });
  result.cookies.set("user_nickname", "", {
    httpOnly: false,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: false
  });
  return result;
}
