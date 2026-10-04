-- CreateTable
CREATE TABLE "TriviaDuel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "questionIdsJson" TEXT NOT NULL,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "questionStartedAt" TIMESTAMP(3),
    "revealedAt" TIMESTAMP(3),
    "hostScore" INTEGER NOT NULL DEFAULT 0,
    "guestScore" INTEGER NOT NULL DEFAULT 0,
    "hostAnswerIndex" INTEGER,
    "guestAnswerIndex" INTEGER,
    "hostId" TEXT NOT NULL,
    "guestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriviaDuel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TriviaDuel_code_key" ON "TriviaDuel"("code");

-- CreateIndex
CREATE INDEX "TriviaDuel_hostId_idx" ON "TriviaDuel"("hostId");

-- CreateIndex
CREATE INDEX "TriviaDuel_guestId_idx" ON "TriviaDuel"("guestId");

-- AddForeignKey
ALTER TABLE "TriviaDuel" ADD CONSTRAINT "TriviaDuel_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriviaDuel" ADD CONSTRAINT "TriviaDuel_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TriviaDuel" ENABLE ROW LEVEL SECURITY;
