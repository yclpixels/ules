-- CreateTable
CREATE TABLE "DayClose" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "expectedCashCents" INTEGER NOT NULL,
    "countedCashCents" INTEGER NOT NULL,
    "cardCents" INTEGER NOT NULL,
    "onlineCents" INTEGER NOT NULL,
    "tipCents" INTEGER NOT NULL,
    "note" TEXT,
    "closedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" TEXT NOT NULL,
    CONSTRAINT "DayClose_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DayClose_branchId_date_key" ON "DayClose"("branchId", "date");
