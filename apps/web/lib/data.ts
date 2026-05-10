import type {
  ApiSuccess,
  AuthUser,
  ModelDetail,
  ModelParamField,
  ModelSummary,
  PromptDetail,
  PromptListItem,
  PromptListMeta,
  SearchSort
} from "@deepprompt/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010";

export type PromptRecord = {
  id: string;
  title: string;
  modelIds: string[];
  modelLabel: string;
  styleTags: string[];
  usageTags: string[];
  colorTags: string[];
  author: string;
  likes: number;
  collects: number;
  copies: number;
  status: "approved" | "pending" | "draft";
  createdAt: string;
  cover: string;
  excerpt: string;
  promptText: string;
  negativePrompt?: string;
  params: string[];
  paramsRecord: Record<string, unknown>;
  note: string;
  images: Array<{
    url: string;
    thumbUrl?: string | null;
  }>;
};

export type ModelRecord = {
  id: string;
  displayName: string;
  vendor: string;
  format: "text" | "hybrid";
  supportsNegative: boolean;
  featureTags: string[];
  paramSchema: ModelParamField[];
  logoUrl?: string | null;
  officialUrl?: string | null;
  promptCount?: number;
};

export type SearchFacet = { value: string; count: number };

export type PromptListMetaSnapshot = {
  total: number;
  tookMs: number;
  sort: SearchSort;
  facets: {
    modelIds: SearchFacet[];
    styleTags: SearchFacet[];
    colorTags: SearchFacet[];
    usageTags: SearchFacet[];
  };
};

export type PromptListSnapshot = {
  items: PromptRecord[];
  meta: PromptListMetaSnapshot | null;
};

export type PromptSearchQuery = {
  q?: string;
  modelIds?: string[];
  styleTags?: string[];
  colorTags?: string[];
  usageTags?: string[];
  sort?: SearchSort;
  limit?: number;
};

export const SEARCH_SORT_OPTIONS: Array<{ value: SearchSort; label: string }> = [
  { value: "latest", label: "LATEST" },
  { value: "trending_weekly", label: "TRENDING / WEEK" },
  { value: "trending_monthly", label: "TRENDING / MONTH" },
  { value: "most_copied", label: "MOST COPIED" },
  { value: "most_collected", label: "MOST COLLECTED" }
];

function ensureFirstItem<T>(list: T[], listName: string): T {
  const first = list[0];
  if (!first) {
    throw new Error(`${listName} must contain at least one item.`);
  }
  return first;
}

export const models: ModelRecord[] = [
  {
    id: "gpt-image-2",
    displayName: "GPT-IMAGE-2",
    vendor: "OPENAI",
    format: "text",
    supportsNegative: false,
    featureTags: ["REALISM", "EDIT", "SEMANTIC"],
    paramSchema: []
  },
  {
    id: "midjourney-v6",
    displayName: "MIDJOURNEY V6",
    vendor: "MIDJOURNEY INC.",
    format: "hybrid",
    supportsNegative: false,
    featureTags: ["ART", "STYLE", "ATMOS"],
    paramSchema: []
  },
  {
    id: "banana-flux",
    displayName: "BANANA / BFL FLUX",
    vendor: "BLACK FOREST LABS",
    format: "hybrid",
    supportsNegative: true,
    featureTags: ["OPEN", "FAST", "LOCAL"],
    paramSchema: []
  }
];

const PROMPT_TEMPLATES: Array<Omit<PromptRecord, "paramsRecord">> = [
  {
    id: "dp-001",
    title: "TACTICAL PORTRAIT / NEON RAIN",
    modelIds: ["gpt-image-2"],
    modelLabel: "GPT-IMAGE-2",
    styleTags: ["REALISM", "CYBERPUNK", "FILM GRAIN"],
    usageTags: ["PORTRAIT", "KEY VISUAL"],
    colorTags: ["COLD", "RED SHIFT"],
    author: "UNIT.AMBER",
    likes: 842,
    collects: 316,
    copies: 1284,
    status: "approved",
    createdAt: "2026-05-03 21:40",
    cover:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "Rain-soaked tactical portrait with severe contrast, reflective polymer shell, cold city bleed and command-grade framing.",
    promptText:
      "ultra realistic tactical portrait, rain soaked face, reflective polymer hood, command terminal reflections, cold city bokeh, severe contrast, 85mm lens, dramatic framing, film grain, red beacon accents",
    negativePrompt:
      "low detail, blurry eyes, extra fingers, flat lighting, oversaturated skin, cartoon rendering",
    params: ["AR 4:5", "QUALITY HIGH", "DETAIL 85", "SEED 2204"],
    note:
      "适合做首页 Banner 和人物专题封面，建议搭配冷色城市背景。",
    images: [
      {
        url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        thumbUrl:
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
      }
    ]
  },
  {
    id: "dp-002",
    title: "MECHANICAL PRODUCT STAGE / RED INDEX",
    modelIds: ["banana-flux"],
    modelLabel: "BANANA / BFL FLUX",
    styleTags: ["PRODUCT", "BRUTALIST", "STUDIO"],
    usageTags: ["PRODUCT", "AD"],
    colorTags: ["MONO", "RED"],
    author: "GRID.OPS",
    likes: 631,
    collects: 274,
    copies: 978,
    status: "approved",
    createdAt: "2026-05-02 09:15",
    cover:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "A machinery-first stage composition for product hero shots using hard light, hazard red separators and matte black steel.",
    promptText:
      "industrial product stage, matte black alloy surface, hazard red registration lines, brutalist pedestal, direct hard light, studio precision, clean reflections, mechanical catalog photography",
    negativePrompt:
      "rounded shapes, toy aesthetics, soft bloom, pastel colors, cluttered background",
    params: ["AR 3:2", "CFG 7", "STEPS 32", "UPSCALE OFF"],
    note:
      "适合产品图和专题策展头图，建议和机械字体系统配合。",
    images: [
      {
        url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
        thumbUrl:
          "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"
      }
    ]
  },
  {
    id: "dp-003",
    title: "BLUEPRINT LANDSCAPE / DATA FOG",
    modelIds: ["midjourney-v6"],
    modelLabel: "MIDJOURNEY V6",
    styleTags: ["LANDSCAPE", "EDITORIAL", "MIST"],
    usageTags: ["LANDSCAPE", "COVER"],
    colorTags: ["BLACK", "WHITE"],
    author: "ARCHIVE-17",
    likes: 554,
    collects: 229,
    copies: 742,
    status: "approved",
    createdAt: "2026-05-01 18:08",
    cover:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "Editorial landscape built like a declassified blueprint, dense with fog, horizon grids and disciplined negative space.",
    promptText:
      "vast editorial landscape, declassified blueprint feeling, long horizon, tactical fog, black white palette, structural grid lines, restrained geometry, print editorial composition",
    params: ["--AR 16:9", "--STYLIZE 120", "--CHAOS 8"],
    note:
      "适合做搜索结果页和专题落地页背景，留白空间充足。",
    images: [
      {
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        thumbUrl:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
      }
    ]
  },
  {
    id: "dp-004",
    title: "CONTROL ROOM / DENSE TELEMETRY",
    modelIds: ["gpt-image-2", "banana-flux"],
    modelLabel: "GPT-IMAGE-2 / FLUX",
    styleTags: ["INTERIOR", "TERMINAL", "DENSE UI"],
    usageTags: ["UI", "CONCEPT ART"],
    colorTags: ["GREEN", "RED"],
    author: "SOUTH-DOCK",
    likes: 728,
    collects: 349,
    copies: 1112,
    status: "approved",
    createdAt: "2026-04-29 23:11",
    cover:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "Dense telemetry room prompt tailored for command-center scenes, screen glow, warning stripes and layered metal textures.",
    promptText:
      "retro-futurist control room, dense telemetry screens, tactical terminal glow, aviation red warning bands, modular consoles, heavy metal textures, analog signal noise",
    negativePrompt:
      "cute icons, consumer UI, glassmorphism, rounded buttons, pastel palette",
    params: ["AR 21:9", "DETAIL 90", "NOISE MID", "MOOD ALERT"],
    note:
      "很适合你的原始机械界面方向，本身就能拿来做视觉参考。",
    images: [
      {
        url: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
        thumbUrl:
          "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80"
      }
    ]
  }
];

export const prompts: PromptRecord[] = PROMPT_TEMPLATES.map((entry) => ({
  ...entry,
  paramsRecord: entry.params.reduce<Record<string, unknown>>((acc, raw) => {
    const [keyPart, ...rest] = raw.split(/\s+/);
    if (keyPart) {
      acc[keyPart] = rest.length > 0 ? rest.join(" ") : "";
    }
    return acc;
  }, {})
}));

export const featuredPrompt = ensureFirstItem(prompts, "prompts");
export const defaultModel = ensureFirstItem(models, "models");

export const searchHotTerms = [
  "TACTICAL PORTRAIT",
  "FLUX PRODUCT",
  "CYBERPUNK RAIN",
  "BLUEPRINT LANDSCAPE",
  "UI MATERIAL"
];

export const systemMilestones = [
  {
    stage: "GATE 0",
    title: "ENGINE REBUILD",
    summary: "RESTORE SOURCE TREE / ESTABLISH RUNNABLE WEB WORKSPACE"
  },
  {
    stage: "GATE 2",
    title: "PROMPT CHAIN",
    summary: "HOME / DETAIL / PUBLISH LINKED INTO ONE MVP FLOW"
  },
  {
    stage: "GATE 4",
    title: "MODERATION LOOP",
    summary: "QUEUE / REVIEW / INTERACTION METRICS CLOSED"
  }
];

export const myPromptRows = [
  {
    name: "TACTICAL PORTRAIT / NEON RAIN",
    state: "APPROVED",
    model: "GPT-IMAGE-2",
    metrics: "1284 COPIES / 842 LIKES"
  },
  {
    name: "MECHANICAL FOOD PACK / FIELD TEST",
    state: "PENDING",
    model: "BANANA / BFL FLUX",
    metrics: "UNDER REVIEW / 12 HOURS"
  },
  {
    name: "WHITE PAPER INTERFACE / STATIC CITY",
    state: "DRAFT",
    model: "MIDJOURNEY V6",
    metrics: "LOCAL SAVE / NO PUBLIC DATA"
  }
];

export function getPromptById(id: string) {
  return prompts.find((prompt) => prompt.id === id) ?? featuredPrompt;
}

export function getStaticPromptById(id: string) {
  return prompts.find((prompt) => prompt.id === id) ?? null;
}

function modelSummaryToModelRecord(model: ModelSummary): ModelRecord {
  return {
    id: model.id,
    displayName: model.display_name,
    vendor: model.vendor,
    format: model.prompt_format === "text" ? "text" : "hybrid",
    supportsNegative: model.supports_neg,
    featureTags: model.feature_tags,
    paramSchema: Array.isArray(model.param_schema) ? model.param_schema : [],
    logoUrl: model.logo_url ?? null,
    officialUrl: model.official_url ?? null
  };
}

function modelDetailToModelRecord(model: ModelDetail): ModelRecord {
  return {
    ...modelSummaryToModelRecord(model),
    promptCount: model.prompt_count
  };
}

function promptListItemToPromptRecord(prompt: PromptListItem | PromptDetail): PromptRecord {
  const paramsRecord =
    "params_json" in prompt && prompt.params_json && typeof prompt.params_json === "object"
      ? (prompt.params_json as Record<string, unknown>)
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
    status:
      prompt.status === "approved" || prompt.status === "pending" || prompt.status === "draft"
        ? prompt.status
        : "pending",
    createdAt: prompt.created_at,
    cover:
      prompt.cover_url ??
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
    excerpt: prompt.excerpt,
    promptText: "prompt_text" in prompt ? prompt.prompt_text : prompt.excerpt,
    negativePrompt:
      "negative_prompt" in prompt && prompt.negative_prompt
        ? prompt.negative_prompt
        : undefined,
    params: Object.entries(paramsRecord).map(([key, value]) => `${key.toUpperCase()} ${String(value)}`),
    paramsRecord,
    note:
      "usage_note" in prompt && prompt.usage_note
        ? prompt.usage_note
        : "该 Prompt 来自后端主链路，审核状态和指标由 API 返回。",
    images:
      "images" in prompt && Array.isArray(prompt.images) && prompt.images.length > 0
        ? prompt.images.map((image) => ({
            url: image.url,
            thumbUrl: image.thumb_url
          }))
        : [
            {
              url:
                prompt.cover_url ??
                "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
              thumbUrl: prompt.cover_url
            }
          ]
  };
}

async function readApiResponse<T, M = Record<string, unknown>>(response: Response) {
  return (await response.json()) as ApiSuccess<T, M>;
}

async function readApiData<T>(response: Response) {
  const json = await readApiResponse<T>(response);
  return json.data;
}

function fallbackPromptRecords(query?: PromptSearchQuery) {
  const keyword = query?.q?.trim().toLowerCase() ?? "";
  const modelIds = query?.modelIds ?? [];
  const styleTags = query?.styleTags ?? [];
  const colorTags = query?.colorTags ?? [];
  const usageTags = query?.usageTags ?? [];

  const lowerEqualsAny = (haystack: string[], needles: string[]) =>
    needles.every((needle) => haystack.some((tag) => tag.toUpperCase() === needle.toUpperCase()));

  return prompts.filter((prompt) => {
    const matchesKeyword =
      !keyword ||
      prompt.title.toLowerCase().includes(keyword) ||
      prompt.promptText.toLowerCase().includes(keyword) ||
      prompt.excerpt.toLowerCase().includes(keyword) ||
      prompt.styleTags.some((tag) => tag.toLowerCase().includes(keyword));

    const matchesModel =
      modelIds.length === 0 || modelIds.some((id) => prompt.modelIds.includes(id));
    const matchesStyle = styleTags.length === 0 || lowerEqualsAny(prompt.styleTags, styleTags);
    const matchesColor = colorTags.length === 0 || lowerEqualsAny(prompt.colorTags, colorTags);
    const matchesUsage = usageTags.length === 0 || lowerEqualsAny(prompt.usageTags, usageTags);

    return matchesKeyword && matchesModel && matchesStyle && matchesColor && matchesUsage;
  });
}

function buildPromptListSearchParams(query?: PromptSearchQuery) {
  const params = new URLSearchParams();
  if (query?.q) {
    params.set("q", query.q);
  }
  if (query?.modelIds && query.modelIds.length > 0) {
    params.set("model_ids", query.modelIds.join(","));
  }
  if (query?.styleTags && query.styleTags.length > 0) {
    params.set("style_tags", query.styleTags.join(","));
  }
  if (query?.colorTags && query.colorTags.length > 0) {
    params.set("color_tags", query.colorTags.join(","));
  }
  if (query?.usageTags && query.usageTags.length > 0) {
    params.set("usage_tags", query.usageTags.join(","));
  }
  if (query?.sort) {
    params.set("sort", query.sort);
  }
  if (query?.limit) {
    params.set("limit", String(query.limit));
  }
  return params;
}

export async function fetchModels(): Promise<ModelRecord[]> {
  try {
    const response = await fetch(`${apiBaseUrl}/v1/models`, { cache: "no-store" });
    if (!response.ok) {
      return models;
    }
    const data = await readApiData<ModelDetail[]>(response);
    return data.map(modelDetailToModelRecord);
  } catch {
    return models;
  }
}

export async function fetchModelDetail(id: string): Promise<ModelRecord | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/v1/models/${id}`, { cache: "no-store" });
    if (!response.ok) {
      return models.find((model) => model.id === id) ?? null;
    }
    const data = await readApiData<ModelDetail>(response);
    return modelDetailToModelRecord(data);
  } catch {
    return models.find((model) => model.id === id) ?? null;
  }
}

export async function fetchPromptRecords(query?: PromptSearchQuery): Promise<PromptRecord[]> {
  const params = buildPromptListSearchParams(query);
  try {
    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    const response = await fetch(`${apiBaseUrl}/v1/prompts${suffix}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return fallbackPromptRecords(query);
    }
    const data = await readApiData<PromptListItem[]>(response);
    return data.map(promptListItemToPromptRecord);
  } catch {
    return fallbackPromptRecords(query);
  }
}

export async function fetchPromptList(query?: PromptSearchQuery): Promise<PromptListSnapshot> {
  const params = buildPromptListSearchParams(query);
  try {
    const suffix = params.size > 0 ? `?${params.toString()}` : "";
    const response = await fetch(`${apiBaseUrl}/v1/prompts${suffix}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return {
        items: fallbackPromptRecords(query),
        meta: null
      };
    }
    const json = await readApiResponse<PromptListItem[], PromptListMeta>(response);
    const items = json.data.map(promptListItemToPromptRecord);
    const meta = json.meta
      ? {
          total: json.meta.total,
          tookMs: json.meta.took_ms,
          sort: json.meta.sort,
          facets: {
            modelIds: json.meta.facets.model_ids,
            styleTags: json.meta.facets.style_tags,
            colorTags: json.meta.facets.color_tags,
            usageTags: json.meta.facets.usage_tags
          }
        }
      : null;
    return { items, meta };
  } catch {
    return {
      items: fallbackPromptRecords(query),
      meta: null
    };
  }
}

export async function fetchRelatedPromptRecords(id: string): Promise<PromptRecord[]> {
  try {
    const response = await fetch(`${apiBaseUrl}/v1/prompts/${id}/related`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return [];
    }
    const data = await readApiData<PromptListItem[]>(response);
    return data.map(promptListItemToPromptRecord);
  } catch {
    return [];
  }
}

export async function fetchMyPromptRecords(accessToken?: string) {
  if (!accessToken) {
    return [];
  }

  try {
    const response = await fetch(`${apiBaseUrl}/v1/prompts/me`, {
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      cache: "no-store"
    });
    if (!response.ok) {
      return [];
    }
    const data = await readApiData<PromptListItem[]>(response);
    return data.map(promptListItemToPromptRecord);
  } catch {
    return [];
  }
}

export async function fetchPromptRecordById(id: string, accessToken?: string) {
  try {
    const response = await fetch(`${apiBaseUrl}/v1/prompts/${id}`, {
      headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
      cache: "no-store"
    });
    if (!response.ok) {
      return getStaticPromptById(id);
    }
    const data = await readApiData<PromptDetail>(response);
    return promptListItemToPromptRecord(data);
  } catch {
    return getStaticPromptById(id);
  }
}

export async function fetchCurrentUser(accessToken?: string) {
  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/v1/auth/me`, {
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      cache: "no-store"
    });
    if (!response.ok) {
      return null;
    }
    return readApiData<AuthUser>(response);
  } catch {
    return null;
  }
}
