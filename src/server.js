const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3001;

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : [
      "https://ruudjuffermans.nl",
      "https://www.ruudjuffermans.nl",
    ];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server calls (no Origin header)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      return cb(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
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
      "SELECT * FROM messages ORDER BY id DESC LIMIT 100"
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


app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});
