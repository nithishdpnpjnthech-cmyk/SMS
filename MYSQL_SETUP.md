# MySQL Setup Instructions

## 1. Install MySQL (if not already installed)

### macOS:
```bash
brew install mysql
brew services start mysql
```

### Ubuntu/Linux:
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

### Windows:
Download from https://dev.mysql.com/downloads/mysql/

## 2. Create Database and Tables

1. Connect to MySQL:
```bash
mysql -u root -p
```

2. Run the schema file:
```bash
mysql -u root -p < database-schema.sql
```

OR copy-paste the SQL from `database-schema.sql` into MySQL command line.

## 3. Update Environment Variables

Edit `.env` file with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=academy_sms
DB_PORT=3306
```

## 4. Test the Setup

1. Start the server:
```bash
npm run dev
```

2. Check if it connects without errors
3. Try creating a student via the frontend
4. Restart server and verify data persists

## 5. For Production (Render/Railway/etc.)

Set these environment variables in your hosting platform:
- `DB_HOST` - Your MySQL host URL
- `DB_USER` - Your MySQL username
- `DB_PASSWORD` - Your MySQL password
- `DB_NAME` - academy_sms
- `DB_PORT` - 3306

## Troubleshooting

### Connection Issues:
- Check MySQL is running: `brew services list | grep mysql`
- Verify credentials in `.env`
- Check firewall settings

### Permission Issues:
```sql
CREATE USER 'academy_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON academy_sms.* TO 'academy_user'@'localhost';
FLUSH PRIVILEGES;
```

### Reset Database:
```sql
DROP DATABASE academy_sms;
```
Then re-run the schema file.