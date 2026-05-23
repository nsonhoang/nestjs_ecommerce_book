-- Manual patch for dev DB drift scenario (no migrate reset).
-- Adds status to `user` with default ACTIVE so existing auth flows keep working.

ALTER TABLE `user`
  ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE';
