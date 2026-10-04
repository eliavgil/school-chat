-- CreateTable
CREATE TABLE "WordleScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guessesUsed" INTEGER NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordleScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WordleScore_userId_idx" ON "WordleScore"("userId");

-- CreateIndex
CREATE INDEX "WordleScore_score_idx" ON "WordleScore"("score");

-- AddForeignKey
ALTER TABLE "WordleScore" ADD CONSTRAINT "WordleScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WordleScore" ENABLE ROW LEVEL SECURITY;
