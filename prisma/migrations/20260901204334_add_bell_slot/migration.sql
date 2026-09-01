-- CreateTable
CREATE TABLE "BellSlot" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "dayType" TEXT NOT NULL DEFAULT 'רגיל',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BellSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BellSlot_dayType_order_idx" ON "BellSlot"("dayType", "order");
