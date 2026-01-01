const express = require("express");
const cors = require("cors");


const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors({
  origin: "https://ruudjuffermans.nl",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


app.use(express.json());

// health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// API endpoint
app.get("/api/message", (req, res) => {
  res.json({
    message: "Hello from Express API",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});