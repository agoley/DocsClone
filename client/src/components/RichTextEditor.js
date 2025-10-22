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
      console.log("RichTextEditor userCursors updated:", userCursors);
      console.log("Number of cursors:", Object.keys(userCursors).length);
      const editor = quillRef.current?.getEditor();
      const containerRef = quillRef.current?.container;
      if (!editor || !containerRef) {
        console.log("No editor or container available");
        return;
      }

      // Create or get the cursor overlay container
      let cursorOverlay = containerRef.querySelector(".cursor-overlay");
      if (!cursorOverlay) {
        cursorOverlay = document.createElement("div");
        cursorOverlay.className = "cursor-overlay";
        cursorOverlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
        `;
        containerRef.style.position = "relative";
        containerRef.appendChild(cursorOverlay);
        console.log("Created cursor overlay container");
      }

      // Clear existing cursor elements
      cursorOverlay.innerHTML = "";
      console.log("Cleared existing cursors");

      // For testing: always add a test cursor to verify overlay works
      const testCursor = document.createElement("div");
      testCursor.className = "collaborative-cursor test-cursor";
      testCursor.style.cssText = `
        position: absolute;
        top: 50px;
        left: 50px;
        width: 3px;
        height: 20px;
        background-color: #ff0000;
        pointer-events: none;
        z-index: 1001;
        border-radius: 1px;
      `;

      const testLabel = document.createElement("div");
      testLabel.textContent = "TEST";
      testLabel.style.cssText = `
        position: absolute;
        top: -22px;
        left: -2px;
        background: #ff0000;
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 500;
      `;
      testCursor.appendChild(testLabel);
      cursorOverlay.appendChild(testCursor);
      console.log(
        "Added test cursor to overlay at",
        testCursor.getBoundingClientRect(),
      );

      // Don't render real cursors if there are none
      if (!userCursors || Object.keys(userCursors).length === 0) {
        console.log(
          "No user cursors to render, but test cursor should be visible",
        );
        return;
      }

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
            console.log(
              `Rendering cursor for user ${cursor.userId} at position ${cursor.range.index}`,
            );
            const bounds = editor.getBounds(
              cursor.range.index,
              cursor.range.length || 0,
            );

            if (bounds && bounds.height > 0) {
              const color = colors[index % colors.length];
              const cursorElement = document.createElement("div");
              cursorElement.className = "collaborative-cursor";
              cursorElement.setAttribute("data-user-id", cursor.userId);

              // Get the toolbar height to offset cursor position
              const toolbar = containerRef.querySelector(".ql-toolbar");
              const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;

              // Position cursors correctly relative to the container
              cursorElement.style.cssText = `
                position: absolute;
                top: ${bounds.top + toolbarHeight}px;
                left: ${bounds.left}px;
                width: 3px;
                height: ${Math.max(bounds.height, 18)}px;
                background-color: ${color};
                pointer-events: none;
                z-index: 1001;
                border-radius: 1px;
                box-shadow: 0 0 2px rgba(0,0,0,0.3);
              `;

              // Add user label
              const label = document.createElement("div");
              label.textContent = `${cursor.userId.slice(-4)}`;
              label.style.cssText = `
                position: absolute;
                top: -22px;
                left: -2px;
                background: ${color};
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 11px;
                font-weight: 500;
                white-space: nowrap;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                z-index: 1002;
              `;
              cursorElement.appendChild(label);

              // Add blinking animation
              cursorElement.style.animation = "cursorBlink 1.2s infinite";

              // Append to the cursor overlay
              cursorOverlay.appendChild(cursorElement);

              console.log(
                `Cursor rendered at top: ${
                  bounds.top + toolbarHeight
                }px, left: ${bounds.left}px`,
              );
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
        const containerRef = quillRef.current?.container;
        if (!containerRef) return;

        const cursorOverlay = containerRef.querySelector(".cursor-overlay");
        if (!cursorOverlay) return;

        const cursorsToUpdate = cursorOverlay.querySelectorAll(
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
                const toolbar = containerRef.querySelector(".ql-toolbar");
                const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;
                cursorElement.style.top = `${bounds.top + toolbarHeight}px`;
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
