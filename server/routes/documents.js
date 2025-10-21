const express = require("express");
const router = express.Router();
const {
  createDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getAllDocuments,
} = require("../controllers/documentsController");

// POST /api/documents - Create a new document
router.post("/", createDocument);

// GET /api/documents/:id - Get a document by ID
router.get("/:id", getDocumentById);

// PUT /api/documents/:id - Update a document
router.put("/:id", updateDocument);

// DELETE /api/documents/:id - Delete a document
router.delete("/:id", deleteDocument);

// GET /api/documents - Get all documents
router.get("/", getAllDocuments);

module.exports = router;
