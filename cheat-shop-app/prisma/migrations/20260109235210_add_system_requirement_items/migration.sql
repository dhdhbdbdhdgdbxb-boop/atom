-- CreateTable
CREATE TABLE `product_system_requirement_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requirement_id` INTEGER NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(50) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `product_system_requirement_items_requirement_id_idx`(`requirement_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_system_requirement_items` ADD CONSTRAINT `product_system_requirement_items_requirement_id_fkey` FOREIGN KEY (`requirement_id`) REFERENCES `product_system_requirements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
