-- AlterTable
ALTER TABLE "Survey" ADD COLUMN "responseSheetUrl" TEXT;
ALTER TABLE "Survey" ADD COLUMN "lastSyncedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SurveyCompletion" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;
