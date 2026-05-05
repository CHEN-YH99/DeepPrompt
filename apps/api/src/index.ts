import crypto from "node:crypto";
import process from "node:process";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import type { ApiError, ApiSuccess } from "@deepprompt/types";
import { Client } from "pg";
import { createClient, type RedisClientType } from "redis";

dotenv.config({ path: ".env" });

type UserRole = "user" | "creator" | "moderator" | "admin";

type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string;
  role: UserRole;
  points: number;
};

type AuthTokenPayload = {
  sub: string;
  role: UserRole;
  tokenType: "access" | "refresh";
};

const app = express();
const port = Number(process.env.PORT ?? 3010);
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

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    fail(res, 401, "UNAUTHORIZED", "Missing access token");
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload;
    if (payload.tokenType !== "access") {
      fail(res, 401, "UNAUTHORIZED", "Invalid token type");
      return;
    }

    const result = await pgClient.query<AuthUser>(
      `
      SELECT id, email, phone, nickname, role, points
      FROM users
      WHERE id = $1 AND is_active = TRUE
      `,
      [payload.sub]
    );

    const user = result.rows[0];
    if (!user) {
      fail(res, 401, "UNAUTHORIZED", "User not found");
      return;
    }

    (req as Request & { user: AuthUser }).user = user;
    next();
  } catch {
    fail(res, 401, "UNAUTHORIZED", "Invalid or expired access token");
  }
}

app.get("/health", (_req, res) => {
  success(res, {
    ok: true,
    service: "deepprompt-api",
    timestamp: new Date().toISOString()
  });
});

app.post("/v1/auth/register", async (req, res) => {
  const { email, phone, password, nickname } = req.body as {
    email?: string;
    phone?: string;
    password?: string;
    nickname?: string;
  };

  if (!password || password.length < 8) {
    fail(res, 400, "BAD_REQUEST", "Password must be at least 8 characters");
    return;
  }

  if (!nickname || nickname.trim().length < 2) {
    fail(res, 400, "BAD_REQUEST", "Nickname must be at least 2 characters");
    return;
  }

  if (!email && !phone) {
    fail(res, 400, "BAD_REQUEST", "Email or phone is required");
    return;
  }

  const normalizedEmail = email ? email.trim().toLowerCase() : null;
  const normalizedPhone = phone ? phone.trim() : null;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await pgClient.query<AuthUser>(
      `
      INSERT INTO users (email, phone, nickname, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, phone, nickname, role, points
      `,
      [normalizedEmail, normalizedPhone, nickname.trim(), passwordHash]
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
  const result = await pgClient.query<
    AuthUser & { password_hash: string; is_active: boolean }
  >(
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

  await pgClient.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

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
  const authed = (req as Request & { user: AuthUser }).user;
  success(res, authed);
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
