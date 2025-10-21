const Document = require("../models/Document");

// Create a new document
const createDocument = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const newDocument = await Document.create(title, content || "");
    res.status(201).json(newDocument);
  } catch (error) {
    console.error("Error in createDocument:", error);
    res.status(500).json({ error: "Failed to create document" });
  }
};

// Get a single document by ID
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(document);
  } catch (error) {
    console.error("Error in getDocumentById:", error);
    res.status(500).json({ error: "Failed to retrieve document" });
  }
};

// Update a document
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title && content === undefined) {
      return res
        .status(400)
        .json({ error: "Title or content must be provided" });
    }

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const updatedDocument = await Document.update(id, {
      title: title || document.title,
      content: content !== undefined ? content : document.content,
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error("Error in updateDocument:", error);
    res.status(500).json({ error: "Failed to update document" });
  }
};

// Delete a document
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    await Document.delete(id);
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error in deleteDocument:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
};

// Get all documents
const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll();
    res.json(documents);
  } catch (error) {
    console.error("Error in getAllDocuments:", error);
    console.error("Error details:", error.message);
    console.error("Error code:", error.code);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to retrieve documents",
      details: error.message,
      code: error.code,
    });
  }
};

module.exports = {
  createDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getAllDocuments,
};
