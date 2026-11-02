-- Tools marketplace tables. Additive only: creates four new tables, changes nothing that exists.
-- Run once in phpMyAdmin (database > SQL tab) before the Tools section is used. Safe to run twice.

CREATE TABLE IF NOT EXISTS `WsTool` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `groupName` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `source` VARCHAR(191) NOT NULL DEFAULT 'ai',
    `does` TEXT NULL,
    `whenToUse` TEXT NULL,
    `whenNotToUse` TEXT NULL,
    `definition` JSON NOT NULL,
    `quality` JSON NULL,
    `provenance` JSON NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WsTool_slug_key`(`slug`),
    INDEX `WsTool_status_category_idx`(`status`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `WsFillin` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `toolSlug` VARCHAR(191) NOT NULL,
    `caseId` INTEGER NOT NULL DEFAULT 0,
    `fields` JSON NOT NULL,
    `recommendations` JSON NULL,
    `actionables` JSON NULL,
    `analysis` JSON NULL,
    `analysisFingerprint` VARCHAR(191) NULL,
    `analysisAt` DATETIME(3) NULL,
    `previousFields` JSON NULL,
    `previousReason` VARCHAR(191) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WsFillin_userId_toolSlug_caseId_key`(`userId`, `toolSlug`, `caseId`),
    INDEX `WsFillin_userId_updatedAt_idx`(`userId`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `WsImportJob` (
    `id` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'RUNNING',
    `pauseReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WsImportJob_createdById_createdAt_idx`(`createdById`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `WsImportItem` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `groupName` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'QUEUED',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `claimedAt` DATETIME(3) NULL,
    `error` TEXT NULL,
    `toolId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WsImportItem_jobId_status_idx`(`jobId`, `status`),
    PRIMARY KEY (`id`),
    CONSTRAINT `WsImportItem_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `WsImportJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
