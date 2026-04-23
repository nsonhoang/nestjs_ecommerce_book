-- DropForeignKey
ALTER TABLE `bookauthor` DROP FOREIGN KEY `BookAuthor_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `inventorylog` DROP FOREIGN KEY `InventoryLog_inventoryId_fkey`;

-- AlterTable
ALTER TABLE `book` ADD COLUMN `status` ENUM('DRAFT', 'ACTIVE', 'HIDDEN', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT';

-- AddForeignKey
ALTER TABLE `BookAuthor` ADD CONSTRAINT `BookAuthor_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `Author`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inventory` ADD CONSTRAINT `Inventory_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `Book`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryLog` ADD CONSTRAINT `InventoryLog_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `Inventory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
