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

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_busCompanyId_fkey` FOREIGN KEY (`busCompanyId`) REFERENCES `BusCompany`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seat` ADD CONSTRAINT `Seat_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Route` ADD CONSTRAINT `Route_departureLocationId_fkey` FOREIGN KEY (`departureLocationId`) REFERENCES `Location`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Route` ADD CONSTRAINT `Route_destinationLocationId_fkey` FOREIGN KEY (`destinationLocationId`) REFERENCES `Location`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Trip` ADD CONSTRAINT `Trip_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `Route`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Trip` ADD CONSTRAINT `Trip_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingSeat` ADD CONSTRAINT `BookingSeat_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingSeat` ADD CONSTRAINT `BookingSeat_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingSeat` ADD CONSTRAINT `BookingSeat_seatId_fkey` FOREIGN KEY (`seatId`) REFERENCES `Seat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_bookingSeatId_fkey` FOREIGN KEY (`bookingSeatId`) REFERENCES `BookingSeat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
