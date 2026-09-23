-- CreateTable
CREATE TABLE "SchoolAssistantEscalation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "askerName" TEXT NOT NULL,
    "askerRole" TEXT NOT NULL,
    "className" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolAssistantEscalation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SchoolAssistantEscalation" ENABLE ROW LEVEL SECURITY;
