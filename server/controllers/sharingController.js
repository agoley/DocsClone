const { v4: uuidv4 } = require("uuid");
const Document = require("../models/Document");

// Generate or update share ID for a document
const shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Generate a new UUID for sharing
    const shareId = uuidv4();

    // Update the document with the new share ID
    const updatedDocument = await Document.setShareId(id, shareId);

    res.json({
      id: updatedDocument.id,
      shareId: updatedDocument.share_id,
      shareUrl: `${req.protocol}://${req.get("host")}/shared/${
        updatedDocument.share_id
      }`,
    });
  } catch (error) {
    console.error("Error in shareDocument:", error);
    res.status(500).json({ error: "Failed to share document" });
  }
};

// Get share URL for a document
const getShareUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!document.share_id) {
      return res.status(404).json({ error: "Document is not shared yet" });
    }

    res.json({
      id: document.id,
      shareId: document.share_id,
      shareUrl: `${req.protocol}://${req.get("host")}/shared/${
        document.share_id
      }`,
    });
  } catch (error) {
    console.error("Error in getShareUrl:", error);
    res.status(500).json({ error: "Failed to retrieve share URL" });
  }
};

// Get a document by share ID
const getSharedDocument = async (req, res) => {
  try {
    const { shareId } = req.params;
    const document = await Document.findByShareId(shareId);

    if (!document) {
      return res.status(404).json({ error: "Shared document not found" });
    }

    res.json({
      id: document.id,
      title: document.title,
      content: document.content,
      createdAt: document.created_at,
      updatedAt: document.updated_at,
    });
  } catch (error) {
    console.error("Error in getSharedDocument:", error);
    res.status(500).json({ error: "Failed to retrieve shared document" });
  }
};

module.exports = {
  shareDocument,
  getShareUrl,
  getSharedDocument,
};
