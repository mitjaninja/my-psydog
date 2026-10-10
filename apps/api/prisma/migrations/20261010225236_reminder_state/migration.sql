-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "lastReminderAt" TIMESTAMP(3),
ADD COLUMN     "remindersPausedAt" TIMESTAMP(3);
