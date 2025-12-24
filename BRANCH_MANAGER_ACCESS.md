# HOW TO ACCESS BRANCH MANAGER DATA

## STEP 1: Create Branch Managers

Run this SQL in your MySQL database:

```sql
USE sms;

-- Get branch IDs
SET @rammurthy_id = (SELECT id FROM branches WHERE name LIKE '%Rammurthy%' LIMIT 1);
SET @kasturi_id = (SELECT id FROM branches WHERE name LIKE '%Kasturi%' LIMIT 1);
SET @kalyan_id = (SELECT id FROM branches WHERE name LIKE '%Kalyan%' LIMIT 1);

-- Create Branch Managers
INSERT INTO users (id, username, password, role, name, email, branch_id) VALUES
(UUID(), 'manager_rammurthy', 'manager123', 'manager', 'Rammurthy Branch Manager', 'manager.rammurthy@academy.com', @rammurthy_id),
(UUID(), 'manager_kasturi', 'manager123', 'manager', 'Kasturi Branch Manager', 'manager.kasturi@academy.com', @kasturi_id),
(UUID(), 'manager_kalyan', 'manager123', 'manager', 'Kalyan Branch Manager', 'manager.kalyan@academy.com', @kalyan_id);
```

## STEP 2: Login Credentials

### Rammurthy Nagar Branch Manager:
- **Username**: `manager_rammurthy`
- **Password**: `manager123`
- **Access**: Only Rammurthy Nagar branch data

### Kasturi Nagar Branch Manager:
- **Username**: `manager_kasturi`  
- **Password**: `manager123`
- **Access**: Only Kasturi Nagar branch data

### Kalyan Nagar Branch Manager:
- **Username**: `manager_kalyan`
- **Password**: `manager123`
- **Access**: Only Kalyan Nagar branch data

## STEP 3: How to Test Branch Isolation

1. **Login as Admin** (`admin` / `admin123`)
   - Can see ALL branches data
   - Dashboard shows combined stats from all branches

2. **Login as Rammurthy Manager** (`manager_rammurthy` / `manager123`)
   - Can ONLY see Rammurthy Nagar branch data
   - Dashboard shows only Rammurthy students, fees, attendance

3. **Login as Kasturi Manager** (`manager_kasturi` / `manager123`)
   - Can ONLY see Kasturi Nagar branch data
   - Dashboard shows only Kasturi students, fees, attendance

4. **Login as Kalyan Manager** (`manager_kalyan` / `manager123`)
   - Can ONLY see Kalyan Nagar branch data
   - Dashboard shows only Kalyan students, fees, attendance

## STEP 4: Verify Branch Isolation

Each manager will see:
- ✅ Only their branch students
- ✅ Only their branch fees/revenue
- ✅ Only their branch attendance
- ✅ Branch-specific dashboard stats
- ❌ Cannot access other branches (blocked by backend)

## STEP 5: Add Sample Data (Optional)

To see meaningful data in each branch dashboard, add some students and fees for each branch using the admin panel or SQL inserts.

The system now enforces proper branch isolation at the backend level!