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
        if (editor) {
          const currentContent = editor.root.innerHTML;
          if (currentContent !== content) {
            const selection = editor.getSelection();

            // Use Quill's API to set content instead of directly manipulating innerHTML
            // This ensures proper handling of images and other rich content
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = content;
            const delta = editor.clipboard.convert(tempDiv);

            editor.setContents(delta, "api");

            // Restore selection if it was present and still valid
            if (selection && selection.index <= editor.getLength()) {
              setTimeout(() => {
                try {
                  editor.setSelection(selection);
                } catch (e) {
                  console.warn("Could not restore selection:", e);
                }
              }, 0);
            }
          }
        }
      },
    }));

    // Handle cursor updates from other users
    useEffect(() => {
      const editor = quillRef.current?.getEditor();
      if (!editor) return;

      // Clear existing cursor overlays from both container and root
      const existingCursors = editor.container.querySelectorAll(
        ".collaborative-cursor",
      );
      existingCursors.forEach((cursor) => cursor.remove());

      // Also clear from the editor root
      const rootCursors = editor.root.querySelectorAll(".collaborative-cursor");
      rootCursors.forEach((cursor) => cursor.remove());

      // Generate different colors for different users
      const colors = [
        "#4285f4",
        "#ea4335",
        "#34a853",
        "#fbbc04",
        "#9c27b0",
        "#ff6d01",
        "#795548",
      ];

      // Add cursor overlays for other users
      Object.values(userCursors).forEach((cursor, index) => {
        if (cursor.range && cursor.range.index !== undefined) {
          try {
            const bounds = editor.getBounds(
              cursor.range.index,
              cursor.range.length || 0,
            );
            if (bounds) {
              const color = colors[index % colors.length];
              const cursorElement = document.createElement("div");
              cursorElement.className = "collaborative-cursor";
              cursorElement.setAttribute("data-user-id", cursor.userId);

              // Position cursors correctly relative to the document
              cursorElement.style.cssText = `
                position: absolute;
                top: ${bounds.top}px;
                left: ${bounds.left}px;
                width: 2px;
                height: ${bounds.height}px;
                background-color: ${color};
                pointer-events: none;
                z-index: 1001;
                animation: blink 1s infinite;
              `;

              // Add user label
              const label = document.createElement("div");
              label.textContent = `User ${cursor.userId.slice(-4)}`;
              label.style.cssText = `
                position: absolute;
                top: -20px;
                left: 0;
                background: ${color};
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 12px;
                white-space: nowrap;
              `;
              cursorElement.appendChild(label);

              // Append to the editor's editing area (ql-editor) instead of container
              const editorElement = editor.root;
              if (editorElement) {
                editorElement.appendChild(cursorElement);
              } else {
                editor.container.appendChild(cursorElement);
              }
            }
          } catch (e) {
            console.warn("Could not render cursor for user:", cursor.userId, e);
          }
        }
      });
    }, [userCursors]);

    // Update cursor positions on scroll
    useEffect(() => {
      const editor = quillRef.current?.getEditor();
      if (!editor) return;

      const handleScroll = () => {
        // Re-render cursors when scrolling
        const cursorsToUpdate = editor.root.querySelectorAll(
          ".collaborative-cursor",
        );
        cursorsToUpdate.forEach((cursorElement) => {
          const userId = cursorElement.getAttribute("data-user-id");
          const cursor = userCursors[userId];
          if (cursor && cursor.range) {
            try {
              const bounds = editor.getBounds(
                cursor.range.index,
                cursor.range.length || 0,
              );
              if (bounds) {
                cursorElement.style.top = `${bounds.top}px`;
                cursorElement.style.left = `${bounds.left}px`;
                cursorElement.style.height = `${bounds.height}px`;
              }
            } catch (e) {
              // Ignore errors for invalid ranges
            }
          }
        });
      };

      const scrollContainer = editor.scrollingContainer || editor.container;
      scrollContainer.addEventListener("scroll", handleScroll);

      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
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
        // Always trigger onChange for user changes (including image insertions)
        if (source === "user") {
          onChange(content);
        }
        // Don't trigger onChange for API changes to avoid loops with remote updates
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
