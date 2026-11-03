-- Eccellere Advisor: tables for the approved Google Drive library.
-- Run once in phpMyAdmin (SQL tab) on the same database as the site. Safe to run twice.
-- Until it is run, the Advisor still works from tools, services and resources; only the Drive library is unavailable.

CREATE TABLE IF NOT EXISTS `AdvFile` (
    `id` VARCHAR(191) NOT NULL,
    `driveId` VARCHAR(191) NOT NULL,
    `name` TEXT NOT NULL,
    `mime` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'QUARANTINED',
    `reason` TEXT NULL,
    `redactions` INTEGER NOT NULL DEFAULT 0,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdvFile_driveId_key`(`driveId`),
    INDEX `AdvFile_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AdvChunk` (
    `id` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NOT NULL,
    `seq` INTEGER NOT NULL,
    `text` LONGTEXT NOT NULL,

    INDEX `AdvChunk_fileId_seq_idx`(`fileId`, `seq`),
    PRIMARY KEY (`id`),
    CONSTRAINT `AdvChunk_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `AdvFile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
