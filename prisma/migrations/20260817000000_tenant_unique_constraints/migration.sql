-- Multi-tenant unique constraints (Revisi §3).
-- Replace globally-unique Creator.username with a per-agency compound key so two
-- agencies can each have a creator with the same username without colliding.
-- Also add per-agency uniqueness for Creator.externalId and per-entity uniqueness
-- for Product.sku and CreatorPlatformAccount (platform, handle).

-- DropIndex
DROP INDEX "Creator_username_key";

-- CreateIndex
CREATE UNIQUE INDEX "Creator_agencyId_username_key" ON "Creator"("agencyId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_agencyId_externalId_key" ON "Creator"("agencyId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorPlatformAccount_creatorId_platform_handle_key" ON "CreatorPlatformAccount"("creatorId", "platform", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "Product_agencyId_sku_key" ON "Product"("agencyId", "sku");
