/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `BookImage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `publicId` to the `BookImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `bookimage` ADD COLUMN `publicId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `BookImage_publicId_key` ON `BookImage`(`publicId`);
