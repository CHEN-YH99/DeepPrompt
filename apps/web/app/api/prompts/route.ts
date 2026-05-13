import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import type { CreatePromptInput } from "@deepprompt/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";
const uploadRoot = path.resolve(process.cwd(), "public", "uploads");

export const runtime = "nodejs";

function splitTags(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/[,，\n]/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 5);
}

function collectParamsJson(formData: FormData) {
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("param__")) continue;
    const paramKey = key.slice("param__".length).trim();
    const stringValue = String(value).trim();
    if (paramKey && stringValue) {
      params[paramKey] = stringValue;
    }
  }
  return params;
}

function redirectWithError(request: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/publish?error=${error}`, request.url), { status: 303 });
}

async function persistUploadedFile(file: File) {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const ext = path.extname(file.name || "").toLowerCase() || ".bin";
  const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const relativePath = path.posix.join(year, month, day, fileName);
  const targetPath = path.resolve(uploadRoot, relativePath);

  if (!targetPath.startsWith(uploadRoot)) {
    throw new Error("Resolved upload path escaped upload root");
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const bytes = new Uint8Array(await file.arrayBuffer());
  await fs.writeFile(targetPath, bytes);

  return {
    url: `/uploads/${relativePath}`,
    thumb_url: `/uploads/${relativePath}`,
    width: 1200,
    height: 800,
    file_size: file.size
  };
}

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.redirect(new URL("/publish?error=login_required", request.url), {
      status: 303
    });
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const promptText = String(formData.get("prompt_text") ?? "").trim();
  const modelId = String(formData.get("model_id") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const uploadedFiles = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, 6);
  const status = formData.get("intent") === "draft" ? "draft" : "pending";

  if (!title || !promptText || !modelId || (!imageUrl && uploadedFiles.length === 0)) {
    return redirectWithError(request, "invalid_prompt_payload");
  }

  let images: CreatePromptInput["images"] = [];
  if (uploadedFiles.length > 0) {
    try {
      images = await Promise.all(uploadedFiles.map((file) => persistUploadedFile(file)));
    } catch {
      return redirectWithError(request, "upload_failed");
    }
  }

  if (images.length === 0 && imageUrl) {
    images = [
      {
        url: imageUrl,
        thumb_url: imageUrl,
        width: 1200,
        height: 800,
        file_size: 0
      }
    ];
  }

  const payload: CreatePromptInput = {
    title,
    prompt_text: promptText,
    negative_prompt: String(formData.get("negative_prompt") ?? "").trim() || undefined,
    model_ids: [modelId],
    style_tags: splitTags(formData.get("style_tags")),
    usage_tags: splitTags(formData.get("usage_tags")),
    color_tags: splitTags(formData.get("color_tags")),
    usage_note: String(formData.get("usage_note") ?? "").trim() || undefined,
    params_json: collectParamsJson(formData),
    images,
    status
  };

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/v1/prompts`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
  } catch {
    return redirectWithError(request, "api_unreachable");
  }

  if (!response.ok) {
    return redirectWithError(request, "publish_failed");
  }

  const json = (await response.json()) as {
    data?: { id?: string };
  };
  const createdPromptId = json.data?.id;

  if (createdPromptId && status !== "draft") {
    return NextResponse.redirect(
      new URL(`/prompts/${createdPromptId}?created=1`, request.url),
      { status: 303 }
    );
  }

  return NextResponse.redirect(new URL("/me/prompts?created=1", request.url), { status: 303 });
}
