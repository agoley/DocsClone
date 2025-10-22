class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = {
      "document-updated": [],
      "document-joined": [],
      "user-joined": [],
      "user-left": [],
      "cursor-update": [],
      "cursor-remove": [],
      "user-disconnected": [],
      error: [],
    };
    this.currentDocumentId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.clientId = this.generateClientId();
  }

  connect() {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const apiUrl =
      process.env.REACT_APP_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://docsclone-mu6c.onrender.com"
        : "http://localhost:3001");

    // Convert the API URL to WebSocket URL
    // Example: https://api.example.com -> wss://api.example.com
    // or http://localhost:3001 -> ws://localhost:3001
    const wsUrl =
      process.env.REACT_APP_WS_URL ||
      (apiUrl
        ? apiUrl.replace(/^https?/, protocol)
        : `${protocol}://${window.location.host}`);

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log("🌬️ SkyWrite connected to the wind currents");
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Rejoin document if there was one active
      if (this.currentDocumentId) {
        this.joinDocument(this.currentDocumentId);
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.listeners[data.type]) {
          this.listeners[data.type].forEach((callback) => callback(data));
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.socket.onclose = (event) => {
      console.log("WebSocket disconnected:", event.code, event.reason);
      this.isConnected = false;

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectTimeout = setTimeout(() => {
          this.reconnectAttempts++;
          console.log(
            `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
          );
          this.connect();
        }, 2000 * Math.pow(2, this.reconnectAttempts));
      } else {
        console.log("Max reconnect attempts reached");
        this.notifyError("Connection lost. Please refresh the page.");
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.notifyError("Connection error occurred");
    };
  }

  disconnect() {
    if (this.socket) {
      if (this.currentDocumentId) {
        this.leaveDocument(this.currentDocumentId);
      }

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.currentDocumentId = null;
    }
  }

  joinDocument(documentId) {
    if (!this.isConnected) {
      this.currentDocumentId = documentId;
      this.connect();
      return;
    }

    this.currentDocumentId = documentId;
    this.sendMessage({
      type: "join-document",
      documentId: documentId.toString(),
      userId: this.clientId,
    });
  }

  leaveDocument(documentId) {
    if (this.isConnected) {
      this.sendMessage({
        type: "leave-document",
        documentId: documentId.toString(),
      });
    }
    this.currentDocumentId = null;
  }

  updateDocument(documentId, title, content) {
    this.sendMessage({
      type: "updated-document",
      documentId: documentId.toString(),
      title,
      content,
    });
  }

  sendCursorUpdate(documentId, cursorData) {
    this.sendMessage({
      type: "cursor-update",
      documentId: documentId.toString(),
      ...cursorData,
    });
  }

  getClientId() {
    return this.clientId;
  }

  generateClientId() {
    return (
      "client_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now()
    );
  }

  sendMessage(data) {
    if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn("Cannot send message, socket is not connected");
      if (!this.isConnected) {
        this.connect();
      }
    }
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback,
      );
    }
  }

  notifyError(message) {
    if (this.listeners.error) {
      this.listeners.error.forEach((callback) => callback({ message }));
    }
  }
}

// Create a singleton instance
const wsService = new WebSocketService();

export default wsService;
