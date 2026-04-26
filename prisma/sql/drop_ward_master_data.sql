-- Drop Ward master-data table and remove FK from Address.
-- Generated from: prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma

ALTER TABLE `address` DROP FOREIGN KEY `Address_wardCode_fkey`;
ALTER TABLE `ward` DROP FOREIGN KEY `Ward_districtId_fkey`;
DROP INDEX `Address_wardCode_fkey` ON `address`;
DROP TABLE `ward`;
