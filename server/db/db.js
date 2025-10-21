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
}

// Test the database connection
pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL database"))
  .catch((err) => console.error("Database connection error:", err.message));

module.exports = pool;
