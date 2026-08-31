import React from "react";
import "./ResponseBanner.css";

const ResponseBanner = ({ type = "info", message = "", onClose }) => {
  if (!message) return null;

  return (
    <div className={`response-banner response-banner-${type}`} role="status" aria-live="polite">
      <span>{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Close message">
          x
        </button>
      )}
    </div>
  );
};

export default ResponseBanner;
