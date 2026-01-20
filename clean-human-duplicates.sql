-- CLEAN DUPLICATES USING HUMAN ADMISSION LOGIC
-- Duplicate = same name + phone + guardian_name + guardian_phone + address

-- Step 1: Find human duplicates
SELECT 
    name, phone, 
    COALESCE(guardian_name,'') as guardian_name,
    COALESCE(parent_phone,'') as parent_phone, 
    COALESCE(address,'') as address,
    COUNT(*) as duplicate_count,
    MIN(created_at) as oldest_date
FROM students 
WHERE status = 'active'
GROUP BY name, COALESCE(phone,''), COALESCE(guardian_name,''), COALESCE(parent_phone,''), COALESCE(address,'')
HAVING COUNT(*) > 1;

-- Step 2: Delete human duplicates (keep oldest)
DELETE s1 FROM students s1
INNER JOIN students s2 
WHERE s1.name = s2.name 
  AND COALESCE(s1.phone,'') = COALESCE(s2.phone,'')
  AND COALESCE(s1.guardian_name,'') = COALESCE(s2.guardian_name,'')
  AND COALESCE(s1.parent_phone,'') = COALESCE(s2.parent_phone,'')
  AND COALESCE(s1.address,'') = COALESCE(s2.address,'')
  AND s1.status = 'active'
  AND s2.status = 'active'
  AND s1.created_at > s2.created_at;