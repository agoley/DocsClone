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
    await pool.query(createTableQuery);
    console.log("Documents table created successfully");
  } catch (error) {
    console.error("Error creating documents table:", error);
    throw error;
  }
};

const runMigrations = async () => {
  try {
    await createDocumentTable();
    console.log("All migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
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
