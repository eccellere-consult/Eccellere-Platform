-- Tools marketplace update 1: adds the "consulting practice" column used by the Consulting library.
-- Run once in phpMyAdmin (SQL tab) on the same database where you ran tools_tables.sql. Safe to run twice.
-- Run it BEFORE (or right after) the matching version of the site is deployed; until then the Tools screens will say the tables are not set up.

ALTER TABLE `WsTool` ADD COLUMN IF NOT EXISTS `practice` VARCHAR(191) NULL;
ALTER TABLE `WsImportItem` ADD COLUMN IF NOT EXISTS `practice` VARCHAR(191) NULL;
ALTER TABLE `WsImportItem` ADD COLUMN IF NOT EXISTS `brief` TEXT NULL;
