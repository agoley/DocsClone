import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { documentsApi } from "../services/api";
import wsService from "../services/websocket";
import ShareModal from "../components/ShareModal";
import RichTextEditor from "../components/RichTextEditor";

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
  const [userCursors, setUserCursors] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [toast, setToast] = useState({ show: false, message: "" });

  const saveTimeoutRef = useRef(null);
  const cursorTimeoutRef = useRef(null);
  const lastSavedContent = useRef({ title: "", content: "" });
  const lastRemoteUpdate = useRef(0);
  const ignoreNextUpdate = useRef(false);
  const editorRef = useRef(null);
  const isUpdatingFromRemote = useRef(false);

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
      lastSavedContent.current = {
        title: data.title,
        content: data.content,
        timestamp: Date.now(),
      };
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
        `Failed to load document ID ${id}. ${
          err.response?.data?.error || err.message
        }`,
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
        const now = Date.now();

        // If we just sent an update, ignore the echo
        if (ignoreNextUpdate.current) {
          ignoreNextUpdate.current = false;
          return;
        }

        // Only update if this is a newer change than what we have
        if (now - lastRemoteUpdate.current < 2000) {
          // Recent remote update, be more cautious
          console.log(
            "Recent remote update detected, checking if we should apply changes",
          );
        }

        lastRemoteUpdate.current = now;

        // Update title if different
        if (data.document.title !== title) {
          setTitle(data.document.title);
        }

        // Only update content if it's actually different and not from recent local changes
        if (
          data.document.content !== content &&
          data.document.content !== lastSavedContent.current.content
        ) {
          isUpdatingFromRemote.current = true;

          // Use the editor ref to update content without triggering onChange
          if (editorRef.current && editorRef.current.updateContent) {
            editorRef.current.updateContent(data.document.content);
          }

          setContent(data.document.content);

          // Reset the flag after state update
          setTimeout(() => {
            isUpdatingFromRemote.current = false;
          }, 100);
          lastSavedContent.current = {
            title: data.document.title,
            content: data.document.content,
            timestamp: now,
          };

          setToast({ show: true, message: "Document updated by another user" });
          setTimeout(() => {
            setToast({ show: false, message: "" });
          }, 3000);
        }
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

        // Remove cursor for user who left
        if (data.userId) {
          setUserCursors((prev) => {
            const newCursors = { ...prev };
            delete newCursors[data.userId];
            return newCursors;
          });
        }
      }
    };

    const errorHandler = (data) => {
      setToast({ show: true, message: data.message || "An error occurred" });
      setTimeout(() => {
        setToast({ show: false, message: "" });
      }, 3000);
    };

    const cursorUpdateHandler = (data) => {
      console.log("Received cursor update:", data);
      console.log("Current document ID:", id);
      console.log("Current client ID:", wsService.getClientId());

      if (
        data.documentId.toString() === id.toString() &&
        data.userId !== wsService.getClientId()
      ) {
        console.log("Processing cursor update for user:", data.userId);
        setUserCursors((prev) => {
          const newCursors = {
            ...prev,
            [data.userId]: {
              range: data.range,
              timestamp: data.timestamp,
              userId: data.userId,
            },
          };
          console.log("Updated cursors:", newCursors);
          return newCursors;
        });
      }
    };

    const userDisconnectedHandler = (data) => {
      if (data.documentId.toString() === id.toString()) {
        setUserCursors((prev) => {
          const newCursors = { ...prev };
          delete newCursors[data.userId];
          return newCursors;
        });
        setActiveUsers(data.activeUsers);
      }
    };

    const cursorRemoveHandler = (data) => {
      console.log("Received cursor remove:", data);
      if (data.documentId.toString() === id.toString()) {
        setUserCursors((prev) => {
          const newCursors = { ...prev };
          delete newCursors[data.userId];
          console.log("Removed cursor for user:", data.userId);
          return newCursors;
        });
      }
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
    const unsubscribeCursorUpdate = wsService.on(
      "cursor-update",
      cursorUpdateHandler,
    );
    const unsubscribeUserDisconnected = wsService.on(
      "user-disconnected",
      userDisconnectedHandler,
    );
    const unsubscribeCursorRemove = wsService.on(
      "cursor-remove",
      cursorRemoveHandler,
    );

    return () => {
      // Clean up event listeners and leave document
      unsubscribeDocumentUpdated();
      unsubscribeDocumentJoined();
      unsubscribeUserJoined();
      unsubscribeUserLeft();
      unsubscribeError();
      unsubscribeCursorUpdate();
      unsubscribeUserDisconnected();
      unsubscribeCursorRemove();

      wsService.leaveDocument(id);
    };
  }, [document, id]);

  // Handle tab/window close to clean up cursors
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Send final cursor removal before leaving
      wsService.sendMessage({
        type: "cursor-remove",
        documentId: id,
        userId: wsService.getClientId(),
      });

      // Leave document properly
      wsService.leaveDocument(id);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, remove cursor
        wsService.sendMessage({
          type: "cursor-remove",
          documentId: id,
          userId: wsService.getClientId(),
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id]);

  // Debounced save
  useEffect(() => {
    if (loading || !document || isUpdatingFromRemote.current) return;

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
      // Double check we're not in the middle of a remote update
      if (!isUpdatingFromRemote.current) {
        saveDocument();
      }
    }, 800); // Save after 800ms of inactivity for faster collaboration

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content]);

  const handleContentChange = useCallback((newContent) => {
    // Don't save if this change is from a remote update
    if (isUpdatingFromRemote.current) {
      return;
    }

    setContent(newContent);
  }, []);

  const handleSelectionChange = useCallback(
    (range) => {
      console.log("Selection changed:", range);
      console.log("isUpdatingFromRemote:", isUpdatingFromRemote.current);

      if (range && !isUpdatingFromRemote.current) {
        // Debounce cursor updates to reduce network traffic but keep them fast
        if (cursorTimeoutRef.current) {
          clearTimeout(cursorTimeoutRef.current);
        }

        cursorTimeoutRef.current = setTimeout(() => {
          console.log("Sending cursor update:", {
            documentId: id,
            userId: wsService.getClientId(),
            range: range,
            timestamp: Date.now(),
          });
          wsService.sendCursorUpdate(id, {
            userId: wsService.getClientId(),
            range: range,
            timestamp: Date.now(),
          });
        }, 100); // Very fast debounce - 100ms
      }
    },
    [id],
  );
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
      const now = Date.now();

      await documentsApi.updateDocument(id, { title, content });
      lastSavedContent.current = {
        title,
        content,
        timestamp: now,
      };

      // Mark that we're sending an update to ignore the echo
      ignoreNextUpdate.current = true;

      // Update through WebSocket for real-time collaboration
      wsService.updateDocument(id, title, content);
    } catch (err) {
      console.error("Error saving document:", err);

      let errorMessage = "Failed to save document";

      // Handle specific error types
      if (err.response?.status === 413) {
        errorMessage =
          "Content too large. Please reduce image sizes or document length.";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      setToast({ show: true, message: errorMessage });
      setTimeout(() => {
        setToast({ show: false, message: "" });
      }, 5000); // Show longer for error messages
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

      {/* Document Actions Toolbar */}
      <div className="docs-toolbar">
        <div className="toolbar-section">
          <button
            className="toolbar-btn danger"
            onClick={handleDelete}
            title="Delete document"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Google Docs-style Document */}
      <div className="docs-editor-container">
        <div className="docs-page">
          <RichTextEditor
            ref={editorRef}
            value={content}
            onChange={handleContentChange}
            onSelectionChange={handleSelectionChange}
            userCursors={userCursors}
            placeholder="Start typing your document..."
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
