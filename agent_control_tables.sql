-- Agent Control tables. Additive only: creates two NEW tables, changes nothing that exists.
-- Run ONCE in phpMyAdmin (database > SQL tab) BEFORE you merge the matching pull request. Safe to run twice.
-- Until this is run the Agent Marketplace keeps working and simply shows the default wording.

CREATE TABLE IF NOT EXISTS `WsAgentEdit` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `does` TEXT NULL,
    `suppliers` JSON NULL,
    `process` JSON NULL,
    `customers` JSON NULL,
    `refresh` TEXT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WsAgentEdit_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `WsAgentEditLog` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `snapshot` JSON NULL,
    `editedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WsAgentEditLog_slug_version_idx`(`slug`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
