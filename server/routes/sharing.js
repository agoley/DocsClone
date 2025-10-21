const express = require("express");
const router = express.Router();
const {
  shareDocument,
  getShareUrl,
  getSharedDocument,
} = require("../controllers/sharingController");

// POST /api/documents/:id/share - Generate or update share ID
router.post("/:id/share", shareDocument);

// GET /api/documents/:id/share-url - Get share URL for a document
router.get("/:id/share-url", getShareUrl);

// GET /api/shared/:shareId - Get a document by share ID
router.get("/shared/:shareId", getSharedDocument);

module.exports = router;
