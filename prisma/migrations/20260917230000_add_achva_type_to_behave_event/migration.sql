-- AlterTable
ALTER TABLE "MashovAbsenceEvent" ADD COLUMN "achvaCode" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "MashovAbsenceEvent" ADD COLUMN "achvaName" TEXT NOT NULL DEFAULT 'חיסור';

-- CreateIndex
CREATE INDEX "MashovAbsenceEvent_achvaCode_idx" ON "MashovAbsenceEvent"("achvaCode");
