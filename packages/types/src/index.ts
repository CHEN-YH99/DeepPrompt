export type ApiSuccess<T, M = Record<string, unknown>> = {
  data: T;
  meta?: M;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

export type UserRole = "user" | "creator" | "moderator" | "admin";

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string;
  role: UserRole;
  points: number;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type RegisterRequest = {
  email?: string;
  phone?: string;
  password: string;
  nickname: string;
};

export type LoginRequest = {
  account: string;
  password: string;
};

export type ModelSummary = {
  id: string;
  display_name: string;
  vendor: string;
  prompt_format: "text" | "tag" | "hybrid";
  supports_neg: boolean;
  feature_tags: string[];
};

export type PromptImageRecord = {
  id: string;
  url: string;
  thumb_url: string | null;
  width: number;
  height: number;
  file_size: number;
  sort_order: number;
};

export type PromptStatus = "approved" | "pending" | "draft" | "rejected" | "archived";

export type PromptListItem = {
  id: string;
  title: string;
  excerpt: string;
  model_ids: string[];
  model_label: string;
  style_tags: string[];
  usage_tags: string[];
  color_tags: string[];
  author: string;
  like_count: number;
  collect_count: number;
  copy_count: number;
  created_at: string;
  cover_url: string | null;
  status: PromptStatus;
};

export type PromptDetail = PromptListItem & {
  prompt_text: string;
  negative_prompt: string | null;
  params_json: Record<string, unknown>;
  usage_note: string | null;
  images: PromptImageRecord[];
};

export type UploadedImageAsset = {
  url: string;
  thumb_url: string | null;
  width: number;
  height: number;
  file_size: number;
};

export type UploadImagesResponse = {
  files: UploadedImageAsset[];
};

export type CreatePromptImageInput = {
  url: string;
  thumb_url?: string | null;
  width?: number;
  height?: number;
  file_size?: number;
};

export type CreatePromptInput = {
  title: string;
  prompt_text: string;
  negative_prompt?: string;
  model_ids: string[];
  style_tags: string[];
  usage_tags: string[];
  color_tags: string[];
  usage_note?: string;
  params_json: Record<string, unknown>;
  images?: CreatePromptImageInput[];
  status?: Extract<PromptStatus, "draft" | "pending" | "approved">;
};
