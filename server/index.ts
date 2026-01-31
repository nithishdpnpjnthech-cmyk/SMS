// 🔴 MUST BE FIRST — load .env BEFORE anything else
import "dotenv/config";

import express from "express";
import path from "path";
import cors from "cors";
import { registerRoutes } from "./routes";

const app = express();

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger to aid debugging incoming API calls (dev only)
app.use((req, res, next) => {
  try {
    const shortBody = req.body && Object.keys(req.body).length ? JSON.stringify(Object.assign({}, req.body, { password: req.body.password ? '***' : undefined })).slice(0, 1000) : '';
    console.log(`[req] ${new Date().toISOString()} ${req.method} ${req.originalUrl} origin=${req.get('origin') || '-'} body=${shortBody}`);
  } catch (e) {}
  next();
});

// ✅ CORS — DEV SAFE
// CORS: allow the development frontend and production origin when provided
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;

  // Dev-friendly CORS: allow any localhost origin (any port) and 127.0.0.1
  // This avoids the frontend changing port (Vite) causing preflight failures.
  try {
    if (origin) {
      const url = new URL(origin);
      const hostname = url.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      } else {
        // Fallback: allow explicit known origins (production)
        const allowedOrigins = [
          'http://localhost:5175',
          'http://127.0.0.1:5175',
          'http://localhost:5050',
          'http://127.0.0.1:5050'
        ];
        if (allowedOrigins.includes(origin)) {
          res.header('Access-Control-Allow-Origin', origin);
          res.header('Access-Control-Allow-Credentials', 'true');
        } else {
          res.header('Access-Control-Allow-Origin', '*');
        }
      }
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
  } catch (e) {
    // If parsing fails, fall back to wildcard (no credentials)
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-role, x-user-id, x-user-branch');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});

// ✅ REQUIRED for browser preflight requests
app.options("*", cors());

// ================= API ROUTES =================
registerRoutes(app);

// ================= PRODUCTION STATIC SERVE =================
// ❌ DO NOT run Vite middleware in dev (Vite runs separately on 5175)
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "client", "dist");

  app.use(express.static(distPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ================= SERVER START =================
const PORT = Number(process.env.PORT) || 5051;

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});

