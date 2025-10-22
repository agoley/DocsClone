const request = require("supertest");
const express = require("express");
const documentsRoutes = require("../../routes/documents");
const Document = require("../../models/Document");

// Mock the Document model
jest.mock("../../models/Document");

const app = express();
app.use(express.json());
app.use("/api/documents", documentsRoutes);

describe("Documents API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/documents", () => {
    test("creates a new document successfully", async () => {
      const newDocument = {
        title: "Test Document",
        content: "This is test content",
      };

      const createdDocument = {
        id: "1",
        ...newDocument,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      Document.create.mockResolvedValue(createdDocument);

      const response = await request(app)
        .post("/api/documents")
        .send(newDocument)
        .expect(201);

      expect(response.body).toEqual(createdDocument);
      expect(Document.create).toHaveBeenCalledWith(
        newDocument.title,
        newDocument.content,
      );
    });

    test("returns 400 for missing title", async () => {
      const invalidDocument = {
        content: "Content without title",
      };

      const response = await request(app)
        .post("/api/documents")
        .send(invalidDocument)
        .expect(400);

      expect(response.body.error).toBe("Title is required");
      expect(Document.create).not.toHaveBeenCalled();
    });

    test("handles database errors", async () => {
      const newDocument = {
        title: "Test Document",
        content: "Test content",
      };

      Document.create.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .post("/api/documents")
        .send(newDocument)
        .expect(500);

      expect(response.body.error).toBe("Failed to create document");
    });
  });

  describe("GET /api/documents/:id", () => {
    test("retrieves document by ID successfully", async () => {
      const mockDocument = {
        id: "1",
        title: "Test Document",
        content: "Test content",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      Document.findById.mockResolvedValue(mockDocument);

      const response = await request(app).get("/api/documents/1").expect(200);

      expect(response.body).toEqual(mockDocument);
      expect(Document.findById).toHaveBeenCalledWith("1");
    });

    test("returns 404 for non-existent document", async () => {
      Document.findById.mockResolvedValue(null);

      const response = await request(app).get("/api/documents/999").expect(404);

      expect(response.body.error).toBe("Document not found");
    });

    test("handles database errors", async () => {
      Document.findById.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/api/documents/1").expect(500);

      expect(response.body.error).toBe("Failed to retrieve document");
    });
  });

  describe("PUT /api/documents/:id", () => {
    test("updates document successfully", async () => {
      const existingDocument = {
        id: "1",
        title: "Old Title",
        content: "Old content",
      };

      const updateData = {
        title: "New Title",
        content: "New content",
      };

      const updatedDocument = {
        id: "1",
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      Document.findById.mockResolvedValue(existingDocument);
      Document.update.mockResolvedValue(updatedDocument);

      const response = await request(app)
        .put("/api/documents/1")
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedDocument);
      expect(Document.update).toHaveBeenCalledWith("1", updateData);
    });

    test("returns 404 for non-existent document", async () => {
      Document.findById.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/documents/999")
        .send({ title: "New Title" })
        .expect(404);

      expect(response.body.error).toBe("Document not found");
      expect(Document.update).not.toHaveBeenCalled();
    });

    test("returns 400 when no update data provided", async () => {
      const response = await request(app)
        .put("/api/documents/1")
        .send({})
        .expect(400);

      expect(response.body.error).toBe("Title or content must be provided");
    });

    test("handles payload too large error", async () => {
      const existingDocument = { id: "1", title: "Test", content: "Test" };
      Document.findById.mockResolvedValue(existingDocument);

      const error = new Error("Payload too large");
      error.type = "entity.too.large";
      Document.update.mockRejectedValue(error);

      const response = await request(app)
        .put("/api/documents/1")
        .send({ content: "Very large content..." })
        .expect(413);

      expect(response.body.error).toContain("Request payload too large");
    });
  });

  describe("DELETE /api/documents/:id", () => {
    test("deletes document successfully", async () => {
      const existingDocument = {
        id: "1",
        title: "Test Document",
        content: "Test content",
      };

      Document.findById.mockResolvedValue(existingDocument);
      Document.delete.mockResolvedValue();

      const response = await request(app)
        .delete("/api/documents/1")
        .expect(200);

      expect(response.body.message).toBe("Document deleted successfully");
      expect(Document.delete).toHaveBeenCalledWith("1");
    });

    test("returns 404 for non-existent document", async () => {
      Document.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete("/api/documents/999")
        .expect(404);

      expect(response.body.error).toBe("Document not found");
      expect(Document.delete).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/documents", () => {
    test("retrieves all documents successfully", async () => {
      const mockDocuments = [
        {
          id: "1",
          title: "Document 1",
          content: "Content 1",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Document 2",
          content: "Content 2",
          created_at: new Date().toISOString(),
        },
      ];

      Document.findAll.mockResolvedValue(mockDocuments);

      const response = await request(app).get("/api/documents").expect(200);

      expect(response.body).toEqual(mockDocuments);
      expect(Document.findAll).toHaveBeenCalled();
    });

    test("handles database errors", async () => {
      Document.findAll.mockRejectedValue(
        new Error("Database connection error"),
      );

      const response = await request(app).get("/api/documents").expect(500);

      expect(response.body.error).toBe("Failed to retrieve documents");
    });

    test("returns empty array when no documents exist", async () => {
      Document.findAll.mockResolvedValue([]);

      const response = await request(app).get("/api/documents").expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
