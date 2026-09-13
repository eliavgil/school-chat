-- CreateTable
CREATE TABLE "LessonManualDone" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "markedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonManualDone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonManualDone_lessonId_classId_key" ON "LessonManualDone"("lessonId", "classId");

-- CreateIndex
CREATE INDEX "LessonManualDone_classId_idx" ON "LessonManualDone"("classId");

-- AddForeignKey
ALTER TABLE "LessonManualDone" ADD CONSTRAINT "LessonManualDone_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonManualDone" ADD CONSTRAINT "LessonManualDone_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
