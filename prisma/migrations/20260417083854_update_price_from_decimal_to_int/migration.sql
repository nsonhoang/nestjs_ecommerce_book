/*
  Warnings:

  - You are about to alter the column `price` on the `book` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Int`.

*/
-- AlterTable
ALTER TABLE `book` MODIFY `price` INTEGER NOT NULL;
