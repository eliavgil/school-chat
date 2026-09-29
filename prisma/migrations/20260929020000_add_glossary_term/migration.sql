-- CreateTable
CREATE TABLE "GlossaryTerm" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "shortDefinition" TEXT NOT NULL,
    "extendedArticle" TEXT,
    "practiceSlideId" TEXT,
    "lessonSlug" TEXT NOT NULL,
    "lessonTitle" TEXT NOT NULL,
    "lessonOrder" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlossaryTerm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlossaryTerm_key_key" ON "GlossaryTerm"("key");

-- CreateIndex
CREATE INDEX "GlossaryTerm_lessonSlug_idx" ON "GlossaryTerm"("lessonSlug");

ALTER TABLE "GlossaryTerm" ENABLE ROW LEVEL SECURITY;
