import React, {
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const RichTextEditor = forwardRef(
  (
    {
      value,
      onChange,
      placeholder = "Start typing...",
      onSelectionChange,
      userCursors = {},
    },
    ref,
  ) => {
    const quillRef = useRef(null);

    useImperativeHandle(ref, () => ({
      getEditor: () => quillRef.current?.getEditor(),
      updateContent: (content) => {
        const editor = quillRef.current?.getEditor();
        if (editor && editor.root.innerHTML !== content) {
          const selection = editor.getSelection();
          editor.root.innerHTML = content;
          // Restore selection if it was present
          if (selection) {
            editor.setSelection(selection);
          }
        }
      },
    }));

    // Handle cursor updates from other users
    useEffect(() => {
      const editor = quillRef.current?.getEditor();
      if (!editor) return;

      // Clear existing cursor overlays
      const existingCursors = document.querySelectorAll(
        ".collaborative-cursor",
      );
      existingCursors.forEach((cursor) => cursor.remove());

      // Add cursor overlays for other users
      Object.values(userCursors).forEach((cursor) => {
        if (cursor.range && cursor.range.index !== undefined) {
          try {
            const bounds = editor.getBounds(
              cursor.range.index,
              cursor.range.length || 0,
            );
            if (bounds) {
              const cursorElement = document.createElement("div");
              cursorElement.className = "collaborative-cursor";
              cursorElement.style.cssText = `
                position: absolute;
                top: ${bounds.top}px;
                left: ${bounds.left}px;
                width: 2px;
                height: ${bounds.height}px;
                background-color: #4285f4;
                pointer-events: none;
                z-index: 1000;
                animation: blink 1s infinite;
              `;

              // Add user label
              const label = document.createElement("div");
              label.textContent = `User ${cursor.userId.slice(-4)}`;
              label.style.cssText = `
                position: absolute;
                top: -20px;
                left: 0;
                background: #4285f4;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 12px;
                white-space: nowrap;
              `;
              cursorElement.appendChild(label);

              editor.container.appendChild(cursorElement);
            }
          } catch (e) {
            console.warn("Could not render cursor for user:", cursor.userId, e);
          }
        }
      });
    }, [userCursors]);
    // Custom toolbar configuration
    const modules = useMemo(
      () => ({
        toolbar: {
          container: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            ["blockquote", "code-block"],
            ["link", "image"],
            ["clean"],
          ],
        },
        clipboard: {
          matchVisual: false,
        },
      }),
      [],
    );

    const formats = [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "color",
      "background",
      "align",
      "list",
      "bullet",
      "indent",
      "blockquote",
      "code-block",
      "link",
      "image",
    ];

    const handleChange = useCallback(
      (content, delta, source, editor) => {
        // Only trigger onChange for user changes, not API updates
        if (source === "user") {
          onChange(content);
        }
      },
      [onChange],
    );

    const handleSelectionChange = useCallback(
      (range, source, editor) => {
        if (onSelectionChange && source === "user") {
          onSelectionChange(range);
        }
      },
      [onSelectionChange],
    );

    return (
      <div className="rich-text-editor">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          onChangeSelection={handleSelectionChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        />
      </div>
    );
  },
);

export default RichTextEditor;
