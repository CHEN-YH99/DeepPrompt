import type { MetadataRoute } from "next";

import { fetchModels, fetchPromptRecords } from "@/lib/data";

const FALLBACK_BASE = "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_BASE).replace(/\/$/, "");
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/publish`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.3 }
  ];

  const [prompts, models] = await Promise.all([
    fetchPromptRecords({ limit: 200 }).catch(() => []),
    fetchModels().catch(() => [])
  ]);

  const promptEntries: MetadataRoute.Sitemap = prompts.map((prompt) => ({
    url: `${base}/prompts/${prompt.id}`,
    lastModified: prompt.createdAt ? new Date(prompt.createdAt) : now,
    changeFrequency: "weekly",
    priority: 0.8
  }));

  const modelEntries: MetadataRoute.Sitemap = models.map((model) => ({
    url: `${base}/models/${model.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7
  }));

  return [...staticEntries, ...promptEntries, ...modelEntries];
}
