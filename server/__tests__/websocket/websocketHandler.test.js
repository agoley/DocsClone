const setupWebSocket = require("../../websocket/websocketHandler");
const Document = require("../../models/Document");

// Mock the Document model
jest.mock("../../models/Document");

// Mock WebSocket Server
const mockWss = {
  on: jest.fn(),
};

// Mock WebSocket connection
const createMockWebSocket = () => ({
  send: jest.fn(),
  on: jest.fn(),
  userId: null,
  readyState: 1, // WebSocket.OPEN
});

describe("WebSocket Handler", () => {
  let mockWs1, mockWs2;
  let activeConnections;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWs1 = createMockWebSocket();
    mockWs2 = createMockWebSocket();

    // Mock the active connections Map
    activeConnections = new Map();

    Document.findById.mockResolvedValue({
      id: "test-doc-id",
      title: "Test Document",
      content: "Test content",
      updated_at: new Date().toISOString(),
    });
  });

  describe("Connection Management", () => {
    test("sets up WebSocket server with connection handler", () => {
      setupWebSocket(mockWss);

      expect(mockWss.on).toHaveBeenCalledWith(
        "connection",
        expect.any(Function),
      );
    });

    test("handles new WebSocket connection", () => {
      setupWebSocket(mockWss);

      const connectionHandler = mockWss.on.mock.calls[0][1];

      // Simulate new connection
      connectionHandler(mockWs1);

      expect(mockWs1.on).toHaveBeenCalledWith("message", expect.any(Function));
      expect(mockWs1.on).toHaveBeenCalledWith("close", expect.any(Function));
    });
  });

  describe("Document Operations", () => {
    let messageHandler;

    beforeEach(() => {
      setupWebSocket(mockWss);
      const connectionHandler = mockWss.on.mock.calls[0][1];
      connectionHandler(mockWs1);

      messageHandler = mockWs1.on.mock.calls.find(
        (call) => call[0] === "message",
      )[1];
    });

    test("handles join-document message", async () => {
      const joinMessage = JSON.stringify({
        type: "join-document",
        documentId: "test-doc-id",
        userId: "user-123",
      });

      await messageHandler(joinMessage);

      expect(Document.findById).toHaveBeenCalledWith("test-doc-id");

      // Verify the message was sent with correct structure
      expect(mockWs1.send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(mockWs1.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe("document-joined");
      expect(sentMessage.document.id).toBe("test-doc-id");
      expect(sentMessage.document.title).toBe("Test Document");
      expect(sentMessage.document.content).toBe("Test content");
      expect(typeof sentMessage.document.updatedAt).toBe("string");
    });

    test("handles join-document for non-existent document", async () => {
      Document.findById.mockResolvedValue(null);

      const joinMessage = JSON.stringify({
        type: "join-document",
        documentId: "non-existent-id",
        userId: "user-123",
      });

      await messageHandler(joinMessage);

      expect(mockWs1.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "error",
          message: "Document not found",
        }),
      );
    });

    test("handles updated-document message", async () => {
      // First join a document
      const joinMessage = JSON.stringify({
        type: "join-document",
        documentId: "test-doc-id",
        userId: "user-123",
      });
      await messageHandler(joinMessage);

      // Then update it
      const updateMessage = JSON.stringify({
        type: "updated-document",
        documentId: "test-doc-id",
        title: "Updated Title",
        content: "Updated content",
      });

      await messageHandler(updateMessage);

      // Should broadcast to other users (but we only have one connection in this test)
      // The handler would broadcast if there were multiple connections
    });

    test("handles cursor-update message", async () => {
      const cursorMessage = JSON.stringify({
        type: "cursor-update",
        documentId: "test-doc-id",
        userId: "user-123",
        range: { index: 5, length: 0 },
        timestamp: Date.now(),
      });

      await messageHandler(cursorMessage);

      // Cursor update should be processed without errors
      expect(mockWs1.send).not.toHaveBeenCalledWith(
        expect.stringContaining("error"),
      );
    });

    test("handles cursor-remove message", async () => {
      const cursorRemoveMessage = JSON.stringify({
        type: "cursor-remove",
        documentId: "test-doc-id",
        userId: "user-123",
      });

      await messageHandler(cursorRemoveMessage);

      // Cursor remove should be processed without errors
      expect(mockWs1.send).not.toHaveBeenCalledWith(
        expect.stringContaining("error"),
      );
    });

    test("handles invalid cursor-update message", async () => {
      const invalidCursorMessage = JSON.stringify({
        type: "cursor-update",
        // Missing required fields
      });

      await messageHandler(invalidCursorMessage);

      expect(mockWs1.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "error",
          message: "Invalid cursor update data",
        }),
      );
    });

    test("handles leave-document message", async () => {
      // First join a document
      const joinMessage = JSON.stringify({
        type: "join-document",
        documentId: "test-doc-id",
        userId: "user-123",
      });
      await messageHandler(joinMessage);

      // Then leave it
      const leaveMessage = JSON.stringify({
        type: "leave-document",
        documentId: "test-doc-id",
        userId: "user-123",
      });

      await messageHandler(leaveMessage);

      // Should handle leaving without errors
      expect(mockWs1.send).not.toHaveBeenCalledWith(
        expect.stringContaining("error"),
      );
    });

    test("handles unknown message type", async () => {
      const unknownMessage = JSON.stringify({
        type: "unknown-type",
        data: "some data",
      });

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      await messageHandler(unknownMessage);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Unknown WebSocket message type:",
        "unknown-type",
      );

      consoleSpy.mockRestore();
    });

    test("handles invalid JSON message", async () => {
      const invalidJSON = "invalid json string";

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await messageHandler(invalidJSON);

      expect(mockWs1.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        }),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Connection Close Handling", () => {
    test("handles WebSocket close", () => {
      setupWebSocket(mockWss);
      const connectionHandler = mockWss.on.mock.calls[0][1];
      connectionHandler(mockWs1);

      const closeHandler = mockWs1.on.mock.calls.find(
        (call) => call[0] === "close",
      )[1];

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      closeHandler();

      expect(consoleSpy).toHaveBeenCalledWith("WebSocket connection closed");
      consoleSpy.mockRestore();
    });
  });
});
