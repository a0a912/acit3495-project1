import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
app.use(express.json());

// simple MySQL pool; reads password from .env via compose
const pool = await mysql.createPool({
  host: 'mysql', port: 3306,
  user: 'root', password: process.env.MYSQL_PASSWORD || 'rootpw',
  database: 'weather_db', waitForConnections: true
});

// create
app.post('/weather', async (req, res) => {
  const { city, temp_c, humidity_pct } = req.body || {};
  if (!city || typeof temp_c !== 'number') {
    return res.status(400).json({ error: 'city and numeric temp_c required' });
  }
  await pool.execute(
    'INSERT INTO weather_readings (city, temp_c, humidity_pct) VALUES (?,?,?)',
    [city, temp_c, humidity_pct ?? null]
  );
  res.status(201).json({ ok: true });
});

// quick list
app.get('/weather', async (_req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, city, temp_c, humidity_pct, recorded_at FROM weather_readings ORDER BY id DESC LIMIT 20'
  );
  res.json(rows);
});

app.listen(3000, () => console.log('data-entry listening on 3000'));
