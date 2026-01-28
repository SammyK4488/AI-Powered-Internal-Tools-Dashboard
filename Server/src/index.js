//Token for Login
const jwt = require("jsonwebtoken");

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

//Middleware
function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing token" });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "admin only" });
  }
  next();
}

// Create a record (must be logged in)
app.post("/records", requireAuth, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "title and content required" });
    }

    const result = await pool.query(
      `INSERT INTO public.records (user_id, title, content)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, title, content, created_at`,
      [req.user.userId, title, content]
    );

    return res.status(201).json({ record: result.rows[0] });
  } catch (err) {
    console.error("CREATE RECORD ERROR:", err);
    return res.status(500).json({ error: "server error" });
  }
});

// Get records for the logged-in user
app.get("/records", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, title, content, created_at
       FROM public.records
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    return res.json({ records: result.rows });
  } catch (err) {
    console.error("GET RECORDS ERROR:", err);
    return res.status(500).json({ error: "server error" });
  }
});

//Update Record
app.put("/records/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "title and content required" });
    }

    // Admin can update any record, normal user can only update their own
    const query =
      req.user.role === "admin"
        ? `UPDATE public.records
           SET title = $1, content = $2
           WHERE id = $3
           RETURNING id, user_id, title, content, created_at`
        : `UPDATE public.records
           SET title = $1, content = $2
           WHERE id = $3 AND user_id = $4
           RETURNING id, user_id, title, content, created_at`;

    const params =
      req.user.role === "admin"
        ? [title, content, id]
        : [title, content, id, req.user.userId];

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "record not found" });
    }

    return res.json({ record: result.rows[0] });
  } catch (err) {
    console.error("UPDATE RECORD ERROR:", err);
    return res.status(500).json({ error: "server error" });
  }
});

//Delete Record
app.delete("/records/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const query =
      req.user.role === "admin"
        ? `DELETE FROM public.records
           WHERE id = $1
           RETURNING id`
        : `DELETE FROM public.records
           WHERE id = $1 AND user_id = $2
           RETURNING id`;

    const params =
      req.user.role === "admin" ? [id] : [id, req.user.userId];

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "record not found" });
    }

    return res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    console.error("DELETE RECORD ERROR:", err);
    return res.status(500).json({ error: "server error" });
  }
});

//Test Route for Protected Route
app.get("/me", requireAuth, async (req, res) => {
  // minimal: just echo token payload for now
  res.json({ ok: true, user: req.user });
});

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

//Login Route
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    const result = await pool.query(
      "SELECT id, email, password_hash, role FROM public.users WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const user = result.rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
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
