import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const TTL_MIN = Number(process.env.JWT_TTL_MINUTES || 20);

function signAccess(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email },
    JWT_SECRET,
    { expiresIn: `${TTL_MIN}m` }
  );
}

router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email_password_required" });

    const hash = await bcrypt.hash(password, 12);
    await pool.execute(
      "INSERT INTO users (email, password_hash, name) VALUES (?,?,?)",
      [email, hash, name || null]
    );
    return res.status(201).end();
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "email_exists" });
    return next(e);
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email_password_required" });

  const [rows] = await pool.execute("SELECT * FROM users WHERE email=?", [email]);
  const user = rows?.[0];
  if (!user) return res.status(401).json({ error: "invalid_credentials" });

  // password_hash is a Buffer (VARBINARY); convert to string for bcrypt
  const ok = await bcrypt.compare(password, Buffer.from(user.password_hash).toString());
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  const access_token = signAccess(user);
  return res.json({ access_token });
});

router.get("/me", (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "missing_token" });

  try {
    const c = jwt.verify(token, JWT_SECRET);
    return res.json({ id: c.sub, email: c.email });
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
});

export default router;
