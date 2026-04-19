/*
  Warnings:

  - You are about to drop the column `backgroundImage` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `features` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `instructions` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isNew` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `systemRequirements` on the `products` table. All the data in the column will be lost.
  - Added the required column `price_rub` to the `product_variants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_usd` to the `product_variants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regions` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subscriptionTypes` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `games` DROP COLUMN `backgroundImage`,
    ADD COLUMN `image` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `product_variants` DROP COLUMN `currency`,
    DROP COLUMN `price`,
    ADD COLUMN `price_rub` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `price_usd` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `stock` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `products` DROP COLUMN `description`,
    DROP COLUMN `features`,
    DROP COLUMN `icon`,
    DROP COLUMN `image`,
    DROP COLUMN `instructions`,
    DROP COLUMN `isNew`,
    DROP COLUMN `link`,
    DROP COLUMN `name`,
    DROP COLUMN `sortOrder`,
    DROP COLUMN `systemRequirements`,
    ADD COLUMN `regions` TEXT NOT NULL,
    ADD COLUMN `subscriptionTypes` TEXT NOT NULL;

-- CreateTable
CREATE TABLE `product_translations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `language` VARCHAR(10) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,

    INDEX `product_translations_language_idx`(`language`),
    UNIQUE INDEX `product_translations_product_id_language_key`(`product_id`, `language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_features` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `language` VARCHAR(10) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `parent_id` INTEGER NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `product_features_product_id_idx`(`product_id`),
    INDEX `product_features_language_idx`(`language`),
    INDEX `product_features_parent_id_idx`(`parent_id`),
    UNIQUE INDEX `product_features_product_id_language_title_parent_id_key`(`product_id`, `language`, `title`, `parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_system_requirements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `language` VARCHAR(10) NOT NULL,
    `gameClient` TEXT NULL,
    `supportedOS` TEXT NULL,
    `antiCheats` TEXT NULL,
    `processors` TEXT NULL,
    `spoofer` BOOLEAN NOT NULL DEFAULT false,
    `gameMode` BOOLEAN NOT NULL DEFAULT false,

    INDEX `product_system_requirements_product_id_idx`(`product_id`),
    UNIQUE INDEX `product_system_requirements_product_id_language_key`(`product_id`, `language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `thumbnail` VARCHAR(500) NULL,
    `file_name` VARCHAR(255) NULL,
    `file_size` INTEGER NULL,
    `mime_type` VARCHAR(100) NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `duration` INTEGER NULL,
    `is_main_image` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_media_product_id_idx`(`product_id`),
    INDEX `product_media_type_idx`(`type`),
    INDEX `product_media_is_main_image_idx`(`is_main_image`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user` VARCHAR(100) NOT NULL,
    `timestamp` BIGINT NOT NULL,
    `description` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `product_variants_type_idx` ON `product_variants`(`type`);

-- CreateIndex
CREATE INDEX `product_variants_region_idx` ON `product_variants`(`region`);

-- CreateIndex
CREATE INDEX `product_variants_isActive_idx` ON `product_variants`(`isActive`);

-- CreateIndex
CREATE INDEX `products_status_idx` ON `products`(`status`);

-- AddForeignKey
ALTER TABLE `product_translations` ADD CONSTRAINT `product_translations_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_features` ADD CONSTRAINT `product_features_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_features` ADD CONSTRAINT `product_features_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `product_features`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_system_requirements` ADD CONSTRAINT `product_system_requirements_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_media` ADD CONSTRAINT `product_media_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RedefineIndex
CREATE INDEX `accounts_user_id_idx` ON `accounts`(`user_id`);
DROP INDEX `accounts_user_id_fkey` ON `accounts`;

-- RedefineIndex
CREATE INDEX `sessions_user_id_idx` ON `sessions`(`user_id`);
DROP INDEX `sessions_user_id_fkey` ON `sessions`;
