import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

type ModerationRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: ModerationRouteContext) {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  const action = body?.action;
  if (!action) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  try {
    const response = await fetch(`${apiBaseUrl}/v1/prompts/${id}/moderate`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ action }),
      cache: "no-store"
    });
    if (!response.ok) {
      return NextResponse.json({ ok: false, error: "api_failed" }, { status: response.status });
    }
    const json = (await response.json()) as { data?: { status?: string } };
    return NextResponse.json({ ok: true, status: json.data?.status ?? null });
  } catch {
    return NextResponse.json({ ok: false, error: "api_unreachable" }, { status: 502 });
  }
}
