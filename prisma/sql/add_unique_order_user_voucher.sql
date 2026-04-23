-- Add UNIQUE(userId, voucherId) for enforcing one-time voucher per user.
-- Safe to run multiple times.

SET @idx := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'Order'
    AND index_name = 'Order_userId_voucherId_key'
);

SET @sql := IF(
  @idx = 0,
  'CREATE UNIQUE INDEX `Order_userId_voucherId_key` ON `Order`(`userId`, `voucherId`);',
  'SELECT "Order_userId_voucherId_key already exists" AS message;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
