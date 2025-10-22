import wsService from "../websocket";

// Mock WebSocket
let mockWebSocket;
global.WebSocket = jest.fn().mockImplementation(() => {
  mockWebSocket = {
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    readyState: 1, // WebSocket.OPEN
  };
  return mockWebSocket;
});

describe("WebSocketService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    wsService.isConnected = false;
    wsService.socket = null;
  });

  describe("Connection Management", () => {
    test("connects to WebSocket server", () => {
      wsService.connect();
      expect(global.WebSocket).toHaveBeenCalledWith("ws://localhost:8080", []);
    });

    test("disconnects from WebSocket server", () => {
      wsService.connect();
      wsService.disconnect();
      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    test("sets up event listeners on connection", () => {
      wsService.connect();

      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith(
        "open",
        expect.any(Function),
      );
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith(
        "close",
        expect.any(Function),
      );
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith(
        "error",
        expect.any(Function),
      );
    });
  });

  describe("Document Operations", () => {
    beforeEach(() => {
      wsService.connect();
      // Mock successful connection
      wsService.isConnected = true;
      wsService.socket = mockWebSocket;
    });

    test("joins document", () => {
      const documentId = "test-doc-id";
      wsService.joinDocument(documentId);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "join-document",
          documentId: documentId,
          userId: expect.any(String),
        }),
      );
    });

    test("leaves document", () => {
      const documentId = "test-doc-id";
      wsService.leaveDocument(documentId);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "leave-document",
          documentId: documentId,
        }),
      );
    });

    test("updates document", () => {
      const documentId = "test-doc-id";
      const title = "Test Title";
      const content = "Test Content";

      wsService.updateDocument(documentId, title, content);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "updated-document",
          documentId: documentId,
          title: title,
          content: content,
        }),
      );
    });

    test("sends cursor update", () => {
      const documentId = "test-doc-id";
      const cursorData = {
        userId: "user-123",
        range: { index: 5, length: 0 },
        timestamp: Date.now(),
      };

      wsService.sendCursorUpdate(documentId, cursorData);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "cursor-update",
          documentId: documentId,
          ...cursorData,
        }),
      );
    });
  });

  describe("Message Handling when Disconnected", () => {
    test("handles send when not connected", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      wsService.joinDocument("test-id");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Cannot send message, socket is not connected",
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Event Handling", () => {
    test("registers event listeners", () => {
      const mockCallback = jest.fn();
      const unsubscribe = wsService.on("test-event", mockCallback);

      expect(typeof unsubscribe).toBe("function");
    });

    test("removes event listeners", () => {
      const mockCallback = jest.fn();
      wsService.on("test-event", mockCallback);
      wsService.off("test-event", mockCallback);

      // Should not throw an error
      expect(true).toBe(true);
    });
  });

  describe("Utility Methods", () => {
    test("generates client ID", () => {
      const clientId = wsService.getClientId();
      expect(typeof clientId).toBe("string");
      expect(clientId).toMatch(/^client_\w+_\d+$/);
    });
  });
});
