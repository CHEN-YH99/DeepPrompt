import type { Metadata } from "next";

import { CacheSyncProvider } from "@/components/cache-sync-provider";
import { ScrollStateProvider } from "@/components/scroll-state-provider";
import { Shell } from "@/components/shell";
import { TelemetryProvider } from "@/components/telemetry-provider";
import { TypewriterHeadline } from "@/components/typewriter-headline";
import { getDictionary, getLocale } from "@/lib/i18n";
import "./globals.css";

const FALLBACK_BASE = "http://localhost:3000";

export function generateMetadata(): Metadata {
  const dict = getDictionary();
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_BASE).replace(/\/$/, "");
  const title = dict.common.brand;
  const description = dict.home.heroLede;
  return {
    metadataBase: new URL(base),
    title: {
      default: title,
      template: `%s · ${title}`
    },
    description,
    applicationName: title,
    keywords: [
      "AI Prompt",
      "Prompt 社区",
      "Midjourney",
      "GPT-Image-2",
      "Stable Diffusion",
      "Flux",
      "Deeprompt"
    ],
    openGraph: {
      type: "website",
      siteName: title,
      title,
      description,
      url: base,
      locale: getLocale()
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    },
    robots: {
      index: true,
      follow: true
    },
    alternates: {
      canonical: base
    }
  };
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocale();
  return (
    <html lang={locale}>
      <body>
        <Shell>{children}</Shell>
        <TelemetryProvider />
        <CacheSyncProvider />
        <ScrollStateProvider />
        <TypewriterHeadline />
      </body>
    </html>
  );
}
