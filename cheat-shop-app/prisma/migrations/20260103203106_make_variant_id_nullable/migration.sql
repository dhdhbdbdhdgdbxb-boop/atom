-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_variant_id_fkey`;

-- AlterTable
ALTER TABLE `orders` MODIFY `variant_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
