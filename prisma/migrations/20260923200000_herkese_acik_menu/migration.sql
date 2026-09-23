-- AlterTable
ALTER TABLE "Branch" ADD COLUMN "menuSlug" TEXT;
ALTER TABLE "Branch" ADD COLUMN "websiteUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Branch_menuSlug_key" ON "Branch"("menuSlug");
