-- Client approval: adds the approval status to every login.
-- Run ONCE in phpMyAdmin (SQL tab) on the live database, BEFORE you merge and redeploy the matching version of the site.
-- Safe to run twice. Every login that exists today becomes APPROVED automatically, so nobody is locked out.
-- New client sign-ups (after the site is redeployed) start as PENDING until an admin approves them in Admin > Clients.

ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `accountStatus` ENUM('PENDING', 'APPROVED', 'BLOCKED') NOT NULL DEFAULT 'APPROVED';
ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `approvedAt` DATETIME(3) NULL;
ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `approvedBy` VARCHAR(191) NULL;
