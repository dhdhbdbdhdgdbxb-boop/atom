-- Add quantity field to orders table
ALTER TABLE `orders` ADD COLUMN `quantity` INT NOT NULL DEFAULT 1;