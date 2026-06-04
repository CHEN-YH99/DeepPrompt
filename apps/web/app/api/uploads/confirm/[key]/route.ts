import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "登录后才能上传" } },
      { status: 401 }
    );
  }

  const { key } = await params;

  try {
    const response = await fetch(`${apiBaseUrl}/v1/uploads/confirm/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      cache: "no-store"
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[confirm] proxy error", error);
    return NextResponse.json(
      { error: { code: "PROXY_ERROR", message: "上传确认失败" } },
      { status: 500 }
    );
  }
}
