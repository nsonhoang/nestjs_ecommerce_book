-- Manual patch for dev DB drift scenario.
-- Adds returnRequestedAt and synchronizes OrderStatus with RETURNED.

ALTER TABLE `order`
  ADD COLUMN `returnRequestedAt` DATETIME(3) NULL AFTER `voucherId`;

ALTER TABLE `order`
  MODIFY COLUMN `status` ENUM('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNING', 'RETURNED', 'REFUNDED') NOT NULL DEFAULT 'PENDING';
