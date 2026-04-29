-- Manual patch for dev DB drift scenario (no migrate reset).
-- Adds GHN identifier snapshots to `order` so shipment can be created later at PROCESSING.

ALTER TABLE `order`
  ADD COLUMN `shippingWardCode` VARCHAR(191) NULL,
  ADD COLUMN `shippingDistrictId` INTEGER NULL;
