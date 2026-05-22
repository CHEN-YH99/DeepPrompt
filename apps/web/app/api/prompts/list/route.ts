import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search;
  const response = await fetch(`${apiBaseUrl}/v1/prompts${search}`, {
    headers: {
      "content-type": "application/json"
    },
    cache: "no-store"
  });

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "content-type": "application/json" }
  });
}
