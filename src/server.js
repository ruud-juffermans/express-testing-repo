const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3001;

const app = express();

app.use(
  cors({
    origin: "https://ruudjuffermans.nl",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Postgres pool (use Dokploy env vars)
const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  // In a private docker network, typically no TLS
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
});

// Simple DB init (for MVP). For production you’d use migrations.
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log("DB ready: ensured table messages exists");
}

// health check
app.get("/health", async (req, res) => {
  try {
    // optional DB ping
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "ok" });
  } catch (e) {
    res.status(500).json({ status: "ok", db: "down", error: e.message });
  }
});

// List messages
app.get("/dbmessages", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, content, created_at FROM messages ORDER BY id DESC LIMIT 100"
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create a message
app.post("/dbmessage", async (req, res) => {
  try {
    const { content } = req.body;

    if (typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "content is required" });
    }

    const result = await pool.query(
      "INSERT INTO messages (content) VALUES ($1) RETURNING id, content, created_at",
      [content.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Keep your existing endpoint if you want
app.get("/servermessage", (req, res) => {
  res.json({
    message: "Hello from Express API",
    timestamp: new Date().toISOString(),
  });
});

initDb()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to init DB:", err);
    process.exit(1);
  });
