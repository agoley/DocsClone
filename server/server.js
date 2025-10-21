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
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Debug endpoint
app.get("/api/debug", async (req, res) => {
  try {
    const pool = require("./db/db");
    
    // Check if documents table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'documents'
    `);
    
    // Count documents
    let documentCount = 0;
    let documents = [];
    
    if (tableCheck.rows.length > 0) {
      const countResult = await pool.query('SELECT COUNT(*) FROM documents');
      documentCount = parseInt(countResult.rows[0].count);
      
      const docsResult = await pool.query('SELECT * FROM documents LIMIT 5');
      documents = docsResult.rows;
    }
    
    res.json({
      status: "OK",
      database: {
        connected: true,
        tableExists: tableCheck.rows.length > 0,
        documentCount,
        sampleDocuments: documents
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use("/api/documents", documentsRoutes);
app.use("/api/documents", sharingRoutes);

// Setup WebSocket server
const wss = new WebSocket.Server({ server });
setupWebSocket(wss);

// Serve static files from React app in production
if (process.env.NODE_ENV === "production" && process.env.API_ONLY !== "true") {
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
} else if (
  process.env.NODE_ENV === "production" &&
  process.env.API_ONLY === "true"
) {
  // API-only mode - serve a documentation page at the root
  console.log("Running in API-only mode");
  app.get("/", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Documents API - Render Deployment</title>
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2a62d3; }
          h2 { color: #444; margin-top: 30px; }
          pre { background: #f6f8fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
          .endpoint { background: #f0f4f9; padding: 10px 15px; margin: 10px 0; border-left: 4px solid #2a62d3; border-radius: 3px; }
          .method { font-weight: bold; color: #2a62d3; }
          .url { font-family: monospace; }
          p { margin: 15px 0; }
          .success { color: #0ca678; }
          .note { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>Documents API - Render Deployment</h1>
        <p class="success">✓ API Server is running successfully in API-only mode</p>
        
        <div class="note">
          <strong>Note:</strong> This deployment is running in API-only mode. The client application is not included.
        </div>
        
        <h2>API Endpoints</h2>
        
        <h3>Document Management</h3>
        <div class="endpoint">
          <span class="method">POST</span> <span class="url">/api/documents</span>
          <p>Create a new document</p>
        </div>
        
        <div class="endpoint">
          <span class="method">GET</span> <span class="url">/api/documents/:id</span>
          <p>Retrieve document by ID</p>
        </div>
        
        <div class="endpoint">
          <span class="method">PUT</span> <span class="url">/api/documents/:id</span>
          <p>Update document</p>
        </div>
        
        <div class="endpoint">
          <span class="method">DELETE</span> <span class="url">/api/documents/:id</span>
          <p>Delete a document</p>
        </div>
        
        <div class="endpoint">
          <span class="method">GET</span> <span class="url">/api/documents</span>
          <p>Retrieve all documents</p>
        </div>
        
        <h3>Document Sharing</h3>
        <div class="endpoint">
          <span class="method">POST</span> <span class="url">/api/documents/:id/share</span>
          <p>Generate or update share ID</p>
        </div>
        
        <div class="endpoint">
          <span class="method">GET</span> <span class="url">/api/documents/:id/share-url</span>
          <p>Retrieve share URL</p>
        </div>
        
        <div class="endpoint">
          <span class="method">GET</span> <span class="url">/api/documents/shared/:shareId</span>
          <p>Retrieve shared document</p>
        </div>
      </body>
      </html>
    `);
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

// Run database migrations before starting the server
const { runMigrations } = require("./db/migrations");

const startServer = async () => {
  try {
    // Run database migrations
    console.log("Running database migrations...");
    await runMigrations();
    console.log("Database migrations completed successfully");

    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    console.error("Migration error details:", error.message);
    process.exit(1);
  }
};

// Start the server with migrations
startServer();

module.exports = server;
