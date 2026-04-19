-- CreateTable
CREATE TABLE `reserved_keys` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(255) NOT NULL,
    `variant_id` INTEGER NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'reserved',
    `reserved_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `used_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,

    INDEX `reserved_keys_variant_id_idx`(`variant_id`),
    INDEX `reserved_keys_order_id_idx`(`order_id`),
    INDEX `reserved_keys_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reserved_keys` ADD CONSTRAINT `reserved_keys_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reserved_keys` ADD CONSTRAINT `reserved_keys_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
