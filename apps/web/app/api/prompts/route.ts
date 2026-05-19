import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import type { CreatePromptInput } from "@deepprompt/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

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

// 发布失败回灌：把已提交的文字段塞到一次性 cookie 里，/publish 读出来回灌 defaultValue。
// 图片文件 (FormData File) 浏览器不允许程序化恢复，所以只保留文字字段 + image_url。
// 5 分钟过期，避免长时间残留。
const PUBLISH_DRAFT_COOKIE = "publish_draft";
const PUBLISH_DRAFT_MAX_LEN = 12_000;

function collectDraftSnapshot(formData: FormData) {
  const draft: Record<string, string | string[] | Record<string, string>> = {};
  const stringKeys = ["title", "prompt_text", "negative_prompt", "usage_note", "image_url", "model_id"];
  for (const key of stringKeys) {
    const value = String(formData.get(key) ?? "");
    if (value) draft[key] = value;
  }
  for (const tagKey of ["style_tags", "usage_tags", "color_tags"] as const) {
    const tags = splitTags(formData.get(tagKey));
    if (tags.length > 0) draft[tagKey] = tags;
  }
  const params = collectParamsJson(formData);
  if (Object.keys(params).length > 0) draft.params = params;
  return draft;
}

function redirectWithError(
  request: NextRequest,
  error: string,
  detail?: string,
  formData?: FormData
) {
  const url = new URL(`/publish?error=${error}`, request.url);
  if (detail) {
    url.searchParams.set("detail", detail.slice(0, 240));
  }
  const response = NextResponse.redirect(url, { status: 303 });
  if (formData) {
    try {
      const snapshot = collectDraftSnapshot(formData);
      const serialized = JSON.stringify(snapshot);
      // 防御 cookie 体积爆炸（4KB 限制）；超长就放弃保存，让用户至少看到错误提示。
      if (serialized.length <= PUBLISH_DRAFT_MAX_LEN) {
        response.cookies.set({
          name: PUBLISH_DRAFT_COOKIE,
          value: encodeURIComponent(serialized),
          path: "/publish",
          maxAge: 300,
          sameSite: "lax",
          httpOnly: false
        });
      }
    } catch {
      // 序列化失败就静默放弃；不影响主流程
    }
  }
  return response;
}

async function persistUploadedFile(file: File, accessToken: string) {
  const presignRes = await fetch(`${apiBaseUrl}/v1/uploads/presign`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      filename: file.name || "upload.bin",
      content_type: file.type || "application/octet-stream"
    }),
    cache: "no-store"
  });
  if (!presignRes.ok) {
    throw new Error(`presign failed: ${presignRes.status}`);
  }
  const presignJson = (await presignRes.json()) as {
    data?: { uploadUrl?: string; key?: string; publicUrl?: string };
  };
  const uploadUrl = presignJson.data?.uploadUrl;
  const key = presignJson.data?.key;
  const publicUrl = presignJson.data?.publicUrl;
  if (!uploadUrl || !key || !publicUrl) {
    throw new Error("presign response missing fields");
  }

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": file.type || "application/octet-stream" },
    body: await file.arrayBuffer()
  });
  if (!putRes.ok) {
    throw new Error(`R2 PUT failed: ${putRes.status}`);
  }

  await fetch(`${apiBaseUrl}/v1/uploads/confirm/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  }).catch(() => {});

  return {
    url: publicUrl,
    thumb_url: publicUrl,
    width: 1200,
    height: 800,
    file_size: file.size
  };
}

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  // 登录失效路径：先读出 formData 再跳，让用户重新登录后回到 /publish 还能看到自己写的内容。
  if (!accessToken) {
    let formDataForDraft: FormData | undefined;
    try {
      formDataForDraft = await request.clone().formData();
    } catch {
      formDataForDraft = undefined;
    }
    return redirectWithError(request, "login_required", undefined, formDataForDraft);
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

  if (title.length < 4 || promptText.length < 12 || !modelId || (!imageUrl && uploadedFiles.length === 0)) {
    return redirectWithError(request, "invalid_prompt_payload", undefined, formData);
  }

  let images: CreatePromptInput["images"] = [];
  if (uploadedFiles.length > 0) {
    try {
      images = await Promise.all(uploadedFiles.map((file) => persistUploadedFile(file, accessToken)));
    } catch (uploadError) {
      console.error("[publish] persistUploadedFile threw", uploadError);
      return redirectWithError(request, "upload_failed", undefined, formData);
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
  } catch (fetchError) {
    console.error("[publish] backend fetch threw", fetchError);
    return redirectWithError(request, "api_unreachable", undefined, formData);
  }

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
      code: parsed?.error?.code ?? "(none)"
    });
    return redirectWithError(request, "publish_failed", message, formData);
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
    const successResponse = NextResponse.redirect(
      new URL(`/prompts/${createdPromptId}?created=1`, request.url),
      { status: 303 }
    );
    successResponse.cookies.delete({ name: PUBLISH_DRAFT_COOKIE, path: "/publish" });
    return successResponse;
  }

  const draftResponse = NextResponse.redirect(
    new URL("/me/prompts?created=1", request.url),
    { status: 303 }
  );
  draftResponse.cookies.delete({ name: PUBLISH_DRAFT_COOKIE, path: "/publish" });
  return draftResponse;
}
