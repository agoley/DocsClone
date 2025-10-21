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
  const clientBuildPath = path.join(__dirname, "../client/build");
  const indexHtmlPath = path.join(clientBuildPath, "index.html");

  try {
    // Check if the client build directory exists
    if (require("fs").existsSync(clientBuildPath)) {
      app.use(express.static(clientBuildPath));
      app.get("*", (req, res) => {
        // Only try to serve index.html if it exists
        if (require("fs").existsSync(indexHtmlPath)) {
          res.sendFile(indexHtmlPath);
        } else {
          res
            .status(200)
            .send("API Server is running. Client app is not built yet.");
        }
      });
      console.log("Serving static files from client/build directory");
    } else {
      console.log(
        "Client build directory not found. Only API endpoints will be available.",
      );
      app.get("*", (req, res) => {
        if (req.path.startsWith("/api")) {
          // Let API routes handle these requests
          return next();
        }
        res
          .status(200)
          .send("API Server is running. Client app is not built yet.");
      });
    }
  } catch (error) {
    console.error("Error setting up static file serving:", error);
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res
          .status(200)
          .send("API Server is running. Client app is not built yet.");
      }
    });
  }
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
