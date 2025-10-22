import React, { useCallback, useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const RichTextEditor = forwardRef(({
  value,
  onChange,
  placeholder = "Start typing...",
  onSelectionChange,
}, ref) => {
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
    }
  }));
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
      if (source === 'user') {
        onChange(content);
      }
    },
    [onChange],
  );

  const handleSelectionChange = useCallback(
    (range, source, editor) => {
      if (onSelectionChange && source === 'user') {
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
});

export default RichTextEditor;
