-- AlterTable
ALTER TABLE `product_system_requirement_items` ADD COLUMN `product_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `product_system_requirement_items_product_id_idx` ON `product_system_requirement_items`(`product_id`);

-- AddForeignKey
ALTER TABLE `product_system_requirement_items` ADD CONSTRAINT `product_system_requirement_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
