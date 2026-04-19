-- Add SEO tags fields to product_translations table
ALTER TABLE `product_translations` 
ADD COLUMN `meta_title` VARCHAR(255) NULL AFTER `description`,
ADD COLUMN `meta_description` TEXT NULL AFTER `meta_title`,
ADD COLUMN `meta_keywords` TEXT NULL AFTER `meta_description`;