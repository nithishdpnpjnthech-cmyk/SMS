# PRODUCTION LOGIN CREDENTIALS

## System Access (Empty Database State)

### Admin (Global Access)
- **Username:** `admin`
- **Password:** `admin123`
- **Access:** All branches, all data

### Branch Managers (Branch-Specific)
- **Ramamurthy Nagar:** `manager_ramamurthy` / `manager123`
- **Kasturi Nagar:** `manager_kasturi` / `manager123`  
- **Kalyan Nagar:** `manager_kalyan` / `manager123`
- **Access:** Only their assigned branch data

### Receptionists (Branch-Specific)
- **Ramamurthy Nagar:** `reception_ramamurthy` / `reception123`
- **Kasturi Nagar:** `reception_kasturi` / `reception123`
- **Kalyan Nagar:** `reception_kalyan` / `reception123`
- **Access:** Only their assigned branch data

### Trainers
- No trainers exist in empty database
- Must be created by Admin/Manager after login

## Expected Behavior (Empty Database)

### All Dashboards Show:
- **Students:** 0
- **Attendance:** 0 / 0
- **Fees:** ₹0
- **Revenue:** ₹0
- **Programs:** Empty list
- **Batches:** Empty list

### This is CORRECT behavior for empty database.

### After Adding Real Data:
- Managers see only their branch data
- Receptionists see only their branch data  
- Trainers see only assigned batches
- Admin sees all data across branches

## Database State: PRODUCTION READY
- 3 Branches (Ramamurthy, Kasturi, Kalyan)
- 7 Users (1 Admin + 6 Branch Staff)
- 0 Students (will show empty until added)
- 0 Attendance (will show empty until added)
- 0 Fees (will show empty until added)

**NO MOCK DATA EXISTS IN THE SYSTEM**