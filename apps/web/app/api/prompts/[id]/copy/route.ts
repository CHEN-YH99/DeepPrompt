import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

type CopyRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: CopyRouteContext) {
  const { id } = await context.params;
  const isFetchRequest = request.headers.get("x-deepprompt-copy") === "fetch";

  try {
    const response = await fetch(`${apiBaseUrl}/v1/prompts/${id}/copy`, {
      method: "POST",
      cache: "no-store"
    });

    revalidateTag("prompts:list", "max");
    revalidateTag("prompts:search", "max");
    revalidateTag("prompts:detail", "max");
    revalidatePath(`/prompts/${id}`);

    if (isFetchRequest) {
      return NextResponse.json(
        {
          ok: response.ok
        },
        {
          status: response.ok ? 200 : 502
        }
      );
    }
  } catch {
    if (isFetchRequest) {
      return NextResponse.json(
        {
          ok: false
        },
        {
          status: 502
        }
      );
    }
    // 复制计数失败不阻断浏览，后续可加 toast 提示。
  }

  const fallbackUrl = new URL(`/prompts/${id}`, request.url);
  const referer = request.headers.get("referer");
  return NextResponse.redirect(referer ?? fallbackUrl, { status: 303 });
}
