-- AlterTable
ALTER TABLE "Order" ADD COLUMN "closedBy" TEXT;
ALTER TABLE "Order" ADD COLUMN "openTableKey" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "voidedAt" DATETIME;
ALTER TABLE "Payment" ADD COLUMN "voidedBy" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_openTableKey_key" ON "Order"("openTableKey");


-- Mevcut açık hesapları yeni kısıta uydur (masa başına tek OPEN sipariş).
-- Aynı masada birden fazla OPEN varsa en eskisi kalır, diğerleri kapatılır.
UPDATE "Order" SET "status" = 'CLOSED', "closedAt" = CURRENT_TIMESTAMP
WHERE "status" = 'OPEN' AND "id" NOT IN (
  SELECT MIN("id") FROM "Order" WHERE "status" = 'OPEN' GROUP BY "tableId"
);
UPDATE "Order" SET "openTableKey" = "tableId" WHERE "status" = 'OPEN';
