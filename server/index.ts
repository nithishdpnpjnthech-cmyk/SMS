// 🔴 MUST BE FIRST — load .env BEFORE anything else
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { registerRoutes } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ✅ CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ✅ API ROUTES
registerRoutes(app);

// ================= FRONTEND SETUP =================
if (process.env.NODE_ENV === "development") {
  const vite = await createViteServer({
    configFile: path.resolve(__dirname, "..", "vite.config.ts"), // 🔥 THIS LINE FIXES EVERYTHING
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);
} else {
  const distPath = path.join(__dirname, "..", "dist", "public");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = Number(process.env.PORT) || 5050;
app.listen(PORT, () => {
  console.log(`✅ App running on http://localhost:${PORT}`);
});
