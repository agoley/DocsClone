const Document = require("../models/Document");

// Store active connections by document ID
const activeConnections = new Map();

// Set up WebSocket server
const setupWebSocket = (wss) => {
  wss.on("connection", (ws) => {
    console.log("New WebSocket connection established");
    let documentId = null;
    let userId = null;

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case "join-document":
            await handleJoinDocument(ws, data, activeConnections);
            documentId = data.documentId;
            userId = data.userId;
            ws.userId = userId; // Store userId on the WebSocket
            break;

          case "updated-document":
            await handleDocumentUpdate(ws, data, activeConnections);
            break;

          case "leave-document":
            handleLeaveDocument(ws, data, activeConnections);
            documentId = null;
            break;

          case "cursor-update":
            handleCursorUpdate(ws, data, activeConnections);
            break;

          default:
            console.warn("Unknown WebSocket message type:", data.type);
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
        ws.send(
          JSON.stringify({ type: "error", message: "Invalid message format" }),
        );
      }
    });

    // Handle disconnect
    ws.on("close", () => {
      if (documentId) {
        handleLeaveDocument(ws, { documentId, userId }, activeConnections);
      }
      console.log("WebSocket connection closed");
    });
  });
};

// Handle joining a document
const handleJoinDocument = async (ws, data, activeConnections) => {
  const { documentId } = data;

  try {
    // Validate that the document exists
    const document = await Document.findById(documentId);
    if (!document) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Document not found",
        }),
      );
      return;
    }

    // Add to active connections for this document
    if (!activeConnections.has(documentId)) {
      activeConnections.set(documentId, new Set());
    }
    activeConnections.get(documentId).add(ws);

    // Send confirmation and current document state
    ws.send(
      JSON.stringify({
        type: "document-joined",
        document: {
          id: document.id,
          title: document.title,
          content: document.content,
          updatedAt: document.updated_at,
        },
      }),
    );

    // Notify others that someone joined
    broadcastToDocument(documentId, activeConnections, ws, {
      type: "user-joined",
      documentId,
      activeUsers: activeConnections.get(documentId).size,
    });

    console.log(
      `User joined document ${documentId}. Active users: ${
        activeConnections.get(documentId).size
      }`,
    );
  } catch (error) {
    console.error(`Error joining document ${documentId}:`, error);
    ws.send(
      JSON.stringify({ type: "error", message: "Failed to join document" }),
    );
  }
};

// Handle document updates
const handleDocumentUpdate = async (ws, data, activeConnections) => {
  const { documentId, title, content } = data;

  if (
    !activeConnections.has(documentId) ||
    !activeConnections.get(documentId).has(ws)
  ) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "You must join the document first",
      }),
    );
    return;
  }

  try {
    // Update document in database
    const updatedDocument = await Document.update(documentId, {
      title: title || undefined,
      content: content !== undefined ? content : undefined,
    });

    // Broadcast update to all other connected clients
    broadcastToDocument(documentId, activeConnections, ws, {
      type: "document-updated",
      document: {
        id: updatedDocument.id,
        title: updatedDocument.title,
        content: updatedDocument.content,
        updatedAt: updatedDocument.updated_at,
      },
    });

    // Confirm update to the sender
    ws.send(
      JSON.stringify({
        type: "update-confirmed",
        documentId,
        updatedAt: updatedDocument.updated_at,
      }),
    );

    console.log(`Document ${documentId} updated by a user`);
  } catch (error) {
    console.error(`Error updating document ${documentId}:`, error);
    ws.send(
      JSON.stringify({ type: "error", message: "Failed to update document" }),
    );
  }
};

// Handle leaving a document
const handleLeaveDocument = (ws, data, activeConnections) => {
  const { documentId, userId } = data;

  if (activeConnections.has(documentId)) {
    const connections = activeConnections.get(documentId);
    connections.delete(ws);

    // Notify remaining users
    if (connections.size > 0) {
      broadcastToDocument(documentId, activeConnections, ws, {
        type: "user-left",
        documentId,
        userId: userId || ws.userId,
        activeUsers: connections.size,
      });
    } else {
      // No users left, clean up
      activeConnections.delete(documentId);
    }

    console.log(
      `User left document ${documentId}. Remaining users: ${connections.size}`,
    );
  }
};

// Handle cursor position updates
const handleCursorUpdate = (ws, data, activeConnections) => {
  const { documentId, userId, range, timestamp } = data;

  // Validate data
  if (!documentId || !userId || !range) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Invalid cursor update data",
      }),
    );
    return;
  }

  // Broadcast cursor position to other users in the document
  broadcastToDocument(documentId, activeConnections, ws, {
    type: "cursor-update",
    documentId,
    userId,
    range,
    timestamp: timestamp || Date.now(),
  });
};

// Helper to broadcast to all clients for a document except the sender
const broadcastToDocument = (
  documentId,
  activeConnections,
  excludeWs,
  message,
) => {
  if (!activeConnections.has(documentId)) return;

  const connections = activeConnections.get(documentId);
  connections.forEach((client) => {
    if (client !== excludeWs && client.readyState === 1) {
      // WebSocket.OPEN
      client.send(JSON.stringify(message));
    }
  });
};

module.exports = setupWebSocket;
