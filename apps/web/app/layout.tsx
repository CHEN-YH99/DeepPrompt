import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "DeepPrompt",
  description:
    "AI 生图 Prompt 社区平台，围绕 GPT-Image-2、Midjourney 与 Banana / BFL Flux 构建浏览、搜索、发布与收藏体验。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
