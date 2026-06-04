import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    console.error("[presign] no access token");
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "登录后才能上传" } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    console.log("[presign] request body", body);

    const response = await fetch(`${apiBaseUrl}/v1/uploads/presign`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(body),
      cache: "no-store"
    });

    const data = await response.json();
    console.log("[presign] backend response", response.status, data);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[presign] proxy error", error);
    return NextResponse.json(
      { error: { code: "PROXY_ERROR", message: "上传签名获取失败" } },
      { status: 500 }
    );
  }
}
