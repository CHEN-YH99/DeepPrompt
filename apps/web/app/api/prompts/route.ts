import { NextRequest, NextResponse } from "next/server";
import type { CreatePromptInput, UploadImagesResponse } from "@deepprompt/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

function splitTags(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/[,，\n]/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 5);
}

function parseParams(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((params, line) => {
      const [rawKey, ...rest] = line.split("=");
      const key = rawKey?.trim();
      const paramValue = rest.join("=").trim();
      if (key && paramValue) {
        params[key] = paramValue;
      }
      return params;
    }, {});
}

function redirectWithError(request: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/publish?error=${error}`, request.url));
}

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.redirect(new URL("/login?error=login_required", request.url));
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
  const status = formData.get("intent") === "draft" ? "draft" : "approved";

  if (!title || !promptText || !modelId || (!imageUrl && uploadedFiles.length === 0)) {
    return redirectWithError(request, "invalid_prompt_payload");
  }

  let images: CreatePromptInput["images"] = [];
  if (uploadedFiles.length > 0) {
    const uploadFormData = new FormData();
    for (const file of uploadedFiles) {
      uploadFormData.append("images", file, file.name);
    }

    let uploadResponse: Response;
    try {
      uploadResponse = await fetch(`${apiBaseUrl}/v1/uploads`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        body: uploadFormData,
        cache: "no-store"
      });
    } catch {
      return redirectWithError(request, "api_unreachable");
    }

    if (!uploadResponse.ok) {
      return redirectWithError(request, "upload_failed");
    }

    const uploadJson = (await uploadResponse.json()) as { data?: UploadImagesResponse };
    images = (uploadJson.data?.files ?? []).map((file) => ({
      url: file.url,
      thumb_url: file.thumb_url,
      width: file.width,
      height: file.height,
      file_size: file.file_size
    }));
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
    params_json: parseParams(formData.get("params_json")),
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
    return NextResponse.redirect(new URL(`/prompts/${createdPromptId}?created=1`, request.url));
  }

  return NextResponse.redirect(new URL("/me/prompts?created=1", request.url));
}
