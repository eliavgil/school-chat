-- CreateTable
CREATE TABLE "SchoolAssistantSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "instructions" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolAssistantSettings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SchoolAssistantSettings" ENABLE ROW LEVEL SECURITY;
