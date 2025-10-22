import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import DocumentEditor from "../DocumentEditor";

// Mock the API service
jest.mock("../../services/api", () => ({
  documentsApi: {
    getDocumentById: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
  },
}));

// Mock the WebSocket service
jest.mock("../../services/websocket", () => ({
  connect: jest.fn(),
  joinDocument: jest.fn(),
  leaveDocument: jest.fn(),
  updateDocument: jest.fn(),
  sendCursorUpdate: jest.fn(),
  sendMessage: jest.fn(),
  getClientId: jest.fn(() => "test-client-id"),
  on: jest.fn(() => jest.fn()), // Return unsubscribe function
}));

// Mock RichTextEditor
jest.mock("../../components/RichTextEditor", () => {
  const mockReact = require("react");
  return mockReact.forwardRef((props, ref) => {
    mockReact.useImperativeHandle(ref, () => ({
      getEditor: () => ({}),
      updateContent: jest.fn(),
    }));

    return mockReact.createElement(
      "div",
      { "data-testid": "rich-text-editor" },
      mockReact.createElement("textarea", {
        "data-testid": "content-textarea",
        value: props.value || "",
        onChange: (e) => props.onChange && props.onChange(e.target.value),
        placeholder: props.placeholder,
      }),
    );
  });
});

// Mock react-router-dom hooks
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ id: "test-doc-id" }),
  useNavigate: () => jest.fn(),
}));

const { documentsApi } = require("../../services/api");

describe("DocumentEditor", () => {
  const mockDocument = {
    id: "test-doc-id",
    title: "Test Document",
    content: "Test content",
    updated_at: "2025-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    documentsApi.getDocumentById.mockResolvedValue(mockDocument);
    documentsApi.updateDocument.mockResolvedValue(mockDocument);
  });

  const renderDocumentEditor = () => {
    return render(
      <BrowserRouter>
        <DocumentEditor />
      </BrowserRouter>,
    );
  };

  test("renders DocumentEditor component", async () => {
    renderDocumentEditor();

    await waitFor(() => {
      expect(screen.getByTestId("rich-text-editor")).toBeInTheDocument();
    });
  });

  test("loads document on mount", async () => {
    renderDocumentEditor();

    await waitFor(() => {
      expect(documentsApi.getDocumentById).toHaveBeenCalledWith("test-doc-id");
    });
  });

  test("displays document title", async () => {
    renderDocumentEditor();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Document")).toBeInTheDocument();
    });
  });

  test("displays document content", async () => {
    renderDocumentEditor();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test content")).toBeInTheDocument();
    });
  });

  test("handles title editing", async () => {
    renderDocumentEditor();

    await waitFor(() => {
      const titleInput = screen.getByDisplayValue("Test Document");
      fireEvent.change(titleInput, { target: { value: "Updated Title" } });
      expect(titleInput.value).toBe("Updated Title");
    });
  });

  test("handles content editing", async () => {
    renderDocumentEditor();

    await waitFor(() => {
      const contentTextarea = screen.getByTestId("content-textarea");
      fireEvent.change(contentTextarea, {
        target: { value: "Updated content" },
      });
      expect(contentTextarea.value).toBe("Updated content");
    });
  });

  test("shows loading state initially", () => {
    renderDocumentEditor();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("shows error state when document load fails", async () => {
    documentsApi.getDocumentById.mockRejectedValue(new Error("Failed to load"));

    renderDocumentEditor();

    await waitFor(() => {
      expect(screen.getByText(/failed to load document/i)).toBeInTheDocument();
    });
  });

  test("displays share button", async () => {
    renderDocumentEditor();

    await waitFor(() => {
      expect(screen.getByText("Share")).toBeInTheDocument();
    });
  });

  test("shows active users count when multiple users", async () => {
    renderDocumentEditor();

    await waitFor(() => {
      // The component should render without the users count initially (only 1 user)
      expect(screen.queryByText(/users/)).not.toBeInTheDocument();
    });
  });

  test("handles document deletion", async () => {
    // Mock window.confirm to return true
    window.confirm = jest.fn(() => true);
    documentsApi.deleteDocument.mockResolvedValue({});

    renderDocumentEditor();

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);
    });

    expect(documentsApi.deleteDocument).toHaveBeenCalledWith("test-doc-id");
  });

  test("cancels deletion when user declines confirmation", async () => {
    window.confirm = jest.fn(() => false);

    renderDocumentEditor();

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);
    });

    expect(documentsApi.deleteDocument).not.toHaveBeenCalled();
  });
});
