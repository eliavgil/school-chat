-- CreateTable
CREATE TABLE "SchoolAssistantLink" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "whenToUse" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolAssistantLink_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SchoolAssistantLink" ENABLE ROW LEVEL SECURITY;
