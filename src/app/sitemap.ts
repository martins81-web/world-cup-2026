import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcup2026.example";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/live", "/matches", "/groups", "/third-place", "/bracket", "/teams", "/statistics"].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.8
  }));
}
