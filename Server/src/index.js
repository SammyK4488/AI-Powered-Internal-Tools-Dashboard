// Load environment variables from .env file
require("dotenv").config();

// PostgreSQL client (used for Supabase connection)
const { Pool } = require("pg");

// Web framework for handling HTTP routes
const express = require("express");

// Create a connection pool to the database
// Uses DATABASE_URL from environment variables
// SSL is required for Supabase-hosted Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Initialize Express app
const app = express();
const PORT = 3000;

// Root route — basic server sanity check
app.get("/", (req, res) => {
  res.send("Server running");
});

// Health check route — used for uptime / monitoring
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Database connectivity test route
// Confirms Postgres connection and query execution
app.get("/db-test", async (req, res) => {
  try {
    // Simple query to verify DB access
    const result = await pool.query("SELECT NOW() as now");
    res.json({ success: true, now: result.rows[0].now });
  } catch (err) {
    // Log error for debugging
    console.error("DB ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
