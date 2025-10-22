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
      placeholder = "Let your thoughts take flight...",
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

      // Clear existing cursor elements
      const existingCursors = editor.root.querySelectorAll(
        ".collaborative-cursor",
      );
      existingCursors.forEach((cursor) => cursor.remove());

      // Don't render cursors if there are none
      if (!userCursors || Object.keys(userCursors).length === 0) {
        return;
      }

      // Use distinct colors for different users
      const colors = [
        "#0066cc", // wind-blue
        "#0080bb", // sky-blue-600
        "#ea4335",
        "#34a853",
        "#fbbc04",
        "#9c27b0",
        "#ff6d01",
        "#795548",
      ];

      // Add cursor overlays for other users
      Object.values(userCursors).forEach((cursor, index) => {
        if (cursor.range && typeof cursor.range.index === "number") {
          try {
            // Ensure the cursor position is within document bounds
            const documentLength = editor.getLength();
            const safeIndex = Math.min(cursor.range.index, documentLength - 1);

            const bounds = editor.getBounds(
              safeIndex,
              cursor.range.length || 0,
            );

            if (
              bounds &&
              typeof bounds.top === "number" &&
              typeof bounds.left === "number"
            ) {
              const color = colors[index % colors.length];
              const cursorElement = document.createElement("div");
              cursorElement.className = "collaborative-cursor";
              cursorElement.setAttribute("data-user-id", cursor.userId);

              // Create cursor with more reliable positioning
              const cursorHeight = Math.max(bounds.height || 18, 18);

              cursorElement.style.position = "absolute";
              cursorElement.style.top = `${bounds.top}px`;
              cursorElement.style.left = `${bounds.left}px`;
              cursorElement.style.width = "3px";
              cursorElement.style.height = `${cursorHeight}px`;
              cursorElement.style.backgroundColor = color;
              cursorElement.style.pointerEvents = "none";
              cursorElement.style.zIndex = "1001";
              cursorElement.style.borderRadius = "1px";
              cursorElement.style.boxShadow = "0 0 2px rgba(0,0,0,0.3)";

              // Add user label
              const label = document.createElement("div");
              label.textContent = cursor.userId.slice(-4);
              label.style.position = "absolute";
              label.style.top = "-20px";
              label.style.left = "-2px";
              label.style.background = color;
              label.style.color = "white";
              label.style.padding = "2px 4px";
              label.style.borderRadius = "2px";
              label.style.fontSize = "10px";
              label.style.fontWeight = "500";
              label.style.whiteSpace = "nowrap";
              label.style.zIndex = "1002";

              cursorElement.appendChild(label);

              // Add blinking animation
              cursorElement.style.animation = "cursorBlink 1.2s infinite";

              // Ensure editor has relative positioning and append cursor
              if (
                !editor.root.style.position ||
                editor.root.style.position === "static"
              ) {
                editor.root.style.position = "relative";
              }

              editor.root.appendChild(cursorElement);
            }
          } catch (error) {
            console.warn("Error rendering cursor:", error);
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
          if (cursor && cursor.range && cursor.range.index !== undefined) {
            try {
              const bounds = editor.getBounds(
                cursor.range.index,
                cursor.range.length || 0,
              );
              if (bounds && bounds.height > 0) {
                cursorElement.style.top = `${bounds.top}px`;
                cursorElement.style.left = `${bounds.left}px`;
                cursorElement.style.height = `${Math.max(bounds.height, 18)}px`;
              }
            } catch (e) {
              console.warn(
                `Error updating cursor position for user ${userId}:`,
                e,
              );
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
