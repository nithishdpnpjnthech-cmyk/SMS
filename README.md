# SMS Academy — Management System

A full-stack Student Management System for sports academies built with React (Vite) + Node.js (Express) + MySQL.

---

## 📁 Project Structure

```
SMS/
├── client/          → React frontend (TypeScript + Vite)
│   └── src/
│       ├── pages/   → All pages (admin, student, trainer portals)
│       ├── components/ → Reusable UI components
│       ├── lib/     → API clients, auth helpers
│       └── hooks/   → Custom React hooks
├── server/          → Node.js / Express backend
│   ├── index.ts     → App entry point
│   ├── routes.ts    → All API routes
│   ├── db.ts        → MySQL connection pool
│   ├── mysql-storage.ts → All DB queries
│   └── services/    → Email / SMS notification service
├── shared/
│   └── schema.ts    → Shared TypeScript types
├── database.sql     → ⭐ MASTER DATABASE SETUP — run this first!
├── .env.example     → Environment variable template
└── package.json     → Scripts and dependencies
```

---

## 🚀 AWS Deployment Guide

### Step 1 — Setup MySQL Database (AWS RDS)

1. Create an **Amazon RDS MySQL 8.0** instance
2. Note down: Host, Port (3306), Username, Password, DB name (`sms`)
3. Connect to RDS and run the master setup script:

```bash
mysql -h your-rds-endpoint -u admin -p < database.sql
```

This creates all **18 tables** and a default admin user.

> **Default Admin Login:** `admin` / `password` — Change immediately after first login!

---

### Step 2 — Setup Environment Variables

On your EC2 instance, create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
nano .env
```

Fill in your actual values:

```env
NODE_ENV=production
PORT=5051
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-password
DB_NAME=sms
DB_PORT=3306
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...
FAST2SMS_API_KEY=...
```

---

### Step 3 — Install & Build

```bash
# Install dependencies
npm install

# Build the frontend (React → static files)
npm run build
```

---

### Step 4 — Run the Server

**Option A: Direct (for testing)**
```bash
npm start
```

**Option B: PM2 (recommended for production)**
```bash
npm install -g pm2
pm2 start npm --name "sms-academy" -- start
pm2 save
pm2 startup
```

The app will be available at: `http://your-ec2-ip:5051`

---

### Step 5 — Nginx Reverse Proxy (optional but recommended)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5051;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔑 Default Login Credentials

| Role    | Username | Password  |
|---------|----------|-----------|
| Admin   | admin    | password  |

> ⚠️ Change all passwords immediately after first deployment!

---

## 📋 Available npm Scripts

| Command          | Description                        |
|------------------|------------------------------------|
| `npm run dev`    | Start dev server (frontend + backend) |
| `npm run build`  | Build frontend for production      |
| `npm start`      | Start production server            |

---

## 🗄️ Database Tables (18 total)

| # | Table | Purpose |
|---|-------|---------|
| 1 | `users` | Admin, manager, receptionist, trainer accounts |
| 2 | `branches` | Academy branch locations |
| 3 | `programs` | Sports programs (Karate, Yoga, etc.) |
| 4 | `batches` | Batch/class groups |
| 5 | `trainers` | Trainer profiles |
| 6 | `students` | Student records + auth |
| 7 | `student_portal_credentials` | Student login credentials |
| 8 | `attendance` | Student attendance records |
| 9 | `fee_structures` | Monthly fee per program |
| 10 | `student_enrollments` | Student ↔ program mapping |
| 11 | `student_fees` | Monthly fee records |
| 12 | `payments` | Payment transactions (UPI/cash/card) |
| 13 | `fees` | Legacy fee tracking |
| 14 | `student_remarks` | Trainer/admin notes on students |
| 15 | `student_uniforms` | Uniform issuance tracking |
| 16 | `trainer_attendance` | Trainer clock-in/clock-out |
| 17 | `notifications` | System notifications |
| 18 | `system_settings` | App configuration |
