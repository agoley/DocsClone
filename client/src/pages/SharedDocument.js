import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { documentsApi } from "../services/api";

const SharedDocument = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const data = await documentsApi.getSharedDocument(shareId);
        setDocument(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching shared document:", err);
        setError("This shared document could not be found or has expired.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [shareId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="card">Loading shared document...</div>;
  }

  if (error) {
    return (
      <div className="card">
        <p>{error}</p>
        <button onClick={() => navigate("/")}>Go to Documents</button>
      </div>
    );
  }

  if (!document) {
    return <div className="card">Shared document not found</div>;
  }

  return (
    <div>
      <div className="header">
        <h1>Shared Document</h1>
        <div>
          <button onClick={() => navigate("/")}>Go to My Documents</button>
        </div>
      </div>

      <div className="card document-editor">
        <h2>{document.title}</h2>

        <div
          style={{ color: "#5f6368", fontSize: "14px", marginBottom: "20px" }}
        >
          <div>
            Last updated: {formatDate(document.updatedAt || document.createdAt)}
          </div>
        </div>

        <div
          style={{
            whiteSpace: "pre-wrap",
            border: "1px solid #e0e0e0",
            padding: "15px",
            borderRadius: "4px",
            minHeight: "200px",
            backgroundColor: "#f8f9fa",
          }}
        >
          {document.content || "No content"}
        </div>
      </div>
    </div>
  );
};

export default SharedDocument;
