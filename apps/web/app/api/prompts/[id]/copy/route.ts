import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

type CopyRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: CopyRouteContext) {
  const { id } = await context.params;

  try {
    await fetch(`${apiBaseUrl}/v1/prompts/${id}/copy`, {
      method: "POST",
      cache: "no-store"
    });
  } catch {
    // 复制计数失败不阻断浏览，后续可加 toast 提示。
  }

  const fallbackUrl = new URL(`/prompts/${id}`, request.url);
  const referer = request.headers.get("referer");
  return NextResponse.redirect(referer ?? fallbackUrl);
}
