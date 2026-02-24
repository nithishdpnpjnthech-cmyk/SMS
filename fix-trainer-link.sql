-- Fix Trainer-User Linking
-- Run this to link your trainer account to the user

-- Step 1: Check current status
SELECT 
  u.id as user_id, 
  u.username, 
  u.role,
  t.id as trainer_id,
  t.name as trainer_name,
  t.user_id as current_link
FROM users u
LEFT JOIN trainers t ON t.user_id = u.id
WHERE u.role = 'trainer';

-- Step 2: If trainer_id is NULL, find the trainer record by email
SELECT id, name, email FROM trainers WHERE email = 'YOUR_TRAINER_EMAIL@example.com';

-- Step 3: Link the trainer to the user (replace with actual IDs)
-- UPDATE trainers 
-- SET user_id = 'YOUR_USER_ID_HERE' 
-- WHERE id = 'YOUR_TRAINER_ID_HERE';

-- Example:
-- UPDATE trainers 
-- SET user_id = '2b1002bf-7615-4c9c-9ce0-05585e3d315a' 
-- WHERE email = 'dhana@example.com';

-- Step 4: Verify the link
SELECT 
  u.id as user_id, 
  u.username,
  t.id as trainer_id,
  t.name as trainer_name
FROM users u
JOIN trainers t ON t.user_id = u.id
WHERE u.role = 'trainer';
