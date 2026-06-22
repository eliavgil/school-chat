-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isTask" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teacherApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teacherSeenAt" TIMESTAMP(3);

