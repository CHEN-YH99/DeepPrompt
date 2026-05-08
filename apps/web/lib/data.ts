import type {
  ApiSuccess,
  AuthUser,
  ModelSummary,
  PromptDetail,
  PromptListItem
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
  note: string;
};

export type ModelRecord = {
  id: string;
  displayName: string;
  vendor: string;
  format: "text" | "hybrid";
  supportsNegative: boolean;
  featureTags: string[];
};

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
    featureTags: ["REALISM", "EDIT", "SEMANTIC"]
  },
  {
    id: "midjourney-v6",
    displayName: "MIDJOURNEY V6",
    vendor: "MIDJOURNEY INC.",
    format: "hybrid",
    supportsNegative: false,
    featureTags: ["ART", "STYLE", "ATMOS"]
  },
  {
    id: "banana-flux",
    displayName: "BANANA / BFL FLUX",
    vendor: "BLACK FOREST LABS",
    format: "hybrid",
    supportsNegative: true,
    featureTags: ["OPEN", "FAST", "LOCAL"]
  }
];

export const prompts: PromptRecord[] = [
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
      "适合做首页 Banner 和人物专题封面，建议搭配冷色城市背景。"
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
      "适合产品图和专题策展头图，建议和机械字体系统配合。"
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
      "适合做搜索结果页和专题落地页背景，留白空间充足。"
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
      "很适合你的原始机械界面方向，本身就能拿来做视觉参考。"
  }
];

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
    featureTags: model.feature_tags
  };
}

function promptListItemToPromptRecord(prompt: PromptListItem | PromptDetail): PromptRecord {
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
    params:
      "params_json" in prompt
        ? Object.entries(prompt.params_json).map(([key, value]) => `${key.toUpperCase()} ${String(value)}`)
        : [],
    note:
      "usage_note" in prompt && prompt.usage_note
        ? prompt.usage_note
        : "该 Prompt 来自后端主链路，审核状态和指标由 API 返回。"
  };
}

async function readApiData<T>(response: Response) {
  const json = (await response.json()) as ApiSuccess<T>;
  return json.data;
}

function fallbackPromptRecords(query?: { q?: string; modelId?: string }) {
  const keyword = query?.q?.trim().toLowerCase() ?? "";
  const modelId = query?.modelId?.trim() ?? "";

  return prompts.filter((prompt) => {
    const matchesKeyword =
      !keyword ||
      prompt.title.toLowerCase().includes(keyword) ||
      prompt.promptText.toLowerCase().includes(keyword) ||
      prompt.excerpt.toLowerCase().includes(keyword) ||
      prompt.styleTags.some((tag) => tag.toLowerCase().includes(keyword));

    const matchesModel = !modelId || prompt.modelIds.includes(modelId);

    return matchesKeyword && matchesModel;
  });
}

export async function fetchModels() {
  try {
    const response = await fetch(`${apiBaseUrl}/v1/models`, { cache: "no-store" });
    if (!response.ok) {
      return models;
    }
    const data = await readApiData<ModelSummary[]>(response);
    return data.map(modelSummaryToModelRecord);
  } catch {
    return models;
  }
}

export async function fetchPromptRecords(query?: { q?: string; modelId?: string }) {
  const params = new URLSearchParams();
  if (query?.q) {
    params.set("q", query.q);
  }
  if (query?.modelId) {
    params.set("model_id", query.modelId);
  }

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
