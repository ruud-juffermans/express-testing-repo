const express = require("express");

const app = express();
const PORT = process.env.PORT || 3001;

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