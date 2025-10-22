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
    <div className="docs-home">
      {/* Google Docs-style Header */}
      <div className="docs-home-header">
        <div className="docs-home-logo">
          <span className="docs-icon">🌬️</span>
          <span className="docs-title">SkyWrite</span>
        </div>

        <button
          className="docs-new-doc-btn"
          onClick={() => setShowNewDocForm(!showNewDocForm)}
        >
          {showNewDocForm ? "Cancel" : "🌬️ New Document"}
        </button>
      </div>

      {showNewDocForm && (
        <div className="docs-new-form">
          <h2>Create New Document</h2>
          <DocumentForm
            onSubmit={handleCreateDocument}
            submitText="Create Document"
          />
        </div>
      )}

      {/* Recent Documents Section */}
      <div className="docs-content">
        <div className="docs-section-header">
          <h2>Recent documents</h2>
        </div>

        {documents.length > 0 ? (
          <div className="docs-grid">
            {documents.map((doc) => (
              <Link
                to={`/documents/${doc.id}`}
                key={doc.id}
                className="docs-card-link"
              >
                <div className="docs-document-card">
                  <div className="docs-card-preview">
                    <div className="docs-card-icon">🌬️</div>
                  </div>

                  <div className="docs-card-info">
                    <h3 className="docs-card-title">{doc.title}</h3>
                    <div className="docs-card-meta">
                      <div className="docs-card-owner">
                        <span className="owner-avatar">👤</span>
                        <span>You</span>
                      </div>
                      <div className="docs-card-date">
                        {doc.updated_at && doc.updated_at !== doc.created_at
                          ? `Opened ${formatDate(doc.updated_at)}`
                          : `Created ${formatDate(doc.created_at)}`}
                      </div>
                    </div>
                  </div>

                  <div className="docs-card-menu">
                    <button className="docs-menu-btn">⋮</button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="docs-empty-state">
            <div className="empty-state-icon">📄</div>
            <h3>No documents yet</h3>
            <p>Create your first document to get started!</p>
            <button
              className="docs-create-btn"
              onClick={() => setShowNewDocForm(true)}
            >
              Create document
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentList;
