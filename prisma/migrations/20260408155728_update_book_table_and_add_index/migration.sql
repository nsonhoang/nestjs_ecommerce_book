-- AlterTable
ALTER TABLE `author` ADD COLUMN `dateOfBirth` DATETIME(3) NULL,
    ADD COLUMN `info` TEXT NULL,
    ADD COLUMN `nationality` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Author_name_idx` ON `Author`(`name`);

-- RenameIndex
ALTER TABLE `bookauthor` RENAME INDEX `BookAuthor_authorId_fkey` TO `BookAuthor_authorId_idx`;
