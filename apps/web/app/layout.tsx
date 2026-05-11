import type { Metadata } from "next";

import { getDictionary, getLocale } from "@/lib/i18n";
import "./globals.css";

export function generateMetadata(): Metadata {
  const dict = getDictionary();
  return {
    title: dict.common.brand,
    description: dict.home.heroLede
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
      <body>{children}</body>
    </html>
  );
}
