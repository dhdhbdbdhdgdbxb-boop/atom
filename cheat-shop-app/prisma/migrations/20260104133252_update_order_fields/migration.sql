/*
  Migration to update order fields:
  - Add new fields total_usd and total_rub
  - Copy data from old fields to new fields
  - Remove old fields currency and total_amount

*/

-- Step 1: Add new columns with default values
ALTER TABLE `orders`
    ADD COLUMN `total_rub` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `total_usd` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- Step 2: Update existing records with data from old fields
-- For USD orders
UPDATE `orders` SET `total_usd` = `total_amount` WHERE `currency` = 'USD';

-- For RUB orders
UPDATE `orders` SET `total_rub` = `total_amount` WHERE `currency` = 'RUB';

-- Step 3: Remove old columns
ALTER TABLE `orders`
    DROP COLUMN `currency`,
    DROP COLUMN `total_amount`;
