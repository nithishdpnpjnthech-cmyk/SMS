-- CLEAN EXISTING DUPLICATE STUDENTS
-- Keep oldest record for each duplicate group based on name+phone+program+batch

-- Step 1: Identify duplicates (same name, phone, program, batch)
SELECT 
    name, phone, program, batch, COUNT(*) as duplicate_count,
    GROUP_CONCAT(id ORDER BY created_at ASC) as all_ids,
    MIN(created_at) as oldest_date
FROM students 
WHERE status = 'active'
GROUP BY name, phone, program, batch 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Delete duplicates (keep oldest record)
DELETE s1 FROM students s1
INNER JOIN students s2 
WHERE s1.name = s2.name 
  AND s1.phone = s2.phone 
  AND s1.program = s2.program 
  AND s1.batch = s2.batch
  AND s1.status = 'active'
  AND s2.status = 'active'
  AND s1.created_at > s2.created_at;  -- Delete newer records, keep older

-- Step 3: Verify cleanup
SELECT 
    name, phone, program, batch, COUNT(*) as remaining_count
FROM students 
WHERE status = 'active'
GROUP BY name, phone, program, batch 
HAVING COUNT(*) > 1;