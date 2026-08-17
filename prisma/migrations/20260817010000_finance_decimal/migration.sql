-- Finance precision (Revisi §2): monetary Float -> Decimal.
-- SQLite has no native Decimal; Prisma maps Decimal to DECIMAL columns and
-- round-trips values through decimal.js at the client layer, so stored sums
-- carry no IEEE-754 artifacts. Values are whole Rupiah and copied verbatim
-- from the old REAL columns (lossless: every stored value is an integer).

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "budget" DECIMAL NOT NULL DEFAULT 0,
    "creatorTarget" INTEGER NOT NULL DEFAULT 0,
    "contentTarget" INTEGER NOT NULL DEFAULT 0,
    "liveTarget" INTEGER NOT NULL DEFAULT 0,
    "gmvTarget" DECIMAL NOT NULL DEFAULT 0,
    "actualGmv" DECIMAL NOT NULL DEFAULT 0,
    "commissionRate" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "notes" TEXT,
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Campaign_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Campaign_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("actualGmv", "agencyId", "brandId", "budget", "commissionRate", "contentTarget", "createdAt", "creatorTarget", "endDate", "externalId", "gmvTarget", "id", "liveTarget", "name", "notes", "ownerId", "startDate", "status", "updatedAt") SELECT "actualGmv", "agencyId", "brandId", "budget", "commissionRate", "contentTarget", "createdAt", "creatorTarget", "endDate", "externalId", "gmvTarget", "id", "liveTarget", "name", "notes", "ownerId", "startDate", "status", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE INDEX "Campaign_agencyId_idx" ON "Campaign"("agencyId");
CREATE INDEX "Campaign_brandId_idx" ON "Campaign"("brandId");
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
CREATE TABLE "new_CampaignCreator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "role" TEXT,
    "fee" DECIMAL NOT NULL DEFAULT 0,
    "gmvContribution" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    CONSTRAINT "CampaignCreator_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CampaignCreator_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CampaignCreator" ("campaignId", "creatorId", "fee", "gmvContribution", "id", "role", "status") SELECT "campaignId", "creatorId", "fee", "gmvContribution", "id", "role", "status" FROM "CampaignCreator";
DROP TABLE "CampaignCreator";
ALTER TABLE "new_CampaignCreator" RENAME TO "CampaignCreator";
CREATE INDEX "CampaignCreator_campaignId_idx" ON "CampaignCreator"("campaignId");
CREATE INDEX "CampaignCreator_creatorId_idx" ON "CampaignCreator"("creatorId");
CREATE TABLE "new_Commission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "campaignId" TEXT,
    "creatorId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "gmv" DECIMAL NOT NULL DEFAULT 0,
    "creatorRate" REAL NOT NULL DEFAULT 0,
    "creatorCommission" DECIMAL NOT NULL DEFAULT 0,
    "agencyShareRate" REAL NOT NULL DEFAULT 0,
    "agencyRevenue" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Commission_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Commission_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Commission_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Commission" ("agencyId", "agencyRevenue", "agencyShareRate", "campaignId", "createdAt", "creatorCommission", "creatorId", "creatorRate", "gmv", "id", "sourceId", "sourceType", "status") SELECT "agencyId", "agencyRevenue", "agencyShareRate", "campaignId", "createdAt", "creatorCommission", "creatorId", "creatorRate", "gmv", "id", "sourceId", "sourceType", "status" FROM "Commission";
DROP TABLE "Commission";
ALTER TABLE "new_Commission" RENAME TO "Commission";
CREATE INDEX "Commission_agencyId_idx" ON "Commission"("agencyId");
CREATE INDEX "Commission_creatorId_idx" ON "Commission"("creatorId");
CREATE TABLE "new_ContentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "productId" TEXT,
    "title" TEXT NOT NULL,
    "brief" TEXT,
    "dueDate" DATETIME,
    "publishDate" DATETIME,
    "contentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Brief',
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "reviewerId" TEXT,
    "notes" TEXT,
    "gmvGenerated" DECIMAL NOT NULL DEFAULT 0,
    "viewsGenerated" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentItem_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ContentItem" ("agencyId", "brief", "campaignId", "contentUrl", "createdAt", "creatorId", "dueDate", "gmvGenerated", "id", "notes", "productId", "publishDate", "reviewerId", "revisionCount", "status", "title", "updatedAt", "viewsGenerated") SELECT "agencyId", "brief", "campaignId", "contentUrl", "createdAt", "creatorId", "dueDate", "gmvGenerated", "id", "notes", "productId", "publishDate", "reviewerId", "revisionCount", "status", "title", "updatedAt", "viewsGenerated" FROM "ContentItem";
DROP TABLE "ContentItem";
ALTER TABLE "new_ContentItem" RENAME TO "ContentItem";
CREATE INDEX "ContentItem_agencyId_idx" ON "ContentItem"("agencyId");
CREATE INDEX "ContentItem_campaignId_idx" ON "ContentItem"("campaignId");
CREATE INDEX "ContentItem_creatorId_idx" ON "ContentItem"("creatorId");
CREATE INDEX "ContentItem_status_idx" ON "ContentItem"("status");
CREATE TABLE "new_CreatorMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" REAL NOT NULL DEFAULT 0,
    "gmv" DECIMAL NOT NULL DEFAULT 0,
    "videos" INTEGER NOT NULL DEFAULT 0,
    "avgViews" INTEGER NOT NULL DEFAULT 0,
    "liveGmv" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "CreatorMetric_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CreatorMetric" ("avgViews", "creatorId", "date", "engagementRate", "followers", "gmv", "id", "liveGmv", "videos") SELECT "avgViews", "creatorId", "date", "engagementRate", "followers", "gmv", "id", "liveGmv", "videos" FROM "CreatorMetric";
DROP TABLE "CreatorMetric";
ALTER TABLE "new_CreatorMetric" RENAME TO "CreatorMetric";
CREATE INDEX "CreatorMetric_creatorId_date_idx" ON "CreatorMetric"("creatorId", "date");
CREATE TABLE "new_CreatorPayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "campaignId" TEXT,
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreatorPayout_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CreatorPayout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CreatorPayout_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CreatorPayout" ("agencyId", "amount", "campaignId", "createdAt", "creatorId", "id", "paidAt", "status") SELECT "agencyId", "amount", "campaignId", "createdAt", "creatorId", "id", "paidAt", "status" FROM "CreatorPayout";
DROP TABLE "CreatorPayout";
ALTER TABLE "new_CreatorPayout" RENAME TO "CreatorPayout";
CREATE INDEX "CreatorPayout_agencyId_idx" ON "CreatorPayout"("agencyId");
CREATE INDEX "CreatorPayout_creatorId_idx" ON "CreatorPayout"("creatorId");
CREATE TABLE "new_LiveMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "liveSessionId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "viewers" INTEGER NOT NULL DEFAULT 0,
    "gmv" DECIMAL NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LiveMetric_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LiveMetric" ("gmv", "id", "liveSessionId", "orders", "timestamp", "viewers") SELECT "gmv", "id", "liveSessionId", "orders", "timestamp", "viewers" FROM "LiveMetric";
DROP TABLE "LiveMetric";
ALTER TABLE "new_LiveMetric" RENAME TO "LiveMetric";
CREATE INDEX "LiveMetric_liveSessionId_idx" ON "LiveMetric"("liveSessionId");
CREATE TABLE "new_LiveSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "campaignId" TEXT,
    "creatorId" TEXT NOT NULL,
    "brandId" TEXT,
    "productId" TEXT,
    "room" TEXT,
    "operatorId" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "targetGmv" DECIMAL NOT NULL DEFAULT 0,
    "actualGmv" DECIMAL NOT NULL DEFAULT 0,
    "viewers" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LiveSession_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LiveSession_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LiveSession_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LiveSession_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LiveSession_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LiveSession_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LiveSession" ("actualGmv", "agencyId", "brandId", "campaignId", "conversionRate", "createdAt", "creatorId", "endTime", "id", "notes", "operatorId", "orders", "productId", "room", "startTime", "status", "targetGmv", "updatedAt", "viewers") SELECT "actualGmv", "agencyId", "brandId", "campaignId", "conversionRate", "createdAt", "creatorId", "endTime", "id", "notes", "operatorId", "orders", "productId", "room", "startTime", "status", "targetGmv", "updatedAt", "viewers" FROM "LiveSession";
DROP TABLE "LiveSession";
ALTER TABLE "new_LiveSession" RENAME TO "LiveSession";
CREATE INDEX "LiveSession_agencyId_idx" ON "LiveSession"("agencyId");
CREATE INDEX "LiveSession_creatorId_idx" ON "LiveSession"("creatorId");
CREATE INDEX "LiveSession_startTime_idx" ON "LiveSession"("startTime");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT,
    "price" DECIMAL NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("agencyId", "brandId", "category", "createdAt", "externalId", "id", "imageUrl", "name", "price", "sku", "status", "updatedAt") SELECT "agencyId", "brandId", "category", "createdAt", "externalId", "id", "imageUrl", "name", "price", "sku", "status", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_agencyId_idx" ON "Product"("agencyId");
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");
CREATE UNIQUE INDEX "Product_agencyId_sku_key" ON "Product"("agencyId", "sku");
CREATE TABLE "new_ProductMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "gmv" DECIMAL NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "units" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductMetric_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductMetric" ("date", "gmv", "id", "orders", "productId", "units") SELECT "date", "gmv", "id", "orders", "productId", "units" FROM "ProductMetric";
DROP TABLE "ProductMetric";
ALTER TABLE "new_ProductMetric" RENAME TO "ProductMetric";
CREATE INDEX "ProductMetric_productId_date_idx" ON "ProductMetric"("productId", "date");
CREATE TABLE "new_Settlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "campaignId" TEXT,
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "dueDate" DATETIME,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Settlement_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Settlement_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Settlement_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Settlement" ("agencyId", "amount", "brandId", "campaignId", "createdAt", "dueDate", "id", "paidAt", "status") SELECT "agencyId", "amount", "brandId", "campaignId", "createdAt", "dueDate", "id", "paidAt", "status" FROM "Settlement";
DROP TABLE "Settlement";
ALTER TABLE "new_Settlement" RENAME TO "Settlement";
CREATE INDEX "Settlement_agencyId_idx" ON "Settlement"("agencyId");
CREATE INDEX "Settlement_brandId_idx" ON "Settlement"("brandId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

