-- AlterTable
ALTER TABLE "User" ADD COLUMN "widgetToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_widgetToken_key" ON "User"("widgetToken");
