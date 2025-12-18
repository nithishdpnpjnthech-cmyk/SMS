import express from "express";
import { registerRoutes } from "./routes";

const app = express();

app.use(express.json());

// ✅ CORS (OK for development)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ✅ USE ENV PORT (VERY IMPORTANT)
const PORT = Number(process.env.PORT) || 5050;

const server = app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});

registerRoutes(server, app);
