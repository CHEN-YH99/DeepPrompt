/** @type {import('next').NextConfig} */
const r2PublicHost = process.env.R2_PUBLIC_HOST ?? "";

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "http", hostname: "localhost" },
      ...(r2PublicHost
        ? [{ protocol: "https", hostname: r2PublicHost.replace(/https?:\/\//, "") }]
        : [])
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 30 * 24 * 60 * 60,
    dangerouslyAllowSVG: false
  }
};

export default nextConfig;
