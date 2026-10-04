-- CreateTable
CREATE TABLE "MastermindScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "guessesUsed" INTEGER NOT NULL,
    "maxGuesses" INTEGER NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MastermindScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MastermindScore_userId_idx" ON "MastermindScore"("userId");

-- CreateIndex
CREATE INDEX "MastermindScore_score_idx" ON "MastermindScore"("score");

-- AddForeignKey
ALTER TABLE "MastermindScore" ADD CONSTRAINT "MastermindScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MastermindScore" ENABLE ROW LEVEL SECURITY;
