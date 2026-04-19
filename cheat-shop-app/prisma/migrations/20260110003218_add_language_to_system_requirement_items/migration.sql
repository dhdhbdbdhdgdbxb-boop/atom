/*
  Warnings:

  - Added the required column `language` to the `product_system_requirement_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `product_system_requirement_items` ADD COLUMN `language` VARCHAR(10) NOT NULL;
