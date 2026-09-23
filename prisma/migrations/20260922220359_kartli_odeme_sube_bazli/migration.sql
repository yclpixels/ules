-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "googleReviewUrl" TEXT,
    "tipPresets" TEXT NOT NULL DEFAULT '5,10,15',
    "cardPaymentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "legalName" TEXT,
    "legalAddress" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT
);
INSERT INTO "new_Branch" ("contactEmail", "contactPhone", "createdAt", "googleReviewUrl", "id", "legalAddress", "legalName", "name", "tipPresets") SELECT "contactEmail", "contactPhone", "createdAt", "googleReviewUrl", "id", "legalAddress", "legalName", "name", "tipPresets" FROM "Branch";
DROP TABLE "Branch";
ALTER TABLE "new_Branch" RENAME TO "Branch";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
