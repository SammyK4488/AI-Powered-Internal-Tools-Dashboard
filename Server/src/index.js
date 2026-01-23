require("dotenv").config();
const { Pool } = require("pg");
const express = require("express");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Server running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({ success: true, now: result.rows[0].now });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
