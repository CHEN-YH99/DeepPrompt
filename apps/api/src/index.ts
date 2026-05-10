import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import type {
  ApiError,
  ApiSuccess,
  AuthUser,
  CreatePromptInput,
  ModelDetail,
  ModelParamField,
  ModelSummary,
  PromptDetail,
  PromptImageRecord,
  PromptListItem,
  PromptListMeta,
  PromptStatus,
  RegisterRequest,
  SearchFacetBucket,
  SearchSort
} from "@deepprompt/types";
import { Client } from "pg";
import { createClient, type RedisClientType } from "redis";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const rootEnvPath = path.resolve(currentDir, "../../../.env");

dotenv.config({ path: rootEnvPath });

type StoredAuthUser = AuthUser & {
  password_hash: string;
  is_active: boolean;
};

type AuthTokenPayload = {
  sub: string;
  role: AuthUser["role"];
  tokenType: "access" | "refresh";
};

type AuthedRequest = Request & {
  user: AuthUser;
};

type PromptListRow = Omit<PromptListItem, "created_at"> & {
  created_at: Date;
};

type PromptDetailRow = Omit<PromptDetail, "created_at" | "images"> & {
  created_at: Date;
};

type ModelRegistryRow = {
  id: string;
  display_name: string;
  vendor: string;
  logo_url: string | null;
  official_url: string | null;
  prompt_format: ModelSummary["prompt_format"];
  supports_neg: boolean;
  param_schema: ModelParamField[] | null;
  is_active: boolean;
  sort_order: number;
  feature_tags: string[];
};

const modelCache = {
  data: null as ModelDetail[] | null,
  expiresAt: 0
};
const MODEL_CACHE_TTL_MS = 60 * 1000;

function rowToModelDetail(row: ModelRegistryRow, promptCount = 0): ModelDetail {
  return {
    id: row.id,
    display_name: row.display_name,
    vendor: row.vendor,
    prompt_format: row.prompt_format,
    supports_neg: row.supports_neg,
    feature_tags: row.feature_tags ?? [],
    param_schema: Array.isArray(row.param_schema) ? row.param_schema : [],
    logo_url: row.logo_url,
    official_url: row.official_url,
    sort_order: row.sort_order,
    is_active: row.is_active,
    prompt_count: promptCount
  };
}

async function loadActiveModels(): Promise<ModelDetail[]> {
  const now = Date.now();
  if (modelCache.data && modelCache.expiresAt > now) {
    return modelCache.data;
  }

  const result = await pgClient.query<ModelRegistryRow>(
    `
    SELECT
      id, display_name, vendor, logo_url, official_url,
      prompt_format, supports_neg, param_schema, is_active,
      sort_order, feature_tags
    FROM model_registry
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, display_name ASC
    `
  );

  const data = result.rows.map((row) => rowToModelDetail(row));
  modelCache.data = data;
  modelCache.expiresAt = now + MODEL_CACHE_TTL_MS;
  return data;
}

function invalidateModelCache() {
  modelCache.data = null;
  modelCache.expiresAt = 0;
}

const SORT_FIELDS: Record<SearchSort, string> = {
  latest: "p.created_at DESC, p.id DESC",
  trending_weekly: "p.like_count DESC, p.created_at DESC",
  trending_monthly: "p.like_count DESC, p.collect_count DESC, p.created_at DESC",
  most_copied: "p.copy_count DESC, p.created_at DESC",
  most_collected: "p.collect_count DESC, p.created_at DESC"
};

function parseSort(value: unknown): SearchSort {
  const candidate = typeof value === "string" ? value : "";
  if (candidate in SORT_FIELDS) {
    return candidate as SearchSort;
  }
  return "latest";
}

function parseListParam(value: unknown, max = 8): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, max);
  }

  if (typeof value !== "string" || value.length === 0) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

const app = express();
const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3010);
const jwtSecret = process.env.JWT_SECRET ?? "replace_me_with_real_jwt_secret";
const jwtRefreshSecret =
  process.env.JWT_REFRESH_SECRET ?? "replace_me_with_real_jwt_refresh_secret";
const accessTokenExpiresInSeconds = 15 * 60;
const refreshTokenExpiresInSeconds = 7 * 24 * 60 * 60;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const pgClient = new Client({ connectionString: databaseUrl });

let redisClient: RedisClientType | null = null;
const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
  redisClient = createClient({ url: redisUrl });
  redisClient.on("error", (error) => {
    console.warn("[api] redis error:", error.message);
  });
}

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

function success<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  const body: ApiSuccess<T> = { data, meta };
  res.json(body);
}

function fail(res: Response, code: number, errorCode: string, message: string) {
  const body: ApiError = {
    error: {
      code: errorCode,
      message
    }
  };
  res.status(code).json(body);
}

function signAccessToken(user: AuthUser) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      tokenType: "access"
    } satisfies AuthTokenPayload,
    jwtSecret,
    { expiresIn: accessTokenExpiresInSeconds }
  );
}

function signRefreshToken(user: AuthUser) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      tokenType: "refresh"
    } satisfies AuthTokenPayload,
    jwtRefreshSecret,
    { expiresIn: refreshTokenExpiresInSeconds }
  );
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function saveSession(
  userId: string,
  refreshToken: string,
  req: Request
): Promise<{ sessionId: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + refreshTokenExpiresInSeconds * 1000);
  const refreshTokenHash = hashToken(refreshToken);
  const userAgent = req.get("user-agent") ?? null;
  const ipAddress = req.ip ?? null;

  const result = await pgClient.query<{ id: string }>(
    `
    INSERT INTO auth_sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [userId, refreshTokenHash, userAgent, ipAddress, expiresAt]
  );

  const sessionRow = result.rows[0];
  if (!sessionRow) {
    throw new Error("Failed to create auth session");
  }

  if (redisClient) {
    const redisKey = `user:session:${refreshTokenHash}`;
    await redisClient.hSet(redisKey, {
      user_id: userId,
      session_id: sessionRow.id
    });
    await redisClient.expire(redisKey, refreshTokenExpiresInSeconds);
  }

  return { sessionId: sessionRow.id, expiresAt };
}

async function revokeSessionByToken(refreshToken: string) {
  const refreshTokenHash = hashToken(refreshToken);
  await pgClient.query(
    `
    UPDATE auth_sessions
    SET revoked_at = NOW()
    WHERE refresh_token_hash = $1 AND revoked_at IS NULL
    `,
    [refreshTokenHash]
  );

  if (redisClient) {
    await redisClient.del(`user:session:${refreshTokenHash}`);
  }
}

function getBearerToken(req: Request) {
  const authHeader = req.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice("Bearer ".length).trim();
}

async function readUserByToken(token: string) {
  const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload;
  if (payload.tokenType !== "access") {
    return null;
  }

  const result = await pgClient.query<AuthUser>(
    `
    SELECT id, email, phone, nickname, role, points
    FROM users
    WHERE id = $1 AND is_active = TRUE
    `,
    [payload.sub]
  );

  return result.rows[0] ?? null;
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    fail(res, 401, "UNAUTHORIZED", "Missing access token");
    return;
  }

  try {
    const user = await readUserByToken(token);
    if (!user) {
      fail(res, 401, "UNAUTHORIZED", "User not found");
      return;
    }

    (req as AuthedRequest).user = user;
    next();
  } catch {
    fail(res, 401, "UNAUTHORIZED", "Invalid or expired access token");
  }
}

async function getOptionalUser(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  try {
    return await readUserByToken(token);
  } catch {
    return null;
  }
}

function normalizeStringList(value: unknown, maxItems = 8) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeParams(value: unknown) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }

  return value as Record<string, unknown>;
}

async function getModelLabel(modelIds: string[]): Promise<string> {
  if (modelIds.length === 0) {
    return "UNKNOWN MODEL";
  }
  const models = await loadActiveModels();
  const labels = modelIds
    .map((id) => models.find((model) => model.id === id)?.display_name ?? id)
    .filter(Boolean);

  return labels.length > 0 ? labels.join(" / ") : "UNKNOWN MODEL";
}

async function toPromptListItem(row: PromptListRow): Promise<PromptListItem> {
  return {
    ...row,
    model_label: await getModelLabel(row.model_ids),
    created_at: row.created_at.toISOString()
  };
}

async function getPromptImages(promptId: string) {
  const result = await pgClient.query<PromptImageRecord>(
    `
    SELECT id, url, thumb_url, width, height, file_size, sort_order
    FROM prompt_images
    WHERE prompt_id = $1
    ORDER BY sort_order ASC
    `,
    [promptId]
  );

  return result.rows;
}

async function getPromptOwner(promptId: string) {
  const result = await pgClient.query<{ author_id: string }>(
    "SELECT author_id FROM prompts WHERE id = $1 LIMIT 1",
    [promptId]
  );

  return result.rows[0]?.author_id ?? null;
}

async function getPromptDetail(promptId: string) {
  const result = await pgClient.query<PromptDetailRow>(
    `
    SELECT
      p.id,
      p.title,
      LEFT(p.prompt_text, 180) AS excerpt,
      p.model_ids,
      array_to_string(p.model_ids, ' / ') AS model_label,
      p.style_tags,
      p.usage_tags,
      p.color_tags,
      u.nickname AS author,
      p.like_count,
      p.collect_count,
      p.copy_count,
      p.created_at,
      p.status,
      (
        SELECT pi.url
        FROM prompt_images pi
        WHERE pi.prompt_id = p.id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS cover_url,
      p.prompt_text,
      p.negative_prompt,
      p.params_json,
      p.usage_note
    FROM prompts p
    JOIN users u ON u.id = p.author_id
    WHERE p.id = $1
    LIMIT 1
    `,
    [promptId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    ...row,
    model_label: await getModelLabel(row.model_ids),
    created_at: row.created_at.toISOString(),
    images: await getPromptImages(promptId)
  } satisfies PromptDetail;
}

app.get("/health", (_req, res) => {
  success(res, {
    ok: true,
    service: "deepprompt-api",
    timestamp: new Date().toISOString()
  });
});

app.post("/v1/auth/register", async (req, res) => {
  const body = (req.body ?? {}) as RegisterRequest;
  const password = body.password;
  const nickname = body.nickname?.trim();
  const email = body.email?.trim().toLowerCase() ?? null;
  const phone = body.phone?.trim() ?? null;

  if (!password || password.length < 8) {
    fail(res, 400, "BAD_REQUEST", "Password must be at least 8 characters");
    return;
  }

  if (!nickname || nickname.length < 2) {
    fail(res, 400, "BAD_REQUEST", "Nickname must be at least 2 characters");
    return;
  }

  if (!email && !phone) {
    fail(res, 400, "BAD_REQUEST", "Email or phone is required");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await pgClient.query<AuthUser>(
      `
      INSERT INTO users (email, phone, nickname, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, phone, nickname, role, points
      `,
      [email, phone, nickname, passwordHash]
    );
    const user = result.rows[0];
    if (!user) {
      throw new Error("Failed to create user");
    }
    success(res, user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("users_email_key")) {
      fail(res, 409, "CONFLICT", "Email already exists");
      return;
    }
    if (message.includes("users_phone_key")) {
      fail(res, 409, "CONFLICT", "Phone already exists");
      return;
    }
    fail(res, 500, "INTERNAL_ERROR", "Failed to register user");
  }
});

app.get("/v1/auth/register", (_req, res) => {
  fail(res, 405, "METHOD_NOT_ALLOWED", "Use POST /v1/auth/register");
});

app.post("/v1/auth/login", async (req, res) => {
  const { account, password } = req.body as { account?: string; password?: string };
  if (!account || !password) {
    fail(res, 400, "BAD_REQUEST", "Account and password are required");
    return;
  }

  const normalizedAccount = account.trim().toLowerCase();
  const result = await pgClient.query<StoredAuthUser>(
    `
    SELECT id, email, phone, nickname, role, points, password_hash, is_active
    FROM users
    WHERE email = $1 OR phone = $2
    LIMIT 1
    `,
    [normalizedAccount, account.trim()]
  );

  const row = result.rows[0];
  if (!row || !row.is_active) {
    fail(res, 401, "UNAUTHORIZED", "Invalid credentials");
    return;
  }

  const passwordMatched = await bcrypt.compare(password, row.password_hash);
  if (!passwordMatched) {
    fail(res, 401, "UNAUTHORIZED", "Invalid credentials");
    return;
  }

  const user: AuthUser = {
    id: row.id,
    email: row.email,
    phone: row.phone,
    nickname: row.nickname,
    role: row.role,
    points: row.points
  };

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const { expiresAt } = await saveSession(user.id, refreshToken, req);

  await pgClient.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    expires: expiresAt
  });

  success(res, {
    user,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: accessTokenExpiresInSeconds
  });
});

app.get("/v1/auth/login", (_req, res) => {
  fail(res, 405, "METHOD_NOT_ALLOWED", "Use POST /v1/auth/login");
});

app.post("/v1/auth/refresh", async (req, res) => {
  const bodyToken = (req.body as { refresh_token?: string }).refresh_token;
  const cookieToken = req.cookies?.refresh_token as string | undefined;
  const refreshToken = bodyToken ?? cookieToken;
  if (!refreshToken) {
    fail(res, 401, "UNAUTHORIZED", "Missing refresh token");
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, jwtRefreshSecret) as AuthTokenPayload;
    if (payload.tokenType !== "refresh") {
      fail(res, 401, "UNAUTHORIZED", "Invalid token type");
      return;
    }

    const refreshTokenHash = hashToken(refreshToken);
    const sessionResult = await pgClient.query<{ user_id: string; revoked_at: Date | null }>(
      `
      SELECT user_id, revoked_at
      FROM auth_sessions
      WHERE refresh_token_hash = $1 AND expires_at > NOW()
      LIMIT 1
      `,
      [refreshTokenHash]
    );

    const session = sessionResult.rows[0];
    if (!session || session.revoked_at) {
      fail(res, 401, "UNAUTHORIZED", "Refresh token is invalid");
      return;
    }

    const userResult = await pgClient.query<AuthUser>(
      `
      SELECT id, email, phone, nickname, role, points
      FROM users
      WHERE id = $1 AND is_active = TRUE
      `,
      [session.user_id]
    );
    const user = userResult.rows[0];
    if (!user) {
      fail(res, 401, "UNAUTHORIZED", "User not found");
      return;
    }

    const accessToken = signAccessToken(user);
    success(res, {
      access_token: accessToken,
      expires_in: accessTokenExpiresInSeconds,
      token_subject: payload.sub
    });
  } catch {
    fail(res, 401, "UNAUTHORIZED", "Invalid or expired refresh token");
  }
});

app.post("/v1/auth/logout", async (req, res) => {
  const bodyToken = (req.body as { refresh_token?: string }).refresh_token;
  const cookieToken = req.cookies?.refresh_token as string | undefined;
  const refreshToken = bodyToken ?? cookieToken;
  if (refreshToken) {
    await revokeSessionByToken(refreshToken);
  }
  res.clearCookie("refresh_token");
  success(res, { logged_out: true });
});

app.get("/v1/auth/me", requireAuth, async (req, res) => {
  success(res, (req as AuthedRequest).user);
});

app.get("/v1/models", async (_req, res) => {
  try {
    const models = await loadActiveModels();
    success(res, models);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load models";
    fail(res, 500, "INTERNAL_ERROR", message);
  }
});

app.get("/v1/models/:id", async (req, res) => {
  try {
    const result = await pgClient.query<ModelRegistryRow>(
      `
      SELECT
        id, display_name, vendor, logo_url, official_url,
        prompt_format, supports_neg, param_schema, is_active,
        sort_order, feature_tags
      FROM model_registry
      WHERE id = $1
      LIMIT 1
      `,
      [req.params.id]
    );

    const row = result.rows[0];
    if (!row) {
      fail(res, 404, "NOT_FOUND", "Model not found");
      return;
    }

    const countResult = await pgClient.query<{ count: string }>(
      `SELECT COUNT(*)::TEXT AS count FROM prompts WHERE status = 'approved' AND $1 = ANY(model_ids)`,
      [req.params.id]
    );

    success(res, rowToModelDetail(row, Number(countResult.rows[0]?.count ?? 0)));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load model";
    fail(res, 500, "INTERNAL_ERROR", message);
  }
});

app.post("/v1/models", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user;
  if (user.role !== "admin" && user.role !== "moderator") {
    fail(res, 403, "FORBIDDEN", "Admin role required");
    return;
  }

  const body = (req.body ?? {}) as Partial<ModelDetail>;
  const id = String(body.id ?? "").trim();
  const displayName = String(body.display_name ?? "").trim();
  const vendor = String(body.vendor ?? "").trim();
  if (!id || !displayName || !vendor) {
    fail(res, 400, "BAD_REQUEST", "id, display_name, vendor are required");
    return;
  }

  const promptFormat: ModelDetail["prompt_format"] =
    body.prompt_format === "tag" || body.prompt_format === "hybrid" ? body.prompt_format : "text";
  const supportsNeg = body.supports_neg === true;
  const isActive = body.is_active !== false;
  const sortOrder = Number.isFinite(body.sort_order) ? Number(body.sort_order) : 99;
  const featureTags = Array.isArray(body.feature_tags)
    ? body.feature_tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 12)
    : [];
  const paramSchema = Array.isArray(body.param_schema) ? body.param_schema : [];

  try {
    await pgClient.query(
      `
      INSERT INTO model_registry (
        id, display_name, vendor, logo_url, official_url,
        prompt_format, supports_neg, param_schema, is_active, sort_order, feature_tags
      )
      VALUES ($1,$2,$3,$4,$5,$6::prompt_format,$7,$8::JSONB,$9,$10,$11)
      ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        vendor = EXCLUDED.vendor,
        logo_url = EXCLUDED.logo_url,
        official_url = EXCLUDED.official_url,
        prompt_format = EXCLUDED.prompt_format,
        supports_neg = EXCLUDED.supports_neg,
        param_schema = EXCLUDED.param_schema,
        is_active = EXCLUDED.is_active,
        sort_order = EXCLUDED.sort_order,
        feature_tags = EXCLUDED.feature_tags
      `,
      [
        id,
        displayName,
        vendor,
        body.logo_url ?? null,
        body.official_url ?? null,
        promptFormat,
        supportsNeg,
        JSON.stringify(paramSchema),
        isActive,
        sortOrder,
        featureTags
      ]
    );
    invalidateModelCache();
    success(res, { id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upsert model";
    fail(res, 500, "INTERNAL_ERROR", message);
  }
});

app.get("/v1/prompts", async (req, res) => {
  const startedAt = Date.now();
  const q = String(req.query.q ?? "").trim();
  const modelIds = parseListParam(req.query.model_ids, 8).concat(
    parseListParam(req.query.model_id, 1)
  );
  const styleTags = parseListParam(req.query.style_tags, 8);
  const colorTags = parseListParam(req.query.color_tags, 8);
  const usageTags = parseListParam(req.query.usage_tags, 8);
  const sort = parseSort(req.query.sort);
  const limitRaw = Number(req.query.limit);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(60, Math.floor(limitRaw)) : 24;

  const params: unknown[] = [];
  const conditions: string[] = ["p.status = 'approved'"];

  if (q) {
    params.push(q);
    conditions.push(
      `(p.search_vector @@ plainto_tsquery('simple', $${params.length}) OR LOWER(p.title) LIKE LOWER('%' || $${params.length} || '%'))`
    );
  }

  if (modelIds.length > 0) {
    params.push(modelIds);
    conditions.push(`p.model_ids && $${params.length}::TEXT[]`);
  }

  if (styleTags.length > 0) {
    params.push(styleTags);
    conditions.push(`p.style_tags && $${params.length}::VARCHAR[]`);
  }

  if (colorTags.length > 0) {
    params.push(colorTags);
    conditions.push(`p.color_tags && $${params.length}::VARCHAR[]`);
  }

  if (usageTags.length > 0) {
    params.push(usageTags);
    conditions.push(`p.usage_tags && $${params.length}::VARCHAR[]`);
  }

  const whereSql = conditions.join(" AND ");
  const orderSql = SORT_FIELDS[sort];
  params.push(limit);
  const limitParamIndex = params.length;

  const listResult = await pgClient.query<PromptListRow>(
    `
    SELECT
      p.id,
      p.title,
      LEFT(p.prompt_text, 180) AS excerpt,
      p.model_ids,
      array_to_string(p.model_ids, ' / ') AS model_label,
      p.style_tags,
      p.usage_tags,
      p.color_tags,
      u.nickname AS author,
      p.like_count,
      p.collect_count,
      p.copy_count,
      p.created_at,
      p.status,
      (
        SELECT pi.url
        FROM prompt_images pi
        WHERE pi.prompt_id = p.id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS cover_url
    FROM prompts p
    JOIN users u ON u.id = p.author_id
    WHERE ${whereSql}
    ORDER BY ${orderSql}
    LIMIT $${limitParamIndex}
    `,
    params
  );

  const facetParams = params.slice(0, limitParamIndex - 1);
  const [modelFacets, styleFacets, colorFacets, usageFacets, totalRow] = await Promise.all([
    pgClient.query<SearchFacetBucket>(
      `
      SELECT model AS value, COUNT(*)::INT AS count
      FROM prompts p, UNNEST(p.model_ids) AS model
      WHERE ${whereSql}
      GROUP BY model
      ORDER BY count DESC, model ASC
      LIMIT 12
      `,
      facetParams
    ),
    pgClient.query<SearchFacetBucket>(
      `
      SELECT tag AS value, COUNT(*)::INT AS count
      FROM prompts p, UNNEST(p.style_tags) AS tag
      WHERE ${whereSql}
      GROUP BY tag
      ORDER BY count DESC, tag ASC
      LIMIT 16
      `,
      facetParams
    ),
    pgClient.query<SearchFacetBucket>(
      `
      SELECT tag AS value, COUNT(*)::INT AS count
      FROM prompts p, UNNEST(p.color_tags) AS tag
      WHERE ${whereSql}
      GROUP BY tag
      ORDER BY count DESC, tag ASC
      LIMIT 16
      `,
      facetParams
    ),
    pgClient.query<SearchFacetBucket>(
      `
      SELECT tag AS value, COUNT(*)::INT AS count
      FROM prompts p, UNNEST(p.usage_tags) AS tag
      WHERE ${whereSql}
      GROUP BY tag
      ORDER BY count DESC, tag ASC
      LIMIT 16
      `,
      facetParams
    ),
    pgClient.query<{ total: string }>(
      `SELECT COUNT(*)::TEXT AS total FROM prompts p WHERE ${whereSql}`,
      facetParams
    )
  ]);

  const items = await Promise.all(listResult.rows.map(toPromptListItem));
  const meta: PromptListMeta = {
    total: Number(totalRow.rows[0]?.total ?? items.length),
    took_ms: Date.now() - startedAt,
    sort,
    facets: {
      model_ids: modelFacets.rows,
      style_tags: styleFacets.rows,
      color_tags: colorFacets.rows,
      usage_tags: usageFacets.rows
    }
  };

  success(res, items, meta as unknown as Record<string, unknown>);
});

app.get("/v1/prompts/me", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user;
  const result = await pgClient.query<PromptListRow>(
    `
    SELECT
      p.id,
      p.title,
      LEFT(p.prompt_text, 180) AS excerpt,
      p.model_ids,
      array_to_string(p.model_ids, ' / ') AS model_label,
      p.style_tags,
      p.usage_tags,
      p.color_tags,
      u.nickname AS author,
      p.like_count,
      p.collect_count,
      p.copy_count,
      p.created_at,
      p.status,
      (
        SELECT pi.url
        FROM prompt_images pi
        WHERE pi.prompt_id = p.id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS cover_url
    FROM prompts p
    JOIN users u ON u.id = p.author_id
    WHERE p.author_id = $1
    ORDER BY p.created_at DESC
    LIMIT 100
    `,
    [user.id]
  );

  const items = await Promise.all(result.rows.map(toPromptListItem));
  success(res, items);
});

app.get("/v1/prompts/:id", async (req, res) => {
  const prompt = await getPromptDetail(req.params.id);
  if (!prompt) {
    fail(res, 404, "NOT_FOUND", "Prompt not found");
    return;
  }

  if (prompt.status !== "approved") {
    const user = await getOptionalUser(req);
    const owner = await getPromptOwner(prompt.id);
    if (!user || owner !== user.id) {
      fail(res, 404, "NOT_FOUND", "Prompt not found");
      return;
    }
  }

  success(res, prompt);
});

app.get("/v1/prompts/:id/related", async (req, res) => {
  const targetId = req.params.id;
  const target = await pgClient.query<{ model_ids: string[]; style_tags: string[] }>(
    `SELECT model_ids, style_tags FROM prompts WHERE id = $1 LIMIT 1`,
    [targetId]
  );
  const targetRow = target.rows[0];
  if (!targetRow) {
    fail(res, 404, "NOT_FOUND", "Prompt not found");
    return;
  }

  const result = await pgClient.query<PromptListRow>(
    `
    SELECT
      p.id,
      p.title,
      LEFT(p.prompt_text, 180) AS excerpt,
      p.model_ids,
      array_to_string(p.model_ids, ' / ') AS model_label,
      p.style_tags,
      p.usage_tags,
      p.color_tags,
      u.nickname AS author,
      p.like_count,
      p.collect_count,
      p.copy_count,
      p.created_at,
      p.status,
      (
        SELECT pi.url
        FROM prompt_images pi
        WHERE pi.prompt_id = p.id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS cover_url,
      (
        cardinality(ARRAY(SELECT UNNEST(p.model_ids) INTERSECT SELECT UNNEST($2::TEXT[])))
        + cardinality(ARRAY(SELECT UNNEST(p.style_tags) INTERSECT SELECT UNNEST($3::VARCHAR[])))
      ) AS overlap_score
    FROM prompts p
    JOIN users u ON u.id = p.author_id
    WHERE p.status = 'approved'
      AND p.id <> $1
      AND (
        p.model_ids && $2::TEXT[]
        OR p.style_tags && $3::VARCHAR[]
      )
    ORDER BY overlap_score DESC, p.like_count DESC, p.created_at DESC
    LIMIT 6
    `,
    [targetId, targetRow.model_ids, targetRow.style_tags]
  );

  const items = await Promise.all(result.rows.map(toPromptListItem));
  success(res, items);
});

app.post("/v1/prompts", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user;
  const body = (req.body ?? {}) as CreatePromptInput;
  const title = String(body.title ?? "").trim();
  const promptText = String(body.prompt_text ?? "").trim();
  const negativePrompt = body.negative_prompt?.trim() || null;
  const usageNote = body.usage_note?.trim() || null;
  const modelIds = normalizeStringList(body.model_ids, 3);
  const styleTags = normalizeStringList(body.style_tags, 5);
  const usageTags = normalizeStringList(body.usage_tags, 5);
  const colorTags = normalizeStringList(body.color_tags, 5);
  const paramsJson = normalizeParams(body.params_json);
  const status: Extract<PromptStatus, "draft" | "approved"> =
    body.status === "draft" ? "draft" : "approved";
  const images = Array.isArray(body.images)
    ? body.images
        .map((image) => ({
          url: String(image.url ?? "").trim(),
          thumb_url: image.thumb_url ? String(image.thumb_url).trim() : null,
          width: Number(image.width ?? 1200),
          height: Number(image.height ?? 800),
          file_size: Number(image.file_size ?? 0)
        }))
        .filter((image) => image.url)
        .slice(0, 6)
    : [];

  if (title.length < 4 || promptText.length < 12 || modelIds.length === 0) {
    fail(res, 400, "BAD_REQUEST", "Title, prompt text and model are required");
    return;
  }

  if (styleTags.length === 0) {
    fail(res, 400, "BAD_REQUEST", "At least one style tag is required");
    return;
  }

  if (images.length === 0) {
    fail(res, 400, "BAD_REQUEST", "At least one image URL is required");
    return;
  }

  try {
    await pgClient.query("BEGIN");
    const promptResult = await pgClient.query<{ id: string }>(
      `
      INSERT INTO prompts (
        title,
        prompt_text,
        negative_prompt,
        model_ids,
        style_tags,
        usage_tags,
        color_tags,
        params_json,
        usage_note,
        author_id,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::prompt_status)
      RETURNING id
      `,
      [
        title,
        promptText,
        negativePrompt,
        modelIds,
        styleTags,
        usageTags,
        colorTags,
        paramsJson,
        usageNote,
        user.id,
        status
      ]
    );

    const promptId = promptResult.rows[0]?.id;
    if (!promptId) {
      throw new Error("Failed to create prompt");
    }

    for (const [index, image] of images.entries()) {
      await pgClient.query(
        `
        INSERT INTO prompt_images (prompt_id, url, thumb_url, width, height, file_size, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          promptId,
          image.url,
          image.thumb_url,
          image.width,
          image.height,
          image.file_size,
          index
        ]
      );
    }

    await pgClient.query("COMMIT");
    const created = await getPromptDetail(promptId);
    success(res, created, { status });
  } catch (error) {
    await pgClient.query("ROLLBACK");
    const message = error instanceof Error ? error.message : "Failed to create prompt";
    fail(res, 500, "INTERNAL_ERROR", message);
  }
});

app.post("/v1/prompts/:id/copy", async (req, res) => {
  const result = await pgClient.query<{ copy_count: number }>(
    `
    UPDATE prompts
    SET copy_count = copy_count + 1
    WHERE id = $1
    RETURNING copy_count
    `,
    [req.params.id]
  );

  const row = result.rows[0];
  if (!row) {
    fail(res, 404, "NOT_FOUND", "Prompt not found");
    return;
  }

  success(res, {
    copy_count: row.copy_count
  });
});

app.get("/v1/auth/oauth/:provider", (req, res) => {
  success(res, {
    provider: req.params.provider,
    enabled: false,
    message: "OAuth is reserved for future integration."
  });
});

app.get("/v1/auth/oauth/:provider/callback", (req, res) => {
  success(res, {
    provider: req.params.provider,
    callbackHandled: false,
    message: "OAuth callback is reserved for future integration."
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  fail(res, 500, "INTERNAL_ERROR", message);
});

async function bootstrap() {
  await pgClient.connect();
  if (redisClient) {
    try {
      await redisClient.connect();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("[api] redis unavailable:", message);
    }
  }

  app.listen(port, () => {
    console.log(`[api] listening on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("[api] bootstrap failed", error);
  process.exit(1);
});
