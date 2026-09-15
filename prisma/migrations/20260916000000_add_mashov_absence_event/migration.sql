-- CreateTable
CREATE TABLE "MashovAbsenceEvent" (
    "id" TEXT NOT NULL,
    "mashovKey" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "classCode" TEXT NOT NULL,
    "classNum" INTEGER NOT NULL,
    "subjectName" TEXT NOT NULL,
    "lessonDate" TIMESTAMP(3) NOT NULL,
    "lessonNum" INTEGER NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL,
    "justified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MashovAbsenceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MashovAbsenceEvent_mashovKey_key" ON "MashovAbsenceEvent"("mashovKey");

-- CreateIndex
CREATE INDEX "MashovAbsenceEvent_classCode_classNum_idx" ON "MashovAbsenceEvent"("classCode", "classNum");
