-- Add returnRequestedAt to order for return workflow
-- Also sync the OrderStatus enum with RETURNED so admin can finalize return processing.

ALTER TABLE `order`
  ADD COLUMN `returnRequestedAt` DATETIME(3) NULL AFTER `voucherId`;

ALTER TABLE `order`
  MODIFY COLUMN `status` ENUM('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNING', 'RETURNED', 'REFUNDED') NOT NULL DEFAULT 'PENDING';
