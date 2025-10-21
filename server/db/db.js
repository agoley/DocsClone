const { Pool } = require("pg");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Determine if we're in production (Render deployment)
const isProduction = process.env.NODE_ENV === "production";

let pool;

// For Render deployment, use the connection string from environment variables
if (isProduction && process.env.RENDER_POSTGRES_URL) {
  pool = new Pool({
    connectionString: process.env.RENDER_POSTGRES_URL,
    ssl: { rejectUnauthorized: false }, // Required for Render PostgreSQL
  });
  console.log("Using Render PostgreSQL connection string");
  console.log("Database URL present:", !!process.env.RENDER_POSTGRES_URL);
} else {
  // For local development, use individual connection parameters
  pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "documents_db",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
  });
  console.log("Using local PostgreSQL connection parameters");
  console.log("Environment variables:", {
    NODE_ENV: process.env.NODE_ENV,
    RENDER_POSTGRES_URL: !!process.env.RENDER_POSTGRES_URL,
    DB_HOST: process.env.DB_HOST,
    DB_NAME: process.env.DB_NAME,
  });
}

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("Database connected successfully");

    // Test query
    const result = await client.query("SELECT NOW()");
    console.log("Database test query successful:", result.rows[0]);

    client.release();
  } catch (error) {
    console.error("Database connection error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
  }
};

// Test connection on startup
if (isProduction) {
  testConnection();
}

module.exports = pool;
