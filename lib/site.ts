export const siteName = "Agency OS";

export const siteDescription =
  "TikTok Shop agency management for creator rosters, brand campaigns, LIVE operations, commissions, and finance workflows.";

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  return normalizeUrl(configuredUrl || "http://localhost:3000");
}
