/*
  Warnings:

  - You are about to drop the column `location` on the `inventory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bookId]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `inventory` DROP FOREIGN KEY `Inventory_bookId_fkey`;

-- DropIndex
DROP INDEX `Inventory_bookId_location_key` ON `inventory`;

-- AlterTable
ALTER TABLE `inventory` DROP COLUMN `location`;

-- CreateIndex
CREATE UNIQUE INDEX `Inventory_bookId_key` ON `Inventory`(`bookId`);
