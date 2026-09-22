-- AlterTable
ALTER TABLE "Student" ADD COLUMN "track" TEXT;
ALTER TABLE "Student" ADD COLUMN "mathUnits" INTEGER;
ALTER TABLE "Student" ADD COLUMN "englishUnits" INTEGER;

-- CreateTable
CREATE TABLE "SchoolKnowledgeDoc" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "extractedFacts" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolKnowledgeDoc_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SchoolKnowledgeDoc" ENABLE ROW LEVEL SECURITY;
