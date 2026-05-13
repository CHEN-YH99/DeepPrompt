import type { MetadataRoute } from "next";

const FALLBACK_BASE = "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_BASE).replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/search", "/models", "/prompts"],
        disallow: ["/me", "/publish", "/admin", "/api"]
      }
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base
  };
}
