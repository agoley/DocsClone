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
      console.log("Fetching document with ID:", id);
      console.log("Current URL:", window.location.href);
      setLoading(true);
      setError(null); // Clear any previous errors
      
      const data = await documentsApi.getDocumentById(id);
      console.log("Document fetched successfully:", data);
      setDocument(data);
      setTitle(data.title);
      setContent(data.content);
      lastSavedContent.current = { title: data.title, content: data.content };
    } catch (err) {
      console.error("Error fetching document:", err);
      console.error("Error details:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
      });
      
      // Don't redirect automatically, just show the error
      setError(
        `Failed to load document ID ${id}. ${err.response?.data?.error || err.message}`,
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
      <div className="docs-container">
        <div className="docs-header">
          <div className="docs-header-left">
            <div className="docs-logo">
              <span className="docs-icon">📝</span>
              <span className="docs-title">Docs</span>
            </div>
          </div>
          <div className="docs-header-right">
            <button className="menu-btn" onClick={() => navigate("/")}>
              ←
            </button>
          </div>
        </div>
        <div className="docs-error">
          <h2>Error Loading Document</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchDocument}>Try Again</button>
            <button onClick={() => navigate("/")}>Back to Documents</button>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return <div className="card">Document not found</div>;
  }

  return (
    <div className="docs-container">
      {/* Google Docs-style Header */}
      <div className="docs-header">
        <div className="docs-header-left">
          <div className="docs-logo">
            <span className="docs-icon">📝</span>
            <span className="docs-title">Docs</span>
          </div>

          <div className="docs-document-info">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled document"
              className="docs-title-input"
            />

            <div className="docs-save-status">
              {isSaving ? (
                <span className="saving">
                  <span className="spinner"></span>
                  Saving...
                </span>
              ) : (
                <span className="saved">All changes saved in Drive</span>
              )}
            </div>
          </div>
        </div>

        <div className="docs-header-right">
          {activeUsers > 1 && (
            <div className="docs-users">
              <span className="user-count">{activeUsers}</span>
            </div>
          )}

          <button className="docs-share-btn" onClick={handleShare}>
            Share
          </button>

          <div className="docs-menu">
            <button className="menu-btn" onClick={() => navigate("/")}>
              ←
            </button>
          </div>
        </div>
      </div>

      {/* Google Docs-style Toolbar */}
      <div className="docs-toolbar">
        <div className="toolbar-section">
          <select className="font-family">
            <option>Arial</option>
          </select>
          <select className="font-size">
            <option>11</option>
          </select>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-section">
          <button className="toolbar-btn" title="Bold">
            B
          </button>
          <button className="toolbar-btn" title="Italic">
            I
          </button>
          <button className="toolbar-btn" title="Underline">
            U
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-section">
          <button
            className="toolbar-btn danger"
            onClick={handleDelete}
            title="Delete document"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Google Docs-style Document */}
      <div className="docs-editor-container">
        <div className="docs-page">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing your document..."
            className="docs-textarea"
          />
        </div>
      </div>

      {/* Modals and Toasts */}
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

      {toast.show && <div className="docs-toast">{toast.message}</div>}
    </div>
  );
};

export default DocumentEditor;
