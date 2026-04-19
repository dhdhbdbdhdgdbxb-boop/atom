-- AlterTable
ALTER TABLE `product_variants` ADD COLUMN `daysLabelEn` VARCHAR(50) NULL,
    ADD COLUMN `daysLabelRu` VARCHAR(50) NULL;

-- CreateIndex
CREATE INDEX `page_visits_date_idx` ON `page_visits`(`date`);
