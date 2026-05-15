import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import {
  S3Client,
  PutObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
import { Pool } from "pg";
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
const isProduction = process.env.NODE_ENV === "production";
const cookieSecure = isProduction;

function requireSecret(name: string): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(
      `${name} is missing or shorter than 32 chars. Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
    );
  }
  return value;
}

const jwtSecret = requireSecret("JWT_SECRET");
const jwtRefreshSecret = requireSecret("JWT_REFRESH_SECRET");
const accessTokenExpiresInSeconds = 15 * 60;
const refreshTokenExpiresInSeconds = 7 * 24 * 60 * 60;

// ── Captcha (Cloudflare Turnstile) ──────────────────────────────
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY ?? "";
const turnstileDisabled = (process.env.TURNSTILE_DISABLED ?? "false").toLowerCase() === "true";
if (isProduction && !turnstileSecretKey && !turnstileDisabled) {
  throw new Error(
    "TURNSTILE_SECRET_KEY required in production (or TURNSTILE_DISABLED=true to bypass)"
  );
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const pgClient = new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000
});

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
    origin: (process.env.WEB_ORIGIN ?? "http://localhost:3000")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
    credentials: true
  })
);
app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());

function getClientIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0] ?? null;
  }
  return req.ip ?? null;
}

function setPublicCache(res: Response, seconds: number, swr = seconds * 4) {
  res.setHeader(
    "Cache-Control",
    `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${swr}`
  );
}

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req) ?? "unknown";
    const key = `rate:${ip}:${req.path}`;
    const now = Date.now();
    const bucket = rateLimitBuckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("X-RateLimit-Remaining", String(maxRequests - 1));
      next();
      return;
    }
    if (bucket.count >= maxRequests) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      fail(res, 429, "RATE_LIMITED", "Too many requests, slow down");
      return;
    }
    bucket.count += 1;
    res.setHeader("X-RateLimit-Remaining", String(maxRequests - bucket.count));
    next();
  };
}

const generalLimiter = rateLimit(300, 60_000);
const uploadLimiter = rateLimit(10, 60_000);

app.use("/v1/auth", rateLimit(20, 60_000));
app.use("/v1/telemetry", rateLimit(60, 60_000));
app.use(generalLimiter);

let reqCounter = 0;
app.use((req, res, next) => {
  const start = Date.now();
  const reqId = `req-${++reqCounter}`;
  (req as Request & { reqId: string }).reqId = reqId;
  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? "ERROR" : res.statusCode >= 400 ? "WARN" : "INFO";
    if (level !== "INFO" || process.env.LOG_LEVEL === "debug") {
      console.log(
        JSON.stringify({
          level,
          reqId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration,
          ip: getClientIp(req),
          userAgent: (req.headers["user-agent"] ?? "").toString().slice(0, 120)
        })
      );
    }
  });
  next();
});

function success<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  const body: ApiSuccess<T> = { data, meta };
  res.json(body);
}

function generateNickname(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `DT_${suffix}`;
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

function logError(req: Request | undefined, scope: string, error: unknown) {
  const reqId = (req as (Request & { reqId?: string }) | undefined)?.reqId ?? "-";
  console.error(
    JSON.stringify({
      level: "ERROR",
      reqId,
      scope,
      message: error instanceof Error ? error.message : String(error),
      stack: !isProduction && error instanceof Error ? error.stack : undefined
    })
  );
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

// 校验 Cloudflare Turnstile token；未配置 secret 时按 fail-closed 处理。
// dev 环境可设 TURNSTILE_DISABLED=true 绕过；
// 若 dev 未配 secret 且未显式禁用，也自动放行（避免本地开发被卡死）。
// prod 必须配 secret（已在启动时通过 isProduction 校验 fail-fast）。
async function verifyCaptchaToken(token: string | undefined, remoteIp: string | null): Promise<boolean> {
  if (turnstileDisabled) return true;
  if (!turnstileSecretKey) return !isProduction;
  if (!token) return false;

  try {
    const params = new URLSearchParams();
    params.set("secret", turnstileSecretKey);
    params.set("response", token);
    if (remoteIp) params.set("remoteip", remoteIp);

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: params
    });
    if (!response.ok) return false;
    const json = (await response.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
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

function requireRole(...roles: AuthUser["role"][]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await new Promise<void>((resolve) => requireAuth(req, res, () => resolve()));
    const user = (req as AuthedRequest).user;
    if (!user) {
      return;
    }
    if (!roles.includes(user.role)) {
      fail(res, 403, "FORBIDDEN", "Insufficient role");
      return;
    }
    next();
  };
}

// ── Admin audit + rate limit ───────────────────────────────────
// adminRateLimit 按 user.id 分桶（与 IP 级 rateLimit 互补）。必须挂在 requireRole 之后，
// 才能从 req.user 拿到身份；挂在前面会拒绝一切。
const adminRateBuckets = new Map<string, { count: number; resetAt: number }>();

function adminRateLimit(maxRequests = 10, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthedRequest).user;
    const key = `admin:${user.id}:${req.path}`;
    const now = Date.now();
    const bucket = adminRateBuckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      adminRateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    if (bucket.count >= maxRequests) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      fail(res, 429, "RATE_LIMITED", "Admin rate limit exceeded");
      return;
    }
    bucket.count += 1;
    next();
  };
}

// audit_logs 写入是 fire-and-await，但失败仅记录日志、绝不阻塞业务响应。
// payload 需序列化得动；调用方传 plain JSON 即可。
async function writeAuditLog(
  req: Request,
  action: string,
  options: {
    targetType?: string;
    targetId?: string;
    payload?: Record<string, unknown>;
  } = {}
) {
  const user = (req as AuthedRequest).user;
  if (!user) return;
  try {
    await pgClient.query(
      `INSERT INTO audit_logs (actor_id, actor_role, action, target_type, target_id, payload, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        user.id,
        user.role,
        action,
        options.targetType ?? null,
        options.targetId ?? null,
        options.payload ?? {},
        getClientIp(req),
        (req.get("user-agent") ?? "").slice(0, 1024) || null
      ]
    );
  } catch (error) {
    logError(req, "audit_log_write", error);
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

app.get("/health", async (_req, res) => {
  const checks: Record<string, "ok" | "degraded" | "down"> = {};
  try {
    await pgClient.query("SELECT 1");
    checks.database = "ok";
  } catch {
    checks.database = "down";
  }
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.ping();
      checks.redis = "ok";
    } catch {
      checks.redis = "degraded";
    }
  } else {
    checks.redis = "degraded";
  }
  const allOk = checks.database === "ok";
  res.status(allOk ? 200 : 503).json({
    data: {
      ok: allOk,
      service: "deepprompt-api",
      checks,
      timestamp: new Date().toISOString()
    }
  });
});

app.get("/ready", async (_req, res) => {
  try {
    await pgClient.query("SELECT 1");
    res.status(200).json({ data: { ready: true } });
  } catch {
    res.status(503).json({ data: { ready: false } });
  }
});

app.post("/v1/auth/register", async (req, res) => {
  const body = (req.body ?? {}) as RegisterRequest & { invite_code?: string };
  const password = body.password;
  const nickname = body.nickname?.trim() || generateNickname();
  const email = body.email?.trim().toLowerCase() ?? null;
  const phone = body.phone?.trim() ?? null;
  const inviteRequired =
    (process.env.INVITE_REQUIRED ?? "false").toLowerCase() === "true";
  const inviteCode = body.invite_code?.trim();

  if (!password || password.length < 8) {
    fail(res, 400, "BAD_REQUEST", "Password must be at least 8 characters");
    return;
  }

  if (!email && !phone) {
    fail(res, 400, "BAD_REQUEST", "Email or phone is required");
    return;
  }

  let invite: {
    code: string;
    max_uses: number;
    used_count: number;
    expires_at: Date | null;
    disabled_at: Date | null;
  } | null = null;

  if (inviteRequired || (inviteCode && inviteCode.length > 0)) {
    if (!inviteCode) {
      fail(res, 400, "INVITE_REQUIRED", "Invite code is required");
      return;
    }
    const inviteResult = await pgClient.query<{
      code: string;
      max_uses: number;
      used_count: number;
      expires_at: Date | null;
      disabled_at: Date | null;
    }>(
      `SELECT code, max_uses, used_count, expires_at, disabled_at
       FROM invite_codes WHERE code = $1 LIMIT 1`,
      [inviteCode]
    );
    invite = inviteResult.rows[0] ?? null;
    if (!invite) {
      fail(res, 404, "INVITE_NOT_FOUND", "Invite code not found");
      return;
    }
    if (invite.disabled_at) {
      fail(res, 410, "INVITE_DISABLED", "Invite code is disabled");
      return;
    }
    if (invite.expires_at && invite.expires_at.getTime() < Date.now()) {
      fail(res, 410, "INVITE_EXPIRED", "Invite code has expired");
      return;
    }
    if (invite.used_count >= invite.max_uses) {
      fail(res, 410, "INVITE_EXHAUSTED", "Invite code is fully redeemed");
      return;
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const txClient = await pgClient.connect();
  try {
    await txClient.query("BEGIN");
    const result = await txClient.query<AuthUser>(
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
    if (invite) {
      await txClient.query(
        `UPDATE invite_codes SET used_count = used_count + 1 WHERE code = $1`,
        [invite.code]
      );
      await txClient.query(
        `INSERT INTO invite_redemptions (invite_code, user_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [invite.code, user.id]
      );
    }
    await txClient.query("COMMIT");
    success(res, user);
  } catch (error) {
    await txClient.query("ROLLBACK").catch(() => undefined);
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
  } finally {
    txClient.release();
  }
});

app.get("/v1/auth/register", (_req, res) => {
  fail(res, 405, "METHOD_NOT_ALLOWED", "Use POST /v1/auth/register");
});

app.post("/v1/auth/login", async (req, res) => {
  const { account, password, captcha_token: captchaToken } = req.body as {
    account?: string;
    password?: string;
    captcha_token?: string;
  };
  if (!account || !password) {
    fail(res, 400, "BAD_REQUEST", "Account and password are required");
    return;
  }

  const captchaPassed = await verifyCaptchaToken(captchaToken, getClientIp(req));
  if (!captchaPassed) {
    fail(res, 401, "CAPTCHA_REQUIRED", "Captcha verification failed");
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
    secure: cookieSecure,
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

app.get("/v1/models", async (req, res) => {
  try {
    const models = await loadActiveModels();
    setPublicCache(res, 60);
    success(res, models);
  } catch (error) {
    logError(req, "list_models", error);
    fail(res, 500, "INTERNAL_ERROR", "Failed to load models");
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
    logError(req, "get_model", error);
    fail(res, 500, "INTERNAL_ERROR", "Failed to load model");
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
    logError(req, "upsert_model", error);
    fail(res, 500, "INTERNAL_ERROR", "Failed to upsert model");
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

  setPublicCache(res, 30);
  success(res, items, meta as unknown as Record<string, unknown>);
});

app.get("/v1/prompts/me", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user;
  const statusFilter = String(req.query.status ?? "").trim().toLowerCase();
  const allowedStatuses: PromptStatus[] = ["draft", "pending", "approved", "rejected", "archived"];
  const params: unknown[] = [user.id];
  const conditions: string[] = [`p.author_id = $1`];

  if (allowedStatuses.includes(statusFilter as PromptStatus)) {
    params.push(statusFilter);
    conditions.push(`p.status = $${params.length}::prompt_status`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

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
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT 100
    `,
    params
  );

  const items = await Promise.all(result.rows.map(toPromptListItem));
  success(res, items);
});

// admin / moderator 全量列表（关卡 1 / C1.5 拆出）。
// 之前藏在 /v1/prompts/me 里，按 role 切分支，导致接口职责混淆且没有审计与专属限流。
app.get(
  "/v1/admin/prompts",
  requireRole("admin", "moderator"),
  adminRateLimit(),
  async (req, res) => {
    const statusFilter = String(req.query.status ?? "").trim().toLowerCase();
    const allowedStatuses: PromptStatus[] = ["draft", "pending", "approved", "rejected", "archived"];
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (allowedStatuses.includes(statusFilter as PromptStatus)) {
      params.push(statusFilter);
      conditions.push(`p.status = $${params.length}::prompt_status`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT 100
      `,
      params
    );

    const items = await Promise.all(result.rows.map(toPromptListItem));
    await writeAuditLog(req, "admin.prompts.list", {
      payload: { status: statusFilter || null, count: items.length }
    });
    success(res, items);
  }
);

app.get("/v1/prompts/:id", async (req, res) => {
  const prompt = await getPromptDetail(req.params.id);
  if (!prompt) {
    fail(res, 404, "NOT_FOUND", "Prompt not found");
    return;
  }

  const viewer = await getOptionalUser(req);

  if (prompt.status !== "approved") {
    const owner = await getPromptOwner(prompt.id);
    const isPrivileged = viewer?.role === "admin" || viewer?.role === "moderator";
    if (!viewer || (owner !== viewer.id && !isPrivileged)) {
      fail(res, 404, "NOT_FOUND", "Prompt not found");
      return;
    }
  }

  if (viewer) {
    const states = await pgClient.query<{ type: "like" | "collect" }>(
      `SELECT type FROM interactions WHERE user_id = $1 AND prompt_id = $2 AND type IN ('like','collect')`,
      [viewer.id, prompt.id]
    );
    prompt.viewer_liked = states.rows.some((row) => row.type === "like");
    prompt.viewer_collected = states.rows.some((row) => row.type === "collect");
  } else {
    prompt.viewer_liked = false;
    prompt.viewer_collected = false;
  }

  if (!viewer && prompt.status === "approved") {
    setPublicCache(res, 60);
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
  const isPrivileged = user.role === "admin" || user.role === "moderator";
  const requestedStatus = body.status;
  let status: Extract<PromptStatus, "draft" | "pending" | "approved">;
  if (requestedStatus === "draft") {
    status = "draft";
  } else if (requestedStatus === "approved" && isPrivileged) {
    status = "approved";
  } else {
    status = "pending";
  }
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

  const txClient = await pgClient.connect();
  try {
    await txClient.query("BEGIN");
    const promptResult = await txClient.query<{ id: string }>(
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
      await txClient.query(
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

    await txClient.query("COMMIT");
    const created = await getPromptDetail(promptId);
    success(res, created, { status });
  } catch (error) {
    await txClient.query("ROLLBACK").catch(() => undefined);
    const reqId = (req as Request & { reqId?: string }).reqId ?? "-";
    console.error(JSON.stringify({
      level: "ERROR",
      reqId,
      scope: "create_prompt",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }));
    fail(res, 500, "INTERNAL_ERROR", "Failed to create prompt");
  } finally {
    txClient.release();
  }
});

app.post("/v1/prompts/:id/copy", async (req, res) => {
  const promptId = req.params.id;
  const viewer = await getOptionalUser(req);

  const result = await pgClient.query<{ copy_count: number }>(
    `
    UPDATE prompts
    SET copy_count = copy_count + 1
    WHERE id = $1
    RETURNING copy_count
    `,
    [promptId]
  );

  const row = result.rows[0];
  if (!row) {
    fail(res, 404, "NOT_FOUND", "Prompt not found");
    return;
  }

  if (viewer) {
    try {
      await pgClient.query(
        `INSERT INTO interactions (user_id, prompt_id, type) VALUES ($1, $2, 'copy')`,
        [viewer.id, promptId]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("[api] failed to log copy interaction:", message);
    }
  }

  success(res, {
    copy_count: row.copy_count
  });
});

async function applyInteraction(
  promptId: string,
  userId: string,
  type: "like" | "collect",
  action: "add" | "remove"
) {
  const countColumn = type === "like" ? "like_count" : "collect_count";
  if (action === "add") {
    const result = await pgClient.query<{ count: string; total: number }>(
      `
      WITH ins AS (
        INSERT INTO interactions (user_id, prompt_id, type)
        VALUES ($1, $2, $3::interaction_type)
        ON CONFLICT (user_id, prompt_id, type) WHERE type IN ('like','collect')
        DO NOTHING
        RETURNING 1
      )
      UPDATE prompts
      SET ${countColumn} = ${countColumn} + (SELECT COUNT(*) FROM ins)::INT
      WHERE id = $2
      RETURNING ${countColumn} AS total, (SELECT COUNT(*) FROM ins)::TEXT AS count
      `,
      [userId, promptId, type]
    );
    return result.rows[0] ?? null;
  }

  const result = await pgClient.query<{ count: string; total: number }>(
    `
    WITH del AS (
      DELETE FROM interactions
      WHERE user_id = $1 AND prompt_id = $2 AND type = $3::interaction_type
      RETURNING 1
    )
    UPDATE prompts
    SET ${countColumn} = GREATEST(0, ${countColumn} - (SELECT COUNT(*) FROM del)::INT)
    WHERE id = $2
    RETURNING ${countColumn} AS total, (SELECT COUNT(*) FROM del)::TEXT AS count
    `,
    [userId, promptId, type]
  );
  return result.rows[0] ?? null;
}

async function ensureApprovedPromptExists(promptId: string) {
  const result = await pgClient.query<{ status: PromptStatus }>(
    `SELECT status FROM prompts WHERE id = $1 LIMIT 1`,
    [promptId]
  );
  return result.rows[0] ?? null;
}

app.post("/v1/prompts/:id/like", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user;
  const promptId = String(req.params.id ?? "");
  const target = await ensureApprovedPromptExists(promptId);
  if (!target) {
    fail(res, 404, "NOT_FOUND", "Prompt not found");
    return;
  }
  const outcome = await applyInteraction(promptId, user.id, "like", "add");
  success(res, { like_count: outcome?.total ?? 0, changed: outcome?.count !== "0" });
});

app.delete("/v1/prompts/:id/like", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user;
  const promptId = String(req.params.id ?? "");
  const outcome = await applyInteraction(promptId, user.id, "like", "remove");
  success(res, { like_count: outcome?.total ?? 0, changed: outcome?.count !== "0" });
});

app.post("/v1/prompts/:id/collect", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user;
  const promptId = String(req.params.id ?? "");
  const target = await ensureApprovedPromptExists(promptId);
  if (!target) {
    fail(res, 404, "NOT_FOUND", "Prompt not found");
    return;
  }
  const outcome = await applyInteraction(promptId, user.id, "collect", "add");
  success(res, { collect_count: outcome?.total ?? 0, changed: outcome?.count !== "0" });
});

app.delete("/v1/prompts/:id/collect", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user;
  const promptId = String(req.params.id ?? "");
  const outcome = await applyInteraction(promptId, user.id, "collect", "remove");
  success(res, { collect_count: outcome?.total ?? 0, changed: outcome?.count !== "0" });
});

const MODERATION_TRANSITIONS: Record<string, PromptStatus> = {
  approve: "approved",
  reject: "rejected",
  archive: "archived",
  repend: "pending"
};

app.post(
  "/v1/prompts/:id/moderate",
  requireRole("admin", "moderator"),
  adminRateLimit(),
  async (req, res) => {
    const action = String((req.body as { action?: string })?.action ?? "").toLowerCase();
    const nextStatus = MODERATION_TRANSITIONS[action];
    if (!nextStatus) {
      fail(res, 400, "BAD_REQUEST", "Unknown moderation action");
      return;
    }

    const promptId = String(req.params.id ?? "");
    const result = await pgClient.query<{ status: PromptStatus }>(
      `
      UPDATE prompts
      SET status = $2::prompt_status, updated_at = NOW()
      WHERE id = $1
      RETURNING status
      `,
      [promptId, nextStatus]
    );
    const row = result.rows[0];
    if (!row) {
      fail(res, 404, "NOT_FOUND", "Prompt not found");
      return;
    }

    if (redisClient) {
      try {
        await redisClient.publish(
          "moderation:events",
          JSON.stringify({ promptId, status: nextStatus, ts: Date.now() })
        );
      } catch (error) {
        console.warn(
          "[api] moderation event publish failed:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    await writeAuditLog(req, "admin.prompts.moderate", {
      targetType: "prompt",
      targetId: promptId,
      payload: { action, next_status: nextStatus }
    });
    success(res, { id: promptId, status: row.status });
  }
);

app.get(
  "/v1/admin/moderation",
  requireRole("admin", "moderator"),
  adminRateLimit(),
  async (req, res) => {
    const statusFilter = String(req.query.status ?? "pending").trim().toLowerCase();
    const allowed: PromptStatus[] = ["pending", "approved", "rejected", "archived"];
    const target = (allowed.includes(statusFilter as PromptStatus) ? statusFilter : "pending") as PromptStatus;

    const list = await pgClient.query<PromptListRow>(
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
      WHERE p.status = $1::prompt_status
      ORDER BY p.created_at ASC
      LIMIT 50
      `,
      [target]
    );

    const counts = await pgClient.query<{ status: PromptStatus; count: string }>(
      `SELECT status, COUNT(*)::TEXT AS count FROM prompts GROUP BY status`
    );
    const summary: Record<PromptStatus, number> = {
      draft: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      archived: 0
    };
    for (const row of counts.rows) {
      summary[row.status] = Number(row.count);
    }

    const items = await Promise.all(list.rows.map(toPromptListItem));
    await writeAuditLog(req, "admin.moderation.list", {
      payload: { status: target, count: items.length }
    });
    success(res, items, { status: target, summary } as unknown as Record<string, unknown>);
  }
);

app.get("/v1/me/collections", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user;
  const result = await pgClient.query<PromptListRow & { collected_at: Date }>(
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
      i.created_at AS collected_at,
      (
        SELECT pi.url
        FROM prompt_images pi
        WHERE pi.prompt_id = p.id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS cover_url
    FROM interactions i
    JOIN prompts p ON p.id = i.prompt_id
    JOIN users u ON u.id = p.author_id
    WHERE i.user_id = $1 AND i.type = 'collect'
    ORDER BY i.created_at DESC
    LIMIT 100
    `,
    [user.id]
  );

  const items = await Promise.all(
    result.rows.map(async (row) => {
      const base = await toPromptListItem(row);
      return { ...base, collected_at: row.collected_at.toISOString() };
    })
  );
  success(res, items);
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

type TelemetryBody = {
  kind?: "event" | "error";
  name?: string;
  session_id?: string;
  route?: string;
  payload?: Record<string, unknown>;
};

app.post("/v1/telemetry", async (req, res) => {
  const body = (req.body ?? {}) as TelemetryBody;
  const kind = body.kind === "error" ? "error" : "event";
  const name = (body.name ?? "").trim().slice(0, 96);
  if (!name) {
    fail(res, 400, "BAD_REQUEST", "Telemetry name is required");
    return;
  }
  const route = (body.route ?? "").trim().slice(0, 255) || null;
  const sessionId = (body.session_id ?? "").trim().slice(0, 64) || null;
  const userAgent = (req.headers["user-agent"] ?? "").toString().slice(0, 512) || null;
  const viewer = await getOptionalUser(req);
  const payload =
    body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
      ? body.payload
      : {};

  try {
    await pgClient.query(
      `INSERT INTO telemetry_events (kind, name, user_id, session_id, route, payload, user_agent, ip_address)
       VALUES ($1::telemetry_kind, $2, $3, $4, $5, $6::JSONB, $7, $8)`,
      [
        kind,
        name,
        viewer?.id ?? null,
        sessionId,
        route,
        JSON.stringify(payload),
        userAgent,
        getClientIp(req)
      ]
    );
    if (kind === "error") {
      console.warn(`[telemetry] error ${name} @ ${route ?? "?"}`, payload);
    }
    res.status(202).json({ data: { accepted: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to log event";
    console.warn("[telemetry] insert failed:", message);
    res.status(202).json({ data: { accepted: false } });
  }
});

app.get(
  "/v1/admin/telemetry/summary",
  requireRole("admin", "moderator"),
  adminRateLimit(),
  async (req, res) => {
    const result = await pgClient.query<{
      kind: "event" | "error";
      name: string;
      count: string;
    }>(
      `SELECT kind, name, COUNT(*)::TEXT AS count
       FROM telemetry_events
       WHERE occurred_at > NOW() - INTERVAL '7 days'
       GROUP BY kind, name
       ORDER BY COUNT(*) DESC
       LIMIT 50`
    );
    await writeAuditLog(req, "admin.telemetry.summary", {
      payload: { count: result.rows.length }
    });
    success(res, result.rows.map((row) => ({ ...row, count: Number(row.count) })));
  }
);

function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "DP-";
  for (let i = 0; i < 8; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "X";
  }
  return out;
}

app.post(
  "/v1/invites",
  requireRole("admin", "moderator"),
  adminRateLimit(),
  async (req, res) => {
    const body = (req.body ?? {}) as {
      max_uses?: number;
      expires_in_days?: number;
      note?: string;
    };
    const maxUses = Number.isFinite(body.max_uses)
      ? Math.min(1000, Math.max(1, Math.floor(body.max_uses!)))
      : 1;
    const expiresAt =
      Number.isFinite(body.expires_in_days) && body.expires_in_days! > 0
        ? new Date(Date.now() + body.expires_in_days! * 24 * 60 * 60 * 1000)
        : null;
    const note = (body.note ?? "").trim().slice(0, 255) || null;
    const code = generateInviteCode();
    const user = (req as AuthedRequest).user;
    const result = await pgClient.query<{
      code: string;
      max_uses: number;
      used_count: number;
      note: string | null;
      expires_at: Date | null;
      created_at: Date;
    }>(
      `INSERT INTO invite_codes (code, created_by, max_uses, note, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING code, max_uses, used_count, note, expires_at, created_at`,
      [code, user.id, maxUses, note, expiresAt]
    );
    const row = result.rows[0]!;
    await writeAuditLog(req, "admin.invites.create", {
      targetType: "invite",
      targetId: row.code,
      payload: { max_uses: row.max_uses, expires_at: row.expires_at, has_note: Boolean(note) }
    });
    success(res, {
      code: row.code,
      max_uses: row.max_uses,
      used_count: row.used_count,
      note: row.note,
      expires_at: row.expires_at ? row.expires_at.toISOString() : null,
      created_at: row.created_at.toISOString()
    });
  }
);

app.get(
  "/v1/invites",
  requireRole("admin", "moderator"),
  adminRateLimit(),
  async (req, res) => {
    const result = await pgClient.query<{
      code: string;
      max_uses: number;
      used_count: number;
      note: string | null;
      expires_at: Date | null;
      disabled_at: Date | null;
      created_at: Date;
    }>(
      `SELECT code, max_uses, used_count, note, expires_at, disabled_at, created_at
       FROM invite_codes ORDER BY created_at DESC LIMIT 100`
    );
    await writeAuditLog(req, "admin.invites.list", {
      payload: { count: result.rows.length }
    });
    success(
      res,
      result.rows.map((row) => ({
        code: row.code,
        max_uses: row.max_uses,
        used_count: row.used_count,
        note: row.note,
        expires_at: row.expires_at ? row.expires_at.toISOString() : null,
        disabled_at: row.disabled_at ? row.disabled_at.toISOString() : null,
        created_at: row.created_at.toISOString()
      }))
    );
  }
);

app.get("/v1/invites/:code/check", async (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const result = await pgClient.query<{
    code: string;
    max_uses: number;
    used_count: number;
    expires_at: Date | null;
    disabled_at: Date | null;
  }>(
    `SELECT code, max_uses, used_count, expires_at, disabled_at
     FROM invite_codes WHERE code = $1 LIMIT 1`,
    [code]
  );
  const row = result.rows[0];
  if (!row) {
    fail(res, 404, "INVITE_NOT_FOUND", "Invite code not found");
    return;
  }
  const expired =
    !!row.disabled_at ||
    (row.expires_at !== null && row.expires_at.getTime() < Date.now()) ||
    row.used_count >= row.max_uses;
  success(res, {
    code: row.code,
    valid: !expired,
    remaining: Math.max(0, row.max_uses - row.used_count),
    expires_at: row.expires_at ? row.expires_at.toISOString() : null
  });
});

// ── R2 / S3 presign upload ──────────────────────────────────────────

const r2AccountId = process.env.R2_ACCOUNT_ID ?? "";
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
const r2BucketName = process.env.R2_BUCKET_NAME ?? "deepprompt-assets";
const r2PublicUrl = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

let s3Client: S3Client | null = null;
if (r2AccountId && r2AccessKeyId && r2SecretAccessKey) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey
    }
  });
  console.log("[api] R2 client initialized for bucket:", r2BucketName);
} else {
  console.warn("[api] R2 credentials not set — presign upload unavailable, falling back to local disk");
}

app.post("/v1/uploads/presign", requireAuth, uploadLimiter, async (req, res) => {
  if (!s3Client) {
    fail(res, 501, "NOT_CONFIGURED", "Cloud storage is not configured on this server");
    return;
  }
  const body = (req.body ?? {}) as { filename?: string; content_type?: string };
  const filename = (body.filename ?? "").trim();
  const contentType = (body.content_type ?? "image/jpeg").trim();
  if (!filename) {
    fail(res, 400, "BAD_REQUEST", "filename is required");
    return;
  }
  const ext = path.extname(filename).toLowerCase();
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
  if (!allowedExts.includes(ext)) {
    fail(res, 400, "BAD_REQUEST", "Only jpg, png, webp images are allowed");
    return;
  }
  const key = `raw/${crypto.randomUUID()}${ext}`;
  try {
    const url = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        ContentType: contentType
      }),
      { expiresIn: 600 }
    );
    const publicUrl = r2PublicUrl ? `${r2PublicUrl}/${key}` : null;
    success(res, { uploadUrl: url, key, publicUrl, expiresIn: 600 });
  } catch (error) {
    logError(req, "presign_upload", error);
    fail(res, 500, "PRESIGN_ERROR", "Failed to generate presigned URL");
  }
});

app.post("/v1/uploads/confirm/:key", requireAuth, async (req, res) => {
  const key = req.params.key;
  if (!key || !key.startsWith("raw/")) {
    fail(res, 400, "BAD_REQUEST", "Invalid upload key");
    return;
  }
  const publicUrl = r2PublicUrl ? `${r2PublicUrl}/${key}` : null;
  const thumbKey = key.replace("raw/", "thumb/");
  const thumbUrl = r2PublicUrl ? `${r2PublicUrl}/${thumbKey}` : null;
  success(res, {
    key,
    url: publicUrl,
    thumbUrl,
    status: "confirmed",
    message: "Image processing (WebP + thumbnail) will run asynchronously in production."
  });
});

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  logError(req, "unhandled_exception", error);
  const reqId = (req as Request & { reqId?: string }).reqId ?? "-";
  const body: ApiError = {
    error: {
      code: "INTERNAL_ERROR",
      message: isProduction ? "Internal server error" : (error instanceof Error ? error.message : "Unknown error")
    }
  };
  res.status(500).json({ ...body, reqId });
});

async function bootstrap() {
  // pg.Pool 是 lazy 连接池，无需显式 connect。
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
