-- AlterTable
ALTER TABLE "TeacherTask" ADD COLUMN "perStudent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TeacherTaskCheck" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherTaskCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherTaskCheck_taskId_studentId_key" ON "TeacherTaskCheck"("taskId", "studentId");

-- CreateIndex
CREATE INDEX "TeacherTaskCheck_taskId_idx" ON "TeacherTaskCheck"("taskId");

-- AddForeignKey
ALTER TABLE "TeacherTaskCheck" ADD CONSTRAINT "TeacherTaskCheck_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TeacherTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeacherTaskCheck" ENABLE ROW LEVEL SECURITY;

-- CreateTable
CREATE TABLE "StudentChecklistMark" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentChecklistMark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentChecklistMark_studentId_key" ON "StudentChecklistMark"("studentId");

-- CreateIndex
CREATE INDEX "StudentChecklistMark_classId_idx" ON "StudentChecklistMark"("classId");

ALTER TABLE "StudentChecklistMark" ENABLE ROW LEVEL SECURITY;

-- CreateEnum
CREATE TYPE "RequestUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- CreateTable
CREATE TABLE "CoordinatorRequest" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "urgency" "RequestUrgency" NOT NULL DEFAULT 'NORMAL',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoordinatorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoordinatorRequest_classId_done_idx" ON "CoordinatorRequest"("classId", "done");

-- CreateIndex
CREATE INDEX "CoordinatorRequest_createdById_idx" ON "CoordinatorRequest"("createdById");

-- AddForeignKey
ALTER TABLE "CoordinatorRequest" ADD CONSTRAINT "CoordinatorRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CoordinatorRequest" ENABLE ROW LEVEL SECURITY;
