-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "googleReviewUrl" TEXT,
    "tipPresets" TEXT NOT NULL DEFAULT '5,10,15',
    "menuSlug" TEXT,
    "websiteUrl" TEXT,
    "supportedLocales" TEXT NOT NULL DEFAULT 'tr',
    "alertEmail" TEXT,
    "customerOrderingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" DATETIME,
    "monthlyFeeCents" INTEGER,
    "subscriptionNote" TEXT,
    "cardPaymentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "legalName" TEXT,
    "legalAddress" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "subMerchantType" TEXT,
    "ibanNumber" TEXT,
    "taxOffice" TEXT,
    "taxNumber" TEXT,
    "identityNumber" TEXT,
    "subMerchantKey" TEXT,
    "subMerchantSyncedAt" DATETIME,
    "platformCommissionBp" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Branch" ("alertEmail", "cardPaymentEnabled", "contactEmail", "contactPhone", "createdAt", "customerOrderingEnabled", "googleReviewUrl", "id", "legalAddress", "legalName", "menuSlug", "monthlyFeeCents", "name", "subscriptionNote", "subscriptionStatus", "supportedLocales", "tipPresets", "trialEndsAt", "websiteUrl") SELECT "alertEmail", "cardPaymentEnabled", "contactEmail", "contactPhone", "createdAt", "customerOrderingEnabled", "googleReviewUrl", "id", "legalAddress", "legalName", "menuSlug", "monthlyFeeCents", "name", "subscriptionNote", "subscriptionStatus", "supportedLocales", "tipPresets", "trialEndsAt", "websiteUrl" FROM "Branch";
DROP TABLE "Branch";
ALTER TABLE "new_Branch" RENAME TO "Branch";
CREATE UNIQUE INDEX "Branch_menuSlug_key" ON "Branch"("menuSlug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
