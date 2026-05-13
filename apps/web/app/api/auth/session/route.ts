import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ data: null });
  }

  try {
    const response = await fetch(`${apiBaseUrl}/v1/auth/me`, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    });
    if (!response.ok) {
      return NextResponse.json({ data: null });
    }
    const json = (await response.json()) as { data?: { nickname?: string; id?: string } };
    return NextResponse.json({ data: json.data ?? null });
  } catch {
    return NextResponse.json({ data: null });
  }
}
