class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = {
      "document-updated": [],
      "document-joined": [],
      "user-joined": [],
      "user-left": [],
      error: [],
    };
    this.currentDocumentId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
  }

  connect() {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl =
      process.env.REACT_APP_WS_URL || `${protocol}://${window.location.host}`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log("WebSocket connected");
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
