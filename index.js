import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let db;
(async () => {
  db = await open({
    filename: './scores.db',
    driver: sqlite3.Database
  });
  await db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      score INTEGER NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);
})();

// Add a new score
app.post('/scores', async (req, res) => {
  const { username, score, timestamp } = req.body;
  if (!username || typeof score !== 'number' || !timestamp) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  await db.run(
    'INSERT INTO scores (username, score, timestamp) VALUES (?, ?, ?)',
    username, score, timestamp
  );
  res.json({ success: true });
});

// Get top 5 scores
app.get('/scores/top', async (req, res) => {
  const rows = await db.all(
    'SELECT username, score FROM scores ORDER BY score DESC, timestamp ASC LIMIT 5'
  );
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`Leaderboard server running on http://localhost:${PORT}`);
}); 