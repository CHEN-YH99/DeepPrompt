import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().max(320).optional().nullable(),
  phone: z.string().min(5).max(20).optional().nullable(),
  password: z.string().min(10).max(128),
  nickname: z.string().max(64).optional(),
  invite_code: z.string().max(32).optional()
});

export const loginSchema = z.object({
  account: z.string().min(1).max(320),
  password: z.string().min(1).max(128),
  captcha_token: z.string().max(4096).optional()
});

export const publishPromptSchema = z.object({
  title: z.string().min(4).max(200),
  prompt_text: z.string().min(12).max(10000),
  negative_prompt: z.string().max(5000).optional(),
  model_ids: z.array(z.string().max(64)).min(1).max(5),
  style_tags: z.array(z.string().max(64)).max(5).default([]),
  usage_tags: z.array(z.string().max(64)).max(5).default([]),
  color_tags: z.array(z.string().max(32)).max(5).default([]),
  params_json: z.record(z.unknown()).default({}),
  usage_note: z.string().max(2000).optional(),
  images: z.array(z.object({
    url: z.string().url().max(2048),
    thumb_url: z.string().url().max(2048).optional().nullable(),
    width: z.number().int().min(1).max(10000).default(1200),
    height: z.number().int().min(1).max(10000).default(800),
    file_size: z.number().int().min(0).default(0)
  })).max(6).default([]),
  intent: z.enum(["submit", "draft"]).default("submit")
});

export const telemetrySchema = z.object({
  name: z.string().min(1).max(96),
  route: z.string().max(255).optional(),
  payload: z.unknown().refine(
    (val) => JSON.stringify(val).length <= 8192,
    "Payload too large (max 8KB)"
  )
});

export const interactionSchema = z.object({
  promptId: z.string().uuid(),
  type: z.enum(["like", "collect"]),
  action: z.enum(["add", "remove"])
});
