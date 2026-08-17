// Domain constants: roles, permissions, statuses, categories.
// SQLite has no native enums, so these string unions are the source of truth.

// ---------------------------------------------------------------------------
// Roles & permissions (PLAN §16)
// ---------------------------------------------------------------------------

export const ROLES = [
  "owner",
  "admin",
  "account_manager",
  "creator_manager",
  "campaign_manager",
  "live_manager",
  "finance",
  "viewer",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  account_manager: "Account Manager",
  creator_manager: "Creator Manager",
  campaign_manager: "Campaign Manager",
  live_manager: "LIVE Manager",
  finance: "Finance",
  viewer: "Viewer",
};

export const RESOURCES = [
  "creator",
  "brand",
  "campaign",
  "content",
  "live",
  "product",
  "finance",
  "task",
  "report",
  "setting",
  "integration",
] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = "read" | "write" | "manage";
export type Permission = `${Resource}:${Action}` | "*";

// Resource-based permission matrix. Owner/Admin hold "*" (full access).
// The rest follow the examples in PLAN §16 (e.g. Finance: no creator management;
// Creator Manager: no finance write).
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ["*"],
  admin: ["*"],
  account_manager: [
    "creator:read",
    "creator:write",
    "campaign:read",
    "brand:read",
    "product:read",
    "content:read",
    "content:write",
    "live:read",
    "task:read",
    "task:write",
    "report:read",
    "finance:read",
  ],
  creator_manager: [
    "creator:read",
    "creator:write",
    "campaign:read",
    "content:read",
    "content:write",
    "live:read",
    "task:read",
    "task:write",
    "brand:read",
    "product:read",
    "report:read",
  ],
  campaign_manager: [
    "campaign:read",
    "campaign:write",
    "creator:read",
    "brand:read",
    "product:read",
    "content:read",
    "content:write",
    "live:read",
    "task:read",
    "task:write",
    "report:read",
    "finance:read",
  ],
  live_manager: [
    "live:read",
    "live:write",
    "creator:read",
    "campaign:read",
    "brand:read",
    "product:read",
    "task:read",
    "task:write",
    "report:read",
  ],
  finance: [
    "finance:read",
    "finance:write",
    "campaign:read",
    "brand:read",
    "creator:read",
    "product:read",
    "report:read",
    "task:read",
  ],
  viewer: [
    "creator:read",
    "brand:read",
    "campaign:read",
    "content:read",
    "live:read",
    "product:read",
    "finance:read",
    "task:read",
    "report:read",
  ],
};

// ---------------------------------------------------------------------------
// Creator domain (PLAN §6, §7)
// ---------------------------------------------------------------------------

export const CREATOR_CATEGORIES = [
  "Beauty",
  "Fashion",
  "Food & Beverage",
  "Skincare",
  "Tech",
  "Gaming",
  "Travel",
  "Parenting",
  "Fitness",
  "Home & Living",
  "Education",
  "Automotive",
  "Music",
  "Finance",
] as const;

export const CREATOR_HEALTH = ["Healthy", "Watch", "AtRisk", "Inactive"] as const;
export type CreatorHealth = (typeof CREATOR_HEALTH)[number];

export const CREATOR_STATUS = ["Active", "Inactive", "Paused"] as const;
export const PRODUCT_STATUS = ["Active", "Inactive"] as const;

// ---------------------------------------------------------------------------
// Statuses for the remaining modules
// ---------------------------------------------------------------------------

export const BRAND_STATUS = ["Active", "Paused", "Churned"] as const;

export const CAMPAIGN_STATUS = [
  "Draft",
  "Planning",
  "Recruiting",
  "Active",
  "ContentReview",
  "Published",
  "Completed",
  "Reporting",
] as const;

export const CONTENT_STATUS = [
  "Brief",
  "Assigned",
  "WaitingForDraft",
  "DraftSubmitted",
  "Revision",
  "Approved",
  "Scheduled",
  "Published",
  "Rejected",
  "Cancelled",
] as const;

export const LIVE_STATUS = [
  "Scheduled",
  "Preparing",
  "Live",
  "Ended",
  "Cancelled",
  "NeedsReview",
] as const;

export const TASK_STATUS = ["Open", "InProgress", "Done", "Cancelled"] as const;
export const TASK_PRIORITY = ["Low", "Medium", "High", "Urgent"] as const;

export const SETTLEMENT_STATUS = ["Pending", "Paid", "Overdue"] as const;
export const PAYOUT_STATUS = ["Pending", "Paid"] as const;
export const COMMISSION_STATUS = ["Pending", "Calculated", "Settled"] as const;

// ---------------------------------------------------------------------------
// Type guards (statuses arrive as plain strings from forms/URLs)
// ---------------------------------------------------------------------------

export type ContentStatus = (typeof CONTENT_STATUS)[number];
export type LiveStatus = (typeof LIVE_STATUS)[number];
export type TaskStatus = (typeof TASK_STATUS)[number];
export type TaskPriority = (typeof TASK_PRIORITY)[number];

export type BrandStatus = (typeof BRAND_STATUS)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[number];
export type CreatorStatus = (typeof CREATOR_STATUS)[number];
export type ProductStatus = (typeof PRODUCT_STATUS)[number];

export function isBrandStatus(v: string): v is BrandStatus {
  return (BRAND_STATUS as readonly string[]).includes(v);
}
export function isCreatorStatus(v: string): v is CreatorStatus {
  return (CREATOR_STATUS as readonly string[]).includes(v);
}
export function isProductStatus(v: string): v is ProductStatus {
  return (PRODUCT_STATUS as readonly string[]).includes(v);
}
export function isCampaignStatus(v: string): v is CampaignStatus {
  return (CAMPAIGN_STATUS as readonly string[]).includes(v);
}
export function isContentStatus(v: string): v is ContentStatus {
  return (CONTENT_STATUS as readonly string[]).includes(v);
}
export function isLiveStatus(v: string): v is LiveStatus {
  return (LIVE_STATUS as readonly string[]).includes(v);
}
export function isTaskStatus(v: string): v is TaskStatus {
  return (TASK_STATUS as readonly string[]).includes(v);
}
export function isTaskPriority(v: string): v is TaskPriority {
  return (TASK_PRIORITY as readonly string[]).includes(v);
}
