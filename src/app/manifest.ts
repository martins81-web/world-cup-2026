import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "World Cup 2026",
    short_name: "WC 2026",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f2",
    theme_color: "#16211f"
  };
}
