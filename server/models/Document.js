const pool = require("../db/db");

class Document {
  // Create a new document
  static async create(title, content) {
    const query =
      "INSERT INTO documents (title, content) VALUES ($1, $2) RETURNING *";
    const values = [title, content];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  }

  // Get a document by ID
  static async findById(id) {
    const query = "SELECT * FROM documents WHERE id = $1";
    const values = [id];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error("Error finding document:", error);
      throw error;
    }
  }

  // Get a document by share ID
  static async findByShareId(shareId) {
    const query = "SELECT * FROM documents WHERE share_id = $1";
    const values = [shareId];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error("Error finding shared document:", error);
      throw error;
    }
  }

  // Update a document
  static async update(id, { title, content }) {
    const query =
      "UPDATE documents SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *";
    const values = [title, content, id];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  }

  // Delete a document
  static async delete(id) {
    const query = "DELETE FROM documents WHERE id = $1 RETURNING *";
    const values = [id];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  }

  // Get all documents
  static async findAll() {
    const query =
      "SELECT id, title, created_at, updated_at FROM documents ORDER BY updated_at DESC";

    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error("Error fetching all documents:", error);
      throw error;
    }
  }

  // Set or update document share ID
  static async setShareId(id, shareId) {
    const query =
      "UPDATE documents SET share_id = $1 WHERE id = $2 RETURNING *";
    const values = [shareId, id];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error("Error setting share ID:", error);
      throw error;
    }
  }
}

module.exports = Document;
