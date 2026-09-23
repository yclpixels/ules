-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN "acknowledgedAt" DATETIME;
ALTER TABLE "Feedback" ADD COLUMN "acknowledgedBy" TEXT;

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "allergens" TEXT,
    "productId" TEXT NOT NULL,
    CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "googleReviewUrl" TEXT,
    "tipPresets" TEXT NOT NULL DEFAULT '5,10,15',
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
    "contactPhone" TEXT
);
INSERT INTO "new_Branch" ("cardPaymentEnabled", "contactEmail", "contactPhone", "createdAt", "customerOrderingEnabled", "googleReviewUrl", "id", "legalAddress", "legalName", "monthlyFeeCents", "name", "subscriptionNote", "subscriptionStatus", "tipPresets", "trialEndsAt") SELECT "cardPaymentEnabled", "contactEmail", "contactPhone", "createdAt", "customerOrderingEnabled", "googleReviewUrl", "id", "legalAddress", "legalName", "monthlyFeeCents", "name", "subscriptionNote", "subscriptionStatus", "tipPresets", "trialEndsAt" FROM "Branch";
DROP TABLE "Branch";
ALTER TABLE "new_Branch" RENAME TO "Branch";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_locale_key" ON "CategoryTranslation"("categoryId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_productId_locale_key" ON "ProductTranslation"("productId", "locale");
