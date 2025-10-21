import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { documentsApi } from "../services/api";
import DocumentForm from "../components/DocumentForm";

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentsApi.getAllDocuments();
      setDocuments(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (documentData) => {
    try {
      const newDoc = await documentsApi.createDocument(documentData);
      setShowNewDocForm(false);
      navigate(`/documents/${newDoc.id}`);
    } catch (err) {
      console.error("Error creating document:", err);
      alert("Failed to create document. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="card">Loading documents...</div>;
  }

  if (error) {
    return (
      <div className="card">
        <p>{error}</p>
        <button onClick={fetchDocuments}>Try Again</button>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <h1>My Documents</h1>
        <button onClick={() => setShowNewDocForm(!showNewDocForm)}>
          {showNewDocForm ? "Cancel" : "New Document"}
        </button>
      </div>

      {showNewDocForm && (
        <div className="card">
          <h2>Create New Document</h2>
          <DocumentForm
            onSubmit={handleCreateDocument}
            submitText="Create Document"
          />
        </div>
      )}

      {documents.length > 0 ? (
        <div className="document-list">
          {documents.map((doc) => (
            <Link
              to={`/documents/${doc.id}`}
              key={doc.id}
              style={{ textDecoration: "none" }}
            >
              <div className="card document-card">
                <h3>{doc.title}</h3>
                <div style={{ color: "#5f6368", fontSize: "14px" }}>
                  <div>Created: {formatDate(doc.created_at)}</div>
                  {doc.updated_at && doc.updated_at !== doc.created_at && (
                    <div>Last updated: {formatDate(doc.updated_at)}</div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card">
          <p>No documents found. Create your first document to get started!</p>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
