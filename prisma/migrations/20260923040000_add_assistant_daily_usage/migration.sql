-- CreateTable
CREATE TABLE "AssistantDailyUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AssistantDailyUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssistantDailyUsage_userId_date_key" ON "AssistantDailyUsage"("userId", "date");

ALTER TABLE "AssistantDailyUsage" ENABLE ROW LEVEL SECURITY;
