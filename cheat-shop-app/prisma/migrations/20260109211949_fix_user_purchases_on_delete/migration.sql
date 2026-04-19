-- DropForeignKey
ALTER TABLE `user_purchases` DROP FOREIGN KEY `user_purchases_order_id_fkey`;

-- AlterTable
ALTER TABLE `user_purchases` MODIFY `order_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `user_purchases` ADD CONSTRAINT `user_purchases_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
