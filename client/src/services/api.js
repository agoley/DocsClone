import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "";

const api = axios.create({
  baseURL: API_URL,
});

export const documentsApi = {
  // Get all documents
  getAllDocuments: async () => {
    const response = await api.get("/api/documents");
    return response.data;
  },

  // Get a single document by ID
  getDocumentById: async (id) => {
    const response = await api.get(`/api/documents/${id}`);
    return response.data;
  },

  // Create a new document
  createDocument: async (documentData) => {
    const response = await api.post("/api/documents", documentData);
    return response.data;
  },

  // Update a document
  updateDocument: async (id, documentData) => {
    const response = await api.put(`/api/documents/${id}`, documentData);
    return response.data;
  },

  // Delete a document
  deleteDocument: async (id) => {
    const response = await api.delete(`/api/documents/${id}`);
    return response.data;
  },

  // Share a document
  shareDocument: async (id) => {
    const response = await api.post(`/api/documents/${id}/share`);
    return response.data;
  },

  // Get share URL for a document
  getShareUrl: async (id) => {
    const response = await api.get(`/api/documents/${id}/share-url`);
    return response.data;
  },

  // Get a shared document by share ID
  getSharedDocument: async (shareId) => {
    const response = await api.get(`/api/documents/shared/${shareId}`);
    return response.data;
  },
};

export default api;
