# SMS System Verification Checklist

## Setup Steps

### 1. Database Setup
```bash
# Create database and tables
mysql -u root -p < database-schema.sql

# Create default users
mysql -u root -p < create-users.sql
```

### 2. Start Services
```bash
# Terminal 1: Backend (port 5000)
npm run dev

# Terminal 2: Frontend (port 5001)  
npm run dev:client
```

### 3. Access Points
- Frontend: http://localhost:5001
- Backend API: http://localhost:5000/api

## Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Manager | manager | manager123 |
| Receptionist | receptionist | reception123 |
| Trainer | trainer | trainer123 |

## Verification Tests

### ✅ Login System
- [ ] Login with admin/admin123 → redirects to /admin
- [ ] Login with manager/manager123 → redirects to /manager  
- [ ] Login with wrong password → shows error
- [ ] Each role sees different dashboard

### ✅ Data Persistence
- [ ] Add student via frontend form
- [ ] Check terminal shows: `POST /api/students 201`
- [ ] Verify in database: `SELECT * FROM students;`
- [ ] Restart server, data still exists

### ✅ API Endpoints Working
- [ ] GET /api/students returns data
- [ ] POST /api/students creates student
- [ ] GET /api/dashboard/stats shows real numbers
- [ ] All endpoints return JSON, not errors

### ✅ Role-Based Access
- [ ] Admin can access all features
- [ ] Manager sees branch-specific data
- [ ] Receptionist can add students, collect fees
- [ ] Trainer can mark attendance

## Database Verification Commands

```sql
-- Check users exist
SELECT username, role FROM users;

-- Check students are being saved
SELECT name, program, created_at FROM students;

-- Check branches exist  
SELECT name FROM branches;

-- Check all tables have data
SHOW TABLE STATUS;
```

## Success Indicators

✅ **Login works with real credentials**
✅ **Frontend calls backend APIs (see network tab)**  
✅ **Backend saves to MySQL (data persists)**
✅ **Role-based dashboards work**
✅ **No mock data being used**

## Common Issues & Fixes

**Login fails:** Check users table has data
**API errors:** Check backend is running on port 5000
**No data saving:** Check MySQL connection in .env
**Wrong dashboard:** Check role in users table