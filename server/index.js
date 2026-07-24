import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import portfinder from "portfinder";
import { connectMongo } from "./lib/mongo.js";
import adminRoutes from "./routes/admin-score.js";
import authRoutes from "./routes/auth.js";
import claimsRoutes from "./routes/claims.js";
import fraudClusterRoutes from "./routes/fraudCluster.js";

import path from "path";
dotenv.config({ path: path.resolve("server/.env") });

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"], credentials: false }));
app.use(express.json());

app.use("/api", claimsRoutes);
app.use("/api", fraudClusterRoutes);

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/claims", claimsRoutes);
app.use("/api/admin-score", adminRoutes);

const startServer = async () => {
  await connectMongo();
  const port = await portfinder.getPortPromise({
    port: Number(process.env.PORT || 3000),
    stopPort: 5000
  });
  app.listen(port, () => console.log(`API ready on http://localhost:${port}`));
};

startServer();
