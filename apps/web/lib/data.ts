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

export const featuredPrompt = prompts[0];

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
  return prompts.find((prompt) => prompt.id === id) ?? prompts[0];
}
