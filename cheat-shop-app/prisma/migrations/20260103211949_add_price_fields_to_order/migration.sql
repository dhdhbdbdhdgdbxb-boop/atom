/*
  Warnings:

  - Added the required column `price_rub` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_usd` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `orders` ADD COLUMN `price_rub` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `price_usd` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
