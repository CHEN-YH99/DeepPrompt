export type AppEnv = {
  nodeEnv: string;
  apiPort: number;
  webApiBaseUrl: string;
};

export function readEnv(env: NodeJS.ProcessEnv = process.env): AppEnv {
  return {
    nodeEnv: env.NODE_ENV ?? "development",
    apiPort: Number(env.PORT ?? 3010),
    webApiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3010"
  };
}
