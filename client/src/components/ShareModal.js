import React, { useState } from "react";

const ShareModal = ({ shareUrl, isOpen, onClose, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      if (onCopy) onCopy();

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Share Document</h3>
        <p>Anyone with this link can view the document:</p>

        <div className="share-link">
          <input
            type="text"
            value={shareUrl}
            readOnly
            onClick={(e) => e.target.select()}
          />
          <button onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</button>
        </div>

        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
