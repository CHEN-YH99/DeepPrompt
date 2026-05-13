import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
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

function redirectWithError(request: NextRequest, error: string, detail?: string) {
  const url = new URL(`/publish?error=${error}`, request.url);
  if (detail) {
    url.searchParams.set("detail", detail.slice(0, 240));
  }
  return NextResponse.redirect(url, { status: 303 });
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
  console.log("[publish] POST /api/prompts received");
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) {
    console.warn("[publish] no access_token cookie — redirecting login_required");
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
  const intent = formData.get("intent");
  let status: "draft" | "approved" | "pending";
  if (intent === "draft") {
    status = "draft";
  } else {
    // 管理员/版主发布直接通过，无需审核
    let isPrivileged = false;
    try {
      const meRes = await fetch(`${apiBaseUrl}/v1/auth/me`, {
        headers: { authorization: `Bearer ${accessToken}` },
        cache: "no-store"
      });
      if (meRes.ok) {
        const meJson = (await meRes.json()) as { data?: { role?: string } };
        isPrivileged = meJson.data?.role === "admin" || meJson.data?.role === "moderator";
      }
    } catch {
      // 查询失败时降级为 pending
    }
    status = isPrivileged ? "approved" : "pending";
  }

  console.log("[publish] form snapshot", {
    titleLen: title.length,
    promptTextLen: promptText.length,
    modelId,
    hasImageUrl: Boolean(imageUrl),
    uploadedFileCount: uploadedFiles.length,
    status
  });

  if (title.length < 4 || promptText.length < 12 || !modelId || (!imageUrl && uploadedFiles.length === 0)) {
    console.warn("[publish] front-end payload check failed → invalid_prompt_payload", {
      titleLen: title.length,
      promptTextLen: promptText.length,
      modelId,
      hasImageUrl: Boolean(imageUrl),
      uploadedFileCount: uploadedFiles.length
    });
    return redirectWithError(request, "invalid_prompt_payload");
  }

  let images: CreatePromptInput["images"] = [];
  if (uploadedFiles.length > 0) {
    try {
      images = await Promise.all(uploadedFiles.map((file) => persistUploadedFile(file)));
    } catch (uploadError) {
      console.error("[publish] persistUploadedFile threw", uploadError);
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

  console.log("[publish] dispatching to backend", {
    apiBaseUrl,
    styleTags: payload.style_tags,
    imageCount: images.length
  });

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
  } catch (fetchError) {
    console.error("[publish] backend fetch threw", fetchError);
    return redirectWithError(request, "api_unreachable");
  }

  console.log("[publish] backend responded", response.status);

  if (!response.ok) {
    const rawBody = await response.text().catch(() => "");
    type ApiErrorBody = { error?: { code?: string; message?: string } };
    let parsed: ApiErrorBody | null = null;
    try {
      parsed = rawBody ? (JSON.parse(rawBody) as ApiErrorBody) : null;
    } catch {
      parsed = null;
    }
    const message = parsed?.error?.message ?? rawBody.slice(0, 200);
    console.error("[publish] backend rejected prompt creation", {
      status: response.status,
      code: parsed?.error?.code ?? "(none)",
      message,
      rawBody: rawBody.slice(0, 500),
      payloadSummary: {
        titleLen: title.length,
        promptTextLen: promptText.length,
        modelId,
        styleTags: payload.style_tags,
        imageCount: images.length,
        status
      }
    });
    return redirectWithError(request, "publish_failed", message);
  }

  const json = (await response.json()) as {
    data?: { id?: string };
  };
  const createdPromptId = json.data?.id;

  // 让所有依赖 prompts 列表/详情/搜索/我的页面的 RSC 缓存立即失效，
  // 这样发布完成的跳转目标页能直接呈现最新数据，无需用户手动刷新。
  // Next 16 起 revalidateTag 需要第二个 profile 参数；"max" 表示立即过期。
  // updateTag 只能在 Server Action 内调用，在 Route Handler 里会直接抛错。
  revalidateTag("prompts:list", "max");
  revalidateTag("prompts:search", "max");
  revalidateTag("prompts:detail", "max");
  revalidateTag("prompts:related", "max");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/me/prompts");
  if (createdPromptId) {
    revalidatePath(`/prompts/${createdPromptId}`);
  }

  if (createdPromptId && status !== "draft") {
    return NextResponse.redirect(
      new URL(`/prompts/${createdPromptId}?created=1`, request.url),
      { status: 303 }
    );
  }

  return NextResponse.redirect(new URL("/me/prompts?created=1", request.url), { status: 303 });
}
