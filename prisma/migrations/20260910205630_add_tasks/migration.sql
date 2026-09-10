-- CreateEnum
CREATE TYPE "TaskImportance" AS ENUM ('RED', 'YELLOW', 'BLUE');

-- CreateTable
CREATE TABLE "PersonalTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT,
    "deadline" TIMESTAMP(3),
    "importance" "TaskImportance" NOT NULL DEFAULT 'BLUE',
    "reminderAt" TIMESTAMP(3),
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffTask" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT,
    "deadline" TIMESTAMP(3),
    "importance" "TaskImportance" NOT NULL DEFAULT 'BLUE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffTaskAssignee" (
    "id" TEXT NOT NULL,
    "staffTaskId" TEXT NOT NULL,
    "teacherLabel" TEXT NOT NULL,
    "userId" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "reminderAt" TIMESTAMP(3),
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StaffTaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonalTask_userId_done_idx" ON "PersonalTask"("userId", "done");

-- CreateIndex
CREATE INDEX "StaffTask_createdById_idx" ON "StaffTask"("createdById");

-- CreateIndex
CREATE INDEX "StaffTaskAssignee_staffTaskId_idx" ON "StaffTaskAssignee"("staffTaskId");

-- CreateIndex
CREATE INDEX "StaffTaskAssignee_userId_idx" ON "StaffTaskAssignee"("userId");

-- AddForeignKey
ALTER TABLE "PersonalTask" ADD CONSTRAINT "PersonalTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTask" ADD CONSTRAINT "StaffTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTaskAssignee" ADD CONSTRAINT "StaffTaskAssignee_staffTaskId_fkey" FOREIGN KEY ("staffTaskId") REFERENCES "StaffTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
