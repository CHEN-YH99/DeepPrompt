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

export type ModelParamOption = {
  label: string;
  value: string;
};

export type ModelParamField = {
  key: string;
  label: string;
  input_type: "text" | "textarea" | "number" | "select";
  required?: boolean;
  placeholder?: string;
  help_text?: string;
  default_value?: string | number;
  options?: ModelParamOption[];
};

export type ModelSummary = {
  id: string;
  display_name: string;
  vendor: string;
  prompt_format: "text" | "tag" | "hybrid";
  supports_neg: boolean;
  feature_tags: string[];
  param_schema: ModelParamField[];
  logo_url?: string | null;
  official_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type ModelDetail = ModelSummary & {
  logo_url: string | null;
  official_url: string | null;
  sort_order: number;
  is_active: boolean;
  prompt_count?: number;
};

export type SearchSort =
  | "latest"
  | "trending_weekly"
  | "trending_monthly"
  | "most_copied"
  | "most_collected";

export type PromptListQuery = {
  q?: string;
  model_ids?: string[];
  style_tags?: string[];
  color_tags?: string[];
  usage_tags?: string[];
  sort?: SearchSort;
  limit?: number;
};

export type SearchFacetBucket = {
  value: string;
  count: number;
};

export type PromptListMeta = {
  total: number;
  took_ms: number;
  sort: SearchSort;
  facets: {
    model_ids: SearchFacetBucket[];
    style_tags: SearchFacetBucket[];
    color_tags: SearchFacetBucket[];
    usage_tags: SearchFacetBucket[];
  };
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
