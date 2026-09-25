-- CreateEnum
CREATE TYPE "SupportKind" AS ENUM ('DEMO', 'SUPPORT');

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" TEXT NOT NULL,
    "kind" "SupportKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT,
    "branchId" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "handledAt" TIMESTAMP(3),
    "handledBy" TEXT,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportRequest_handledAt_createdAt_idx" ON "SupportRequest"("handledAt", "createdAt");

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

