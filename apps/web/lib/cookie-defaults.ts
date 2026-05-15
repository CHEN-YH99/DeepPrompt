const isProduction = process.env.NODE_ENV === "production";

export const COOKIE_SECURE = isProduction;

export const ACCESS_TOKEN_MAX_AGE = 15 * 60;
export const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

type CookieOptions = {
  httpOnly: boolean;
  maxAge: number;
  path: string;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
};

export const ACCESS_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  maxAge: ACCESS_TOKEN_MAX_AGE,
  path: "/",
  sameSite: "lax",
  secure: COOKIE_SECURE
};

export const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  maxAge: SESSION_COOKIE_MAX_AGE,
  path: "/",
  sameSite: "lax",
  secure: COOKIE_SECURE
};

export const CLEAR_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: COOKIE_SECURE,
  maxAge: 0
};
