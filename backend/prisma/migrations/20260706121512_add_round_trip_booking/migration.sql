-- AlterTable
ALTER TABLE `booking` ADD COLUMN `tripType` ENUM('one_way', 'round_trip') NOT NULL DEFAULT 'one_way';

-- AlterTable
ALTER TABLE `bookingseat` ADD COLUMN `legType` ENUM('outbound', 'return') NOT NULL DEFAULT 'outbound';
