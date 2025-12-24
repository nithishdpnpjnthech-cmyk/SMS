# CLEAN SYSTEM SETUP - NO MOCK DATA

## REMOVE ALL MOCK DATA

Run this to clean up the system:

```bash
mysql -u root -p sms < clean-setup.sql
```

## CLEAN USER CREDENTIALS

### Admin:
- Username: `admin`
- Password: `admin123`

### Branch Managers:
- **Rammurthy**: `manager_rammurthy` / `manager123`
- **Kasturi**: `manager_kasturi` / `manager123`
- **Kalyan**: `manager_kalyan` / `manager123`

### Receptionists:
- **Rammurthy**: `reception_rammurthy` / `reception123`
- **Kasturi**: `reception_kasturi` / `reception123`
- **Kalyan**: `reception_kalyan` / `reception123`

### Trainers:
- **Rammurthy**: `trainer_rammurthy` / `trainer123`
- **Kasturi**: `trainer_kasturi` / `trainer123`
- **Kalyan**: `trainer_kalyan` / `trainer123`

## WHAT WAS REMOVED:
- All fake student names (Guru Kavya, Sensei Kumar, etc.)
- All mock attendance data
- All fake fee records
- All hardcoded schedule data

## WHAT REMAINS:
- Clean user accounts with simple names
- Empty dashboards showing real zeros
- Proper branch isolation
- Working authentication

The system now shows ONLY real data from the database. All dashboards will show zeros until you add real students through the UI.