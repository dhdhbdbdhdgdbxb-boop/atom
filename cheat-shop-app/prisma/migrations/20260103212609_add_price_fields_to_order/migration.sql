/*
  Warnings:

  - You are about to drop the column `price_rub` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `price_usd` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `orders` DROP COLUMN `price_rub`,
    DROP COLUMN `price_usd`;
