-- CreateTable
CREATE TABLE `PartnerApplication` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `companyName` VARCHAR(150) NOT NULL,
    `contactName` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PartnerApplication_status_idx`(`status`),
    INDEX `PartnerApplication_phone_idx`(`phone`),
    INDEX `PartnerApplication_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
