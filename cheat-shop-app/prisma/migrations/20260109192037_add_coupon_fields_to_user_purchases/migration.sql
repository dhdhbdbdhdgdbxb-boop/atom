-- AlterTable
ALTER TABLE `user_purchases` ADD COLUMN `couponCode` VARCHAR(50) NULL,
    ADD COLUMN `coupon_discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
