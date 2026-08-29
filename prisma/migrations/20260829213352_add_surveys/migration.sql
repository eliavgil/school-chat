-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "classId" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyCompletion" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Survey_classId_idx" ON "Survey"("classId");

-- CreateIndex
CREATE INDEX "SurveyCompletion_studentId_idx" ON "SurveyCompletion"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyCompletion_surveyId_studentId_key" ON "SurveyCompletion"("surveyId", "studentId");

-- AddForeignKey
ALTER TABLE "SurveyCompletion" ADD CONSTRAINT "SurveyCompletion_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyCompletion" ADD CONSTRAINT "SurveyCompletion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
