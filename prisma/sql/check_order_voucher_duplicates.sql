-- Find duplicates that would block a UNIQUE(userId, voucherId)
SELECT userId, voucherId, COUNT(*) AS cnt
FROM `Order`
WHERE voucherId IS NOT NULL
GROUP BY userId, voucherId
HAVING COUNT(*) > 1;
