-- AlterTable: add downloadEnabled flag to Asset (defaults to true = downloads allowed)
ALTER TABLE `Asset` ADD COLUMN `downloadEnabled` BOOLEAN NOT NULL DEFAULT TRUE;
