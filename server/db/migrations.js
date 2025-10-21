const pool = require("../db/db");

const createDocumentTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      share_id VARCHAR(36) UNIQUE
    );
  `;

  try {
    console.log("Creating documents table...");
    const result = await pool.query(createTableQuery);
    console.log("Documents table created successfully");

    // Verify table exists
    const checkTableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'documents';
    `;
    const checkResult = await pool.query(checkTableQuery);
    console.log("Table verification result:", checkResult.rows);
  } catch (error) {
    console.error("Error creating documents table:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      query: createTableQuery,
    });
    throw error;
  }
};

const runMigrations = async () => {
  try {
    console.log("Starting database migrations...");
    await createDocumentTable();
    console.log("All migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    console.error("Migration error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error; // Re-throw to handle in server startup
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("Database migrations completed");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration error:", err);
      process.exit(1);
    });
}

module.exports = {
  createDocumentTable,
  runMigrations,
};
