import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/brands",
        "/campaigns",
        "/content",
        "/creators",
        "/finance",
        "/live",
        "/login",
        "/overview",
        "/products",
        "/reports",
        "/search",
        "/settings",
        "/tasks",
        "/actions",
        "/api",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
