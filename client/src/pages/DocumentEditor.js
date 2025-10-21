import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { documentsApi } from "../services/api";
import wsService from "../services/websocket";
import ShareModal from "../components/ShareModal";

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeUsers, setActiveUsers] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [toast, setToast] = useState({ show: false, message: "" });

  const saveTimeoutRef = useRef(null);
  const lastSavedContent = useRef({ title: "", content: "" });

  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      const data = await documentsApi.getDocumentById(id);
      setDocument(data);
      setTitle(data.title);
      setContent(data.content);
      lastSavedContent.current = { title: data.title, content: data.content };
      setError(null);
    } catch (err) {
      console.error("Error fetching document:", err);
      setError(
        "Failed to load document. It may have been deleted or you don't have permission to view it.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // Connect to WebSocket when document is loaded
  useEffect(() => {
    if (!document) return;

    wsService.connect();
    wsService.joinDocument(id);

    const documentUpdatedHandler = (data) => {
      if (data.document.id.toString() === id.toString()) {
        setTitle(data.document.title);
        setContent(data.document.content);
        lastSavedContent.current = {
          title: data.document.title,
          content: data.document.content,
        };
        setToast({ show: true, message: "Document updated by another user" });

        // Hide toast after 3 seconds
        setTimeout(() => {
          setToast({ show: false, message: "" });
        }, 3000);
      }
    };

    const documentJoinedHandler = (data) => {
      // Already handled by fetchDocument
    };

    const userJoinedHandler = (data) => {
      if (data.documentId.toString() === id.toString()) {
        setActiveUsers(data.activeUsers);
      }
    };

    const userLeftHandler = (data) => {
      if (data.documentId.toString() === id.toString()) {
        setActiveUsers(data.activeUsers);
      }
    };

    const errorHandler = (data) => {
      setToast({ show: true, message: data.message || "An error occurred" });
      setTimeout(() => {
        setToast({ show: false, message: "" });
      }, 3000);
    };

    // Register event listeners
    const unsubscribeDocumentUpdated = wsService.on(
      "document-updated",
      documentUpdatedHandler,
    );
    const unsubscribeDocumentJoined = wsService.on(
      "document-joined",
      documentJoinedHandler,
    );
    const unsubscribeUserJoined = wsService.on(
      "user-joined",
      userJoinedHandler,
    );
    const unsubscribeUserLeft = wsService.on("user-left", userLeftHandler);
    const unsubscribeError = wsService.on("error", errorHandler);

    return () => {
      // Clean up event listeners and leave document
      unsubscribeDocumentUpdated();
      unsubscribeDocumentJoined();
      unsubscribeUserJoined();
      unsubscribeUserLeft();
      unsubscribeError();

      wsService.leaveDocument(id);
    };
  }, [document, id]);

  // Debounced save
  useEffect(() => {
    if (loading || !document) return;

    if (
      title === lastSavedContent.current.title &&
      content === lastSavedContent.current.content
    ) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDocument();
    }, 1000); // Save after 1 second of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content]);

  const saveDocument = async () => {
    if (
      isSaving ||
      (title === lastSavedContent.current.title &&
        content === lastSavedContent.current.content)
    ) {
      return;
    }

    try {
      setIsSaving(true);
      await documentsApi.updateDocument(id, { title, content });
      lastSavedContent.current = { title, content };

      // Update through WebSocket for real-time collaboration
      wsService.updateDocument(id, title, content);
    } catch (err) {
      console.error("Error saving document:", err);
      setToast({ show: true, message: "Failed to save document" });
      setTimeout(() => {
        setToast({ show: false, message: "" });
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this document? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await documentsApi.deleteDocument(id);
      navigate("/");
    } catch (err) {
      console.error("Error deleting document:", err);
      setToast({ show: true, message: "Failed to delete document" });
      setTimeout(() => {
        setToast({ show: false, message: "" });
      }, 3000);
    }
  };

  const handleShare = async () => {
    try {
      const shareData = await documentsApi.shareDocument(id);
      setShareUrl(shareData.shareUrl);
      setShowShareModal(true);
    } catch (err) {
      console.error("Error sharing document:", err);
      setToast({ show: true, message: "Failed to share document" });
      setTimeout(() => {
        setToast({ show: false, message: "" });
      }, 3000);
    }
  };

  if (loading) {
    return <div className="card">Loading document...</div>;
  }

  if (error) {
    return (
      <div className="card">
        <p>{error}</p>
        <button onClick={() => navigate("/")}>Back to Documents</button>
      </div>
    );
  }

  if (!document) {
    return <div className="card">Document not found</div>;
  }

  return (
    <div>
      <div className="header">
        <div style={{ display: "flex", alignItems: "center" }}>
          <h1>Edit Document</h1>
          {activeUsers > 1 && (
            <div className="users-badge">
              {activeUsers} {activeUsers === 1 ? "user" : "users"} online
            </div>
          )}
        </div>
        <div>
          <button onClick={() => navigate("/")}>Back to List</button>
        </div>
      </div>

      <div className="card document-editor">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document Title"
          style={{ fontSize: "24px", fontWeight: "bold" }}
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Document content..."
        />

        <div className="document-actions">
          <button onClick={handleShare}>Share</button>
          <button className="danger" onClick={handleDelete}>
            Delete
          </button>
        </div>

        {isSaving && (
          <div
            style={{ marginTop: "10px", color: "#5f6368", fontSize: "14px" }}
          >
            Saving...
          </div>
        )}
      </div>

      {showShareModal && (
        <ShareModal
          shareUrl={shareUrl}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onCopy={() => {
            setToast({
              show: true,
              message: "Share link copied to clipboard!",
            });
            setTimeout(() => {
              setToast({ show: false, message: "" });
            }, 3000);
          }}
        />
      )}

      {toast.show && <div className="toast">{toast.message}</div>}
    </div>
  );
};

export default DocumentEditor;
