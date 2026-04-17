-- DropForeignKey
ALTER TABLE `Inventory` DROP FOREIGN KEY `Inventory_bookId_fkey`;

-- DropIndex
DROP INDEX `Inventory_bookId_location_key` ON `Inventory`;

-- AlterTable
ALTER TABLE `Inventory`
    DROP COLUMN `location`;

-- CreateIndex
CREATE UNIQUE INDEX `Inventory_bookId_key` ON `Inventory`(`bookId`);
