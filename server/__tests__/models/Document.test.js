// Mock the entire db module to prevent database connections
jest.mock("../../db/db", () => ({
  query: jest.fn(),
}));

// Mock pg module to prevent real PostgreSQL connections
jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  })),
}));

const Document = require("../../models/Document");
const mockPool = require("../../db/db");

describe("Document Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    test("creates a new document successfully", async () => {
      const documentData = {
        title: "Test Document",
        content: "Test content",
      };

      const mockResult = {
        rows: [
          {
            id: "1",
            title: "Test Document",
            content: "Test content",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      mockPool.query.mockResolvedValue(mockResult);

      const result = await Document.create(
        documentData.title,
        documentData.content,
      );

      expect(mockPool.query).toHaveBeenCalledWith(
        "INSERT INTO documents (title, content) VALUES ($1, $2) RETURNING *",
        ["Test Document", "Test content"],
      );
      expect(result).toEqual(mockResult.rows[0]);
    });

    test("handles database errors during creation", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      await expect(Document.create("Test", "Content")).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("findById", () => {
    test("finds document by ID successfully", async () => {
      const mockDocument = {
        id: "1",
        title: "Test Document",
        content: "Test content",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockDocument] });

      const result = await Document.findById("1");

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM documents WHERE id = $1",
        ["1"],
      );
      expect(result).toEqual(mockDocument);
    });

    test("returns null when document not found", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await Document.findById("999");

      expect(result).toBeUndefined();
    });

    test("handles database errors during find", async () => {
      mockPool.query.mockRejectedValue(new Error("Database connection error"));

      await expect(Document.findById("1")).rejects.toThrow(
        "Database connection error",
      );
    });
  });

  describe("findAll", () => {
    test("retrieves all documents successfully", async () => {
      const mockDocuments = [
        {
          id: "1",
          title: "Document 1",
          content: "Content 1",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: "2",
          title: "Document 2",
          content: "Content 2",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValue({ rows: mockDocuments });

      const result = await Document.findAll();

      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT id, title, created_at, updated_at FROM documents ORDER BY updated_at DESC",
      );
      expect(result).toEqual(mockDocuments);
    });

    test("returns empty array when no documents exist", async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await Document.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("update", () => {
    test("updates document successfully", async () => {
      const updateData = {
        title: "Updated Title",
        content: "Updated content",
      };

      const mockUpdatedDocument = {
        id: "1",
        ...updateData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockUpdatedDocument] });

      const result = await Document.update("1", updateData);

      expect(mockPool.query).toHaveBeenCalledWith(
        "UPDATE documents SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
        ["Updated Title", "Updated content", "1"],
      );
      expect(result).toEqual(mockUpdatedDocument);
    });

    test("updates only title when content not provided", async () => {
      const updateData = { title: "New Title Only" };
      const mockUpdatedDocument = {
        id: "1",
        title: "New Title Only",
        content: "Original content",
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockUpdatedDocument] });

      const result = await Document.update("1", updateData);

      expect(mockPool.query).toHaveBeenCalledWith(
        "UPDATE documents SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
        ["New Title Only", undefined, "1"],
      );
      expect(result).toEqual(mockUpdatedDocument);
    });

    test("updates only content when title not provided", async () => {
      const updateData = { content: "New content only" };
      const mockUpdatedDocument = {
        id: "1",
        title: "Original Title",
        content: "New content only",
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockUpdatedDocument] });

      const result = await Document.update("1", updateData);

      expect(mockPool.query).toHaveBeenCalledWith(
        "UPDATE documents SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
        [undefined, "New content only", "1"],
      );
      expect(result).toEqual(mockUpdatedDocument);
    });
  });

  describe("delete", () => {
    test("deletes document successfully", async () => {
      const mockDeletedDocument = { id: "1", title: "Test Document" };
      mockPool.query.mockResolvedValue({ rows: [mockDeletedDocument] });

      const result = await Document.delete("1");

      expect(mockPool.query).toHaveBeenCalledWith(
        "DELETE FROM documents WHERE id = $1 RETURNING *",
        ["1"],
      );
      expect(result).toEqual(mockDeletedDocument);
    });

    test("handles database errors during deletion", async () => {
      mockPool.query.mockRejectedValue(new Error("Database error"));

      await expect(Document.delete("1")).rejects.toThrow("Database error");
    });
  });
});
