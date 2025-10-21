const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Import routes
const documentsRoutes = require("./routes/documents");
const sharingRoutes = require("./routes/sharing");

// Import WebSocket handlers
const setupWebSocket = require("./websocket/websocketHandler");

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/documents", documentsRoutes);
app.use("/api/documents", sharingRoutes);

// Setup WebSocket server
const wss = new WebSocket.Server({ server });
setupWebSocket(wss);

// Serve static files from React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server;
