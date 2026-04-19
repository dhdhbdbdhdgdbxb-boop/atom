-- CreateTable
CREATE TABLE `payment_fees` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `payment_method` VARCHAR(50) NOT NULL,
  `percentage_fee` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `fixed_fee_usd` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `fixed_fee_rub` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `payment_fees_payment_method_key`(`payment_method`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert default payment methods with example fees
INSERT INTO `payment_fees` (`payment_method`, `percentage_fee`, `fixed_fee_usd`, `fixed_fee_rub`, `is_active`) VALUES
('card', 8.00, 0.30, 23.88, true),
('cryptocloud', 5.00, 0.10, 7.96, true),
('balance', 0.00, 0.00, 0.00, true),
('balanceUsd', 0.00, 0.00, 0.00, true),
('balanceRub', 0.00, 0.00, 0.00, true);