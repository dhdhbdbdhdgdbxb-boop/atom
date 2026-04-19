/*
  Warnings:
 
  - You are about to drop the column `instructionEn` on the `user_purchases` table. All the data in the column will be lost.
  - You are about to drop the column `instructionRu` on the `user_purchases` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user_purchases` ADD COLUMN `instruction` TEXT NULL;

-- Update data from old fields to new field, removing language prefixes
UPDATE `user_purchases` SET `instruction` =
  REPLACE(
    REPLACE(
      REPLACE(
        CONCAT(
          COALESCE(NULLIF(`instructionRu`, ''), ''),
          COALESCE(NULLIF(`instructionEn`, ''), '')
        ),
        'RU: ', ''
      ),
      'EN: ', ''
    ),
    ' | ', ' '
  )
WHERE `instructionRu` IS NOT NULL OR `instructionEn` IS NOT NULL;

-- Drop old columns
ALTER TABLE `user_purchases` DROP COLUMN `instructionEn`,
    DROP COLUMN `instructionRu`;
