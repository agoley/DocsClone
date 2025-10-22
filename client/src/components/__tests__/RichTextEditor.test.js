import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RichTextEditor from "../RichTextEditor";

// Mock ReactQuill since it's not compatible with jsdom
jest.mock("react-quill", () => {
  const mockReact = require("react");
  return mockReact.forwardRef(({ value, onChange, placeholder }, ref) => {
    mockReact.useImperativeHandle(ref, () => ({
      getEditor: () => ({
        getBounds: jest.fn(() => ({ top: 0, left: 0, height: 20 })),
        getSelection: jest.fn(() => ({ index: 0, length: 0 })),
        root: {
          scrollTop: 0,
        },
        container: {
          querySelectorAll: jest.fn(() => []),
        },
        scroll: {
          domNode: {
            querySelectorAll: jest.fn(() => []),
          },
        },
      }),
      focus: jest.fn(),
    }));

    return mockReact.createElement(
      "div",
      {
        "data-testid": "quill-editor",
        placeholder: placeholder,
        onClick: () => onChange && onChange(value),
        onInput: (e) => onChange && onChange(e.target.textContent),
      },
      value,
    );
  });
});

describe("RichTextEditor", () => {
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
    placeholder: "Start typing...",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders RichTextEditor component", () => {
    render(<RichTextEditor {...defaultProps} />);
    expect(screen.getByTestId("quill-editor")).toBeInTheDocument();
  });

  test("displays placeholder text", () => {
    render(<RichTextEditor {...defaultProps} />);
    expect(screen.getByPlaceholderText("Start typing...")).toBeInTheDocument();
  });

  test("calls onChange when content changes", () => {
    const mockOnChange = jest.fn();
    render(<RichTextEditor {...defaultProps} onChange={mockOnChange} />);

    const textarea = screen.getByTestId("mock-quill-textarea");
    fireEvent.change(textarea, { target: { value: "Hello World" } });

    expect(mockOnChange).toHaveBeenCalledWith("Hello World");
  });

  test("renders with initial value", () => {
    render(<RichTextEditor {...defaultProps} value="Initial content" />);
    expect(screen.getByDisplayValue("Initial content")).toBeInTheDocument();
  });

  test("handles selection changes", () => {
    const mockOnSelectionChange = jest.fn();
    render(
      <RichTextEditor
        {...defaultProps}
        onSelectionChange={mockOnSelectionChange}
      />,
    );

    // Verify component renders without errors when selection change prop is provided
    expect(screen.getByTestId("quill-editor")).toBeInTheDocument();
  });

  test("renders collaborative cursors", () => {
    const userCursors = {
      user1: {
        userId: "user1",
        range: { index: 5, length: 0 },
        timestamp: Date.now(),
      },
      user2: {
        userId: "user2",
        range: { index: 10, length: 0 },
        timestamp: Date.now(),
      },
    };

    render(<RichTextEditor {...defaultProps} userCursors={userCursors} />);
    expect(screen.getByTestId("quill-editor")).toBeInTheDocument();
  });

  test("handles empty user cursors", () => {
    render(<RichTextEditor {...defaultProps} userCursors={{}} />);
    expect(screen.getByTestId("quill-editor")).toBeInTheDocument();
  });
});
