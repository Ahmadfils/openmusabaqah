-- CreateEnum
CREATE TYPE "NewsletterStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED');

-- AlterTable
ALTER TABLE "NewsletterSubscriber"
  ADD COLUMN "status" "NewsletterStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "unsubscribedAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing subscribers, then let Prisma manage updatedAt.
UPDATE "NewsletterSubscriber" SET "consentedAt" = "subscribedAt", "updatedAt" = "subscribedAt";
ALTER TABLE "NewsletterSubscriber" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_status_idx" ON "NewsletterSubscriber"("status");
