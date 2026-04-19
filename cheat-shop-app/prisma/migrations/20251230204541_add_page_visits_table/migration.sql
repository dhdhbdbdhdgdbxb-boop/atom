-- CreateTable
CREATE TABLE `page_visits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `viewerId` VARCHAR(36) NOT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` TEXT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isUnique` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `page_visits_viewerId_key`(`viewerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
