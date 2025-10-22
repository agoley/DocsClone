import { documentsApi } from "../api";

// Mock axios
const axios = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};
// Mock axios
jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

import axios from "axios";
import { documentsApi } from "../api";
const mockedAxios = axios;

// Mock axios.create to return the mocked axios instance
mockedAxios.create.mockReturnValue(mockedAxios);

describe("documentsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllDocuments", () => {
    test("fetches all documents successfully", async () => {
      const mockDocuments = [
        { id: "1", title: "Doc 1", content: "Content 1" },
        { id: "2", title: "Doc 2", content: "Content 2" },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockDocuments });

      const result = await documentsApi.getAllDocuments();

      expect(mockedAxios.get).toHaveBeenCalledWith("/api/documents");
      expect(result).toEqual(mockDocuments);
    });

    test("handles API error", async () => {
      mockedAxios.get.mockRejectedValue(new Error("API Error"));

      await expect(documentsApi.getAllDocuments()).rejects.toThrow("API Error");
    });
  });

  describe("getDocumentById", () => {
    test("fetches document by ID successfully", async () => {
      const mockDocument = {
        id: "1",
        title: "Test Doc",
        content: "Test Content",
      };

      mockedAxios.get.mockResolvedValue({ data: mockDocument });

      const result = await documentsApi.getDocumentById("1");

      expect(mockedAxios.get).toHaveBeenCalledWith("/api/documents/1");
      expect(result).toEqual(mockDocument);
    });

    test("handles document not found", async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 404, data: { error: "Document not found" } },
      });

      await expect(documentsApi.getDocumentById("999")).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe("createDocument", () => {
    test("creates document successfully", async () => {
      const newDocument = { title: "New Doc", content: "New Content" };
      const createdDocument = { id: "3", ...newDocument };

      mockedAxios.post.mockResolvedValue({ data: createdDocument });

      const result = await documentsApi.createDocument(newDocument);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/documents",
        newDocument,
      );
      expect(result).toEqual(createdDocument);
    });

    test("handles validation errors", async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 400, data: { error: "Title is required" } },
      });

      await expect(documentsApi.createDocument({})).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
  });

  describe("updateDocument", () => {
    test("updates document successfully", async () => {
      const updateData = { title: "Updated Title", content: "Updated Content" };
      const updatedDocument = { id: "1", ...updateData };

      mockedAxios.put.mockResolvedValue({ data: updatedDocument });

      const result = await documentsApi.updateDocument("1", updateData);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        "/api/documents/1",
        updateData,
      );
      expect(result).toEqual(updatedDocument);
    });

    test("handles payload too large error", async () => {
      mockedAxios.put.mockRejectedValue({
        response: {
          status: 413,
          data: { error: "Request payload too large" },
        },
      });

      await expect(
        documentsApi.updateDocument("1", { content: "huge content" }),
      ).rejects.toMatchObject({
        response: { status: 413 },
      });
    });
  });

  describe("deleteDocument", () => {
    test("deletes document successfully", async () => {
      const deleteResponse = { message: "Document deleted successfully" };

      mockedAxios.delete.mockResolvedValue({ data: deleteResponse });

      const result = await documentsApi.deleteDocument("1");

      expect(mockedAxios.delete).toHaveBeenCalledWith("/api/documents/1");
      expect(result).toEqual(deleteResponse);
    });

    test("handles delete error", async () => {
      mockedAxios.delete.mockRejectedValue({
        response: { status: 404, data: { error: "Document not found" } },
      });

      await expect(documentsApi.deleteDocument("999")).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe("shareDocument", () => {
    test("shares document successfully", async () => {
      const shareResponse = { shareUrl: "https://example.com/share/123" };

      mockedAxios.post.mockResolvedValue({ data: shareResponse });

      const result = await documentsApi.shareDocument("1");

      expect(mockedAxios.post).toHaveBeenCalledWith("/api/documents/1/share");
      expect(result).toEqual(shareResponse);
    });
  });
});
