import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

type Body = {
  promptId?: string;
  type?: "like" | "collect";
  action?: "add" | "remove";
};

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  const promptId = body?.promptId?.trim();
  const type = body?.type;
  const action = body?.action;
  if (!promptId || (type !== "like" && type !== "collect") || (action !== "add" && action !== "remove")) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const method = action === "add" ? "POST" : "DELETE";
  try {
    const response = await fetch(`${apiBaseUrl}/v1/prompts/${promptId}/${type}`, {
      method,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      cache: "no-store"
    });
    if (!response.ok) {
      return NextResponse.json({ ok: false, error: "api_failed" }, { status: response.status });
    }
    const json = (await response.json()) as {
      data?: { like_count?: number; collect_count?: number };
    };
    const total = type === "like" ? json.data?.like_count ?? 0 : json.data?.collect_count ?? 0;

    revalidateTag("prompts:detail", "max");

    return NextResponse.json({ ok: true, total });
  } catch {
    return NextResponse.json({ ok: false, error: "api_unreachable" }, { status: 502 });
  }
}
