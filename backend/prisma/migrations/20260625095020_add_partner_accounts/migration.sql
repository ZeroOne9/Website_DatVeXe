-- AlterTable
ALTER TABLE `partnerapplication` ADD COLUMN `accountEmail` VARCHAR(191) NULL,
    ADD COLUMN `passwordHash` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('passenger', 'admin', 'partner') NOT NULL DEFAULT 'passenger';

-- CreateTable
CREATE TABLE `BusCompanyUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `busCompanyId` INTEGER NOT NULL,
    `role` VARCHAR(40) NOT NULL DEFAULT 'owner',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BusCompanyUser_userId_idx`(`userId`),
    INDEX `BusCompanyUser_busCompanyId_idx`(`busCompanyId`),
    UNIQUE INDEX `BusCompanyUser_userId_busCompanyId_key`(`userId`, `busCompanyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `PartnerApplication_accountEmail_idx` ON `PartnerApplication`(`accountEmail`);

-- AddForeignKey
ALTER TABLE `BusCompanyUser` ADD CONSTRAINT `BusCompanyUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BusCompanyUser` ADD CONSTRAINT `BusCompanyUser_busCompanyId_fkey` FOREIGN KEY (`busCompanyId`) REFERENCES `BusCompany`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
