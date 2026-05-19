/** @type {import('next').NextConfig} */
const r2PublicHost = process.env.R2_PUBLIC_HOST ?? "";

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "http", hostname: "localhost" },
      // R2 公共桶（pub-xxx.r2.dev）默认放行，避免必须配 R2_PUBLIC_HOST
      { protocol: "https", hostname: "*.r2.dev" },
      // R2 自定义域名通配（assets.example.com 之类）
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      ...(r2PublicHost
        ? [{ protocol: "https", hostname: r2PublicHost.replace(/https?:\/\//, "") }]
        : [])
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    minimumCacheTTL: 30 * 24 * 60 * 60,
    dangerouslyAllowSVG: false
  }
};

export default nextConfig;
