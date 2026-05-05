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
