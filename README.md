# Academy Manager - Student Management System

A comprehensive student management system built with React, Express, and PostgreSQL.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** (if running with a database) - [Download](https://www.postgresql.org/)

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/nithishdpnpjnthech-cmyk/SMS.git
cd SMS
```

### Step 2: Install Dependencies

Install all required packages using npm:

```bash
npm install
```

This will install dependencies for both the client and server as defined in `package.json`.

## Running the Project

### Option 1: Development Mode (Recommended)

Run both the backend server and frontend development server in development mode.

#### Terminal 1 - Start the Backend Server

```bash
$env:NODE_ENV='development'; npx tsx server/index.ts
```

The server will start on **http://127.0.0.1:5000**

Expected output:
```
1:40:51 PM [express] serving on port 5000
```

#### Terminal 2 - Start the Frontend Dev Server

Open a new terminal and run:

```bash
npm run dev:client
```

The frontend will be available at **http://localhost:5000/**

Expected output:
```
  VITE v7.1.12  ready in 741 ms
  ➜  Local:   http://localhost:5000/
  ➜  Network: http://172.26.0.1:5000/
```

### Option 2: Production Mode

Build and run the application in production mode.

#### Step 1: Build the Project

```bash
npm run build
```

This will compile the client and server for production.

#### Step 2: Start the Server

```bash
npm start
```

The application will be served on port 5000 with both API and client served from the same port.

## Available Scripts

```bash
npm run dev:client    # Start Vite dev server for frontend (port 5000)
npm run dev           # Start Express server in development mode
npm run build         # Build both client and server for production
npm start             # Run production server
npm run check         # Run TypeScript type checking
npm run db:push       # Push database schema changes using Drizzle
```

## Project Structure

```
.
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components (dashboard, students, etc.)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and helpers
│   │   └── App.tsx        # Main app component
│   └── index.html         # HTML entry point
├── server/                # Express backend server
│   ├── index.ts           # Main server file
│   ├── routes.ts          # API routes
│   ├── static.ts          # Static file serving
│   └── storage.ts         # Data storage logic
├── shared/               # Shared code between client and server
│   └── schema.ts         # Database schema definitions
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite bundler configuration
```

## Features

- **Student Management** - Add, view, and manage student information
- **Attendance Tracking** - Track attendance with QR code scanning
- **Fee Management** - Collect and manage student fees
- **Branch Management** - Manage multiple academy branches
- **Dashboard** - Role-based dashboards (Admin, Manager, Receptionist, Trainer)
- **Reports** - Generate comprehensive reports
- **Responsive UI** - Modern, responsive interface built with React and Shadcn UI components

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, you can specify a different port:
```bash
$env:PORT=3000; npx tsx server/index.ts
```

### ENOTSUP Error on Windows
If you encounter "listen ENOTSUP" error, this is a known Windows issue with IPv6. The fix has been applied (using 127.0.0.1 instead of 0.0.0.0).

### Dependencies Installation Issues
If `npm install` fails, try:
```bash
npm cache clean --force
rm -r node_modules
npm install
```

## Environment Variables

Create a `.env` file in the root directory (if needed):
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/academy
```

## Database Setup

If using PostgreSQL, push the schema:
```bash
npm run db:push
```

## License

MIT

