// Load environment variables from .env file
require("dotenv").config();

// Web framework for handling HTTP routes
const express = require("express");

// PostgreSQL client (used for Supabase connection)
const { Pool } = require("pg");

// Register Route
const bcrypt = require("bcryptjs");

// Initialize Express app
const app = express();

//JSON Parsing Middleware
app.use(express.json());

// Create a connection pool to the database
// Uses DATABASE_URL from environment variables
// SSL is required for Supabase-hosted Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const PORT = process.env.PORT || 3000;

// Root route — basic server sanity check
app.get("/", (req, res) => {
  res.send("Server running");
});

// Health check route — used for uptime / monitoring
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Registration Route
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation (minimal)
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    // Prevent duplicate emails
    const existing = await pool.query(
      "SELECT id FROM public.users WHERE email = $1",
      [email]
    );
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "email already registered" });
    }

    // Hash password before storing
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user (default role = user)
    const result = await pool.query(
      `INSERT INTO public.users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, role, created_at`,
      [email, passwordHash]
    );

    return res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ error: "server error" });
  }
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
