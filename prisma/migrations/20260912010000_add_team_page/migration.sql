-- CreateTable
CREATE TABLE "TeamFile" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "link" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPost" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamFile_createdById_idx" ON "TeamFile"("createdById");

-- CreateIndex
CREATE INDEX "TeamEvent_createdById_idx" ON "TeamEvent"("createdById");

-- CreateIndex
CREATE INDEX "TeamEvent_date_idx" ON "TeamEvent"("date");

-- CreateIndex
CREATE INDEX "TeamPost_authorId_idx" ON "TeamPost"("authorId");

-- AddForeignKey
ALTER TABLE "TeamFile" ADD CONSTRAINT "TeamFile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamEvent" ADD CONSTRAINT "TeamEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPost" ADD CONSTRAINT "TeamPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
