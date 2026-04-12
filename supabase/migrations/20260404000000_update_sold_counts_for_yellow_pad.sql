-- Update sold count for Yellow Pad Writing Paper (id: n2)
-- This ensures the product shows correct sold count

UPDATE products
SET sold = (
  SELECT COALESCE(SUM(oi.quantity), 0)
  FROM orders o
  JOIN UNNEST(o.items) AS oi
  WHERE o.status = 'completed'
    AND oi.id = 'n2'
)
WHERE id = 'n2';