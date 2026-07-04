-- CreateEnum
CREATE TYPE "IndicatorSource" AS ENUM ('BCB', 'FRED');

-- CreateEnum
CREATE TYPE "IndicatorFrequency" AS ENUM ('DAILY', 'MONTHLY');

-- CreateTable
CREATE TABLE "indicators" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" "IndicatorSource" NOT NULL,
    "sourceSeriesId" TEXT NOT NULL,
    "frequency" "IndicatorFrequency" NOT NULL,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observations" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "refDate" DATE NOT NULL,
    "value" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "anonymousUserId" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_state" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "lastRefDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'idle',

    CONSTRAINT "sync_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "indicators_code_key" ON "indicators"("code");

-- CreateIndex
CREATE INDEX "observations_indicatorId_refDate_idx" ON "observations"("indicatorId", "refDate");

-- CreateIndex
CREATE UNIQUE INDEX "observations_indicatorId_refDate_key" ON "observations"("indicatorId", "refDate");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_anonymousUserId_indicatorId_key" ON "favorites"("anonymousUserId", "indicatorId");

-- CreateIndex
CREATE UNIQUE INDEX "sync_state_indicatorId_key" ON "sync_state"("indicatorId");

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_state" ADD CONSTRAINT "sync_state_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
