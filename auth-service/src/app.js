import express from "express";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(express.json());

// Basic health for container orchestration
app.get("/health", (_req, res) => res.json({ ok: true }));

// Routes
app.use("/auth", authRoutes);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: "not_found" }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

export default app;
