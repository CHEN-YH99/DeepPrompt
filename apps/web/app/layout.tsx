import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { CacheSyncProvider } from "@/components/cache-sync-provider";
import { PageTransitionLoader } from "@/components/page-transition-loader";
import { ScrollStateProvider } from "@/components/scroll-state-provider";
import { Shell } from "@/components/shell";
import { TelemetryProvider } from "@/components/telemetry-provider";
import { ToastProvider } from "@/components/toast-provider";
import { getDictionary, getLocale } from "@/lib/i18n";
import "./globals.css";
import "./typewriter.css";
import "./prompt-card.css";

const TypewriterHeadline = dynamic(
  () => import("@/components/typewriter-headline").then((m) => m.TypewriterHeadline)
);

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
        <ToastProvider>
          <Shell>{children}</Shell>
        </ToastProvider>
        <PageTransitionLoader />
        <TelemetryProvider />
        <CacheSyncProvider />
        <ScrollStateProvider />
        <TypewriterHeadline />
      </body>
    </html>
  );
}
