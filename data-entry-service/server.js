import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
app.use(express.json());

// simple MySQL pool; reads password from .env via compose
const pool = await mysql.createPool({
  host: 'mysql', port: 3306,
  user: 'root', password: process.env.MYSQL_PASSWORD || 'password',
  database: 'weather_db', waitForConnections: true
});

// create
// endpoint to create a new weather reading entry
// expects JSON body with city (string) and temp_c (number)
// optional: humidity_pct (number)
app.post('/weather', async (req, res) => {
  // extract required fields from request body
  const { city, temp_c, humidity_pct } = req.body || {};
  // if either city or temp_c is missing, or if temp_c is not a number, return a 400 error
  if (!city || typeof temp_c !== 'number') {
    return res.status(400).json({
      error: 'city and numeric temp_c required; please check your request body'
    });
  }
  // execute a SQL insert statement to add the new reading to the database
  // city and temp_c are required, humidity_pct is optional (defaults to null)
  await pool.execute(
    'INSERT INTO weather_readings (city, temp_c, humidity_pct) VALUES (?,?,?)',
    [city, temp_c, humidity_pct ?? null]
  );
  // return a successful response with a simple JSON payload
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
