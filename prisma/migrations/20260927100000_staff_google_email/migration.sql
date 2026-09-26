-- AlterTable
ALTER TABLE "StaffUser" ADD COLUMN     "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_email_key" ON "StaffUser"("email");

