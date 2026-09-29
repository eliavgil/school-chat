-- CreateTable
CREATE TABLE "SeatingChart" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "rows" JSONB NOT NULL,
    "boardSide" TEXT NOT NULL DEFAULT 'top',
    "doorSide" TEXT NOT NULL DEFAULT 'bottom',
    "roster" JSONB NOT NULL,
    "assignments" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatingChart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeatingChart_classId_idx" ON "SeatingChart"("classId");

-- AddForeignKey
ALTER TABLE "SeatingChart" ADD CONSTRAINT "SeatingChart_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingChart" ADD CONSTRAINT "SeatingChart_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SeatingChart" ENABLE ROW LEVEL SECURITY;
