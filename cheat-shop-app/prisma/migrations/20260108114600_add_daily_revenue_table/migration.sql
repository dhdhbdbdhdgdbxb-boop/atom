-- CreateTable
CREATE TABLE `daily_revenue` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `revenue_usd` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `revenue_rub` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `daily_revenue_date_key` (`date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;
