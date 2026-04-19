-- Add quantity field to user_purchases table
ALTER TABLE `user_purchases` ADD COLUMN `quantity` INT NOT NULL DEFAULT 1;