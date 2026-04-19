-- Add type field to orders table to distinguish between orders and deposits
ALTER TABLE `orders` ADD COLUMN `type` VARCHAR(20) NOT NULL DEFAULT 'order';

-- Add fields for payment data and additional information
ALTER TABLE `orders` ADD COLUMN `payment_data` JSON NULL;
ALTER TABLE `orders` ADD COLUMN `paid_at` DATETIME(3) NULL;
ALTER TABLE `orders` ADD COLUMN `total_amount` DECIMAL(10,2) NULL;
ALTER TABLE `orders` ADD COLUMN `currency` VARCHAR(3) NULL;

-- Make productId nullable for deposits
ALTER TABLE `orders` MODIFY COLUMN `product_id` INT NULL;

-- Add index for type field
CREATE INDEX `orders_type_idx` ON `orders`(`type`);