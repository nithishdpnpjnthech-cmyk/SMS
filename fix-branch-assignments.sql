-- Fix branch assignments for Manager and Reception users
-- This script ensures all non-admin users have proper branch_id assignments

-- First, let's see current user status
SELECT 'Current Users:' as info;
SELECT id, username, role, branch_id FROM users;

-- Get available branches
SELECT 'Available Branches:' as info;
SELECT id, name FROM branches;

-- Update existing users with branch assignments
-- Assign managers to specific branches
UPDATE users SET branch_id = (SELECT id FROM branches WHERE name = 'Rammurthy Nagar' LIMIT 1) 
WHERE role = 'manager' AND username LIKE '%rammurthy%';

UPDATE users SET branch_id = (SELECT id FROM branches WHERE name = 'Kasturi Nagar' LIMIT 1) 
WHERE role = 'manager' AND username LIKE '%kasturi%';

UPDATE users SET branch_id = (SELECT id FROM branches WHERE name = 'Kalyan Nagar' LIMIT 1) 
WHERE role = 'manager' AND username LIKE '%kalyan%';

-- Assign receptionists to specific branches
UPDATE users SET branch_id = (SELECT id FROM branches WHERE name = 'Rammurthy Nagar' LIMIT 1) 
WHERE role = 'reception' AND username LIKE '%rammurthy%';

UPDATE users SET branch_id = (SELECT id FROM branches WHERE name = 'Kasturi Nagar' LIMIT 1) 
WHERE role = 'reception' AND username LIKE '%kasturi%';

UPDATE users SET branch_id = (SELECT id FROM branches WHERE name = 'Kalyan Nagar' LIMIT 1) 
WHERE role = 'reception' AND username LIKE '%kalyan%';

-- Create missing manager/reception users if they don't exist
INSERT IGNORE INTO users (id, username, password, role, email, name, branch_id, created_at)
SELECT 
  UUID() as id,
  'manager-rammurthy' as username,
  'password123' as password,
  'manager' as role,
  'manager@rammurthy.com' as email,
  'Rammurthy Manager' as name,
  b.id as branch_id,
  NOW() as created_at
FROM branches b 
WHERE b.name = 'Rammurthy Nagar'
AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'manager' AND branch_id = b.id);

INSERT IGNORE INTO users (id, username, password, role, email, name, branch_id, created_at)
SELECT 
  UUID() as id,
  'reception-rammurthy' as username,
  'password123' as password,
  'reception' as role,
  'reception@rammurthy.com' as email,
  'Rammurthy Reception' as name,
  b.id as branch_id,
  NOW() as created_at
FROM branches b 
WHERE b.name = 'Rammurthy Nagar'
AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'reception' AND branch_id = b.id);

-- Repeat for other branches
INSERT IGNORE INTO users (id, username, password, role, email, name, branch_id, created_at)
SELECT 
  UUID() as id,
  'manager-kasturi' as username,
  'password123' as password,
  'manager' as role,
  'manager@kasturi.com' as email,
  'Kasturi Manager' as name,
  b.id as branch_id,
  NOW() as created_at
FROM branches b 
WHERE b.name = 'Kasturi Nagar'
AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'manager' AND branch_id = b.id);

INSERT IGNORE INTO users (id, username, password, role, email, name, branch_id, created_at)
SELECT 
  UUID() as id,
  'reception-kasturi' as username,
  'password123' as password,
  'reception' as role,
  'reception@kasturi.com' as email,
  'Kasturi Reception' as name,
  b.id as branch_id,
  NOW() as created_at
FROM branches b 
WHERE b.name = 'Kasturi Nagar'
AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'reception' AND branch_id = b.id);

INSERT IGNORE INTO users (id, username, password, role, email, name, branch_id, created_at)
SELECT 
  UUID() as id,
  'manager-kalyan' as username,
  'password123' as password,
  'manager' as role,
  'manager@kalyan.com' as email,
  'Kalyan Manager' as name,
  b.id as branch_id,
  NOW() as created_at
FROM branches b 
WHERE b.name = 'Kalyan Nagar'
AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'manager' AND branch_id = b.id);

INSERT IGNORE INTO users (id, username, password, role, email, name, branch_id, created_at)
SELECT 
  UUID() as id,
  'reception-kalyan' as username,
  'password123' as password,
  'reception' as role,
  'reception@kalyan.com' as email,
  'Kalyan Reception' as name,
  b.id as branch_id,
  NOW() as created_at
FROM branches b 
WHERE b.name = 'Kalyan Nagar'
AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'reception' AND branch_id = b.id);

-- Show final results
SELECT 'Updated Users:' as info;
SELECT id, username, role, branch_id, 
       (SELECT name FROM branches WHERE id = users.branch_id) as branch_name 
FROM users 
ORDER BY role, username;