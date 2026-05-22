import type { ApiSuccess, PromptListItem, PromptListMeta } from "@deepprompt/types";
import type { PromptRecord, PromptSearchQuery } from "./data";

function promptListItemToRecord(prompt: PromptListItem): PromptRecord {
  const paramsRecord =
    "params_json" in prompt && (prompt as Record<string, unknown>).params_json &&
    typeof (prompt as Record<string, unknown>).params_json === "object"
      ? ((prompt as Record<string, unknown>).params_json as Record<string, unknown>)
      : {};

  return {
    id: prompt.id,
    title: prompt.title,
    modelIds: prompt.model_ids,
    modelLabel: prompt.model_label,
    styleTags: prompt.style_tags,
    usageTags: prompt.usage_tags,
    colorTags: prompt.color_tags,
    author: prompt.author,
    likes: prompt.like_count,
    collects: prompt.collect_count,
    copies: prompt.copy_count,
    status: prompt.status,
    createdAt: prompt.created_at,
    cover:
      prompt.cover_url ??
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
    coverThumb: prompt.cover_thumb_url ?? null,
    excerpt: prompt.excerpt,
    promptText: prompt.excerpt,
    params: Object.entries(paramsRecord).map(([k, v]) => `${k.toUpperCase()} ${String(v)}`),
    paramsRecord,
    note: "",
    images: prompt.cover_url
      ? [{ url: prompt.cover_url, thumbUrl: prompt.cover_thumb_url ?? null }]
      : [],
    viewerLiked: false,
    viewerCollected: false
  };
}

export type FetchPromptsClientResult = {
  items: PromptRecord[];
  total: number;
  hasMore: boolean;
};

export async function fetchPromptsClient(
  query: PromptSearchQuery & { offset?: number },
  pageSize = 24
): Promise<FetchPromptsClientResult> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.modelIds?.length) params.set("model_ids", query.modelIds.join(","));
  if (query.styleTags?.length) params.set("style_tags", query.styleTags.join(","));
  if (query.colorTags?.length) params.set("color_tags", query.colorTags.join(","));
  if (query.usageTags?.length) params.set("usage_tags", query.usageTags.join(","));
  if (query.sort) params.set("sort", query.sort);
  params.set("limit", String(pageSize));
  if (query.offset) params.set("offset", String(query.offset));

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const response = await fetch(`/api/prompts/list${suffix}`);
  if (!response.ok) {
    return { items: [], total: 0, hasMore: false };
  }

  const json = (await response.json()) as ApiSuccess<PromptListItem[], PromptListMeta>;
  const items = json.data.map(promptListItemToRecord);
  const total = json.meta?.total ?? items.length;
  const offset = query.offset ?? 0;
  const hasMore = offset + items.length < total;

  return { items, total, hasMore };
}
