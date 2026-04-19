-- AlterTable
ALTER TABLE `admins` ADD COLUMN `two_fa_enabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `two_fa_secret` VARCHAR(255) NULL;
