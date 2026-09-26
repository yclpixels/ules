-- Fiş: KDV oranı, fiş numarası, kart bilgisi (son 4 hane)
ALTER TABLE "Product" ADD COLUMN "vatRate" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "OrderItem" ADD COLUMN "vatRate" INTEGER NOT NULL DEFAULT 10;

-- Mevcut hesaplar açılış sırasına göre numaralanır, sonrakiler sıradan devam eder.
ALTER TABLE "Order" ADD COLUMN "receiptNo" SERIAL NOT NULL;
UPDATE "Order" o SET "receiptNo" = r.n
FROM (SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS n FROM "Order") r
WHERE o.id = r.id;
SELECT setval(pg_get_serial_sequence('"Order"', 'receiptNo'), COALESCE(MAX("receiptNo"), 0) + 1, false) FROM "Order";
CREATE UNIQUE INDEX "Order_receiptNo_key" ON "Order"("receiptNo");

ALTER TABLE "Payment" ADD COLUMN "cardLast4" TEXT,
ADD COLUMN "cardAssociation" TEXT,
ADD COLUMN "cardFamily" TEXT;
