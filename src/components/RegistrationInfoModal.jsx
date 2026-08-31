import React from "react";

const RegistrationInfoModal = ({ open, title, intro, items = [], closeLabel, onClose }) => {
  if (!open) return null;

  return (
    <div className="registration-modal-overlay" onClick={onClose}>
      <section
        className="registration-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="registration-modal-close" onClick={onClose} aria-label={closeLabel}>
          x
        </button>
        <h3 id="registration-modal-title">{title}</h3>
        {intro && <p className="registration-modal-intro">{intro}</p>}
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <button type="button" className="registration-modal-action" onClick={onClose}>
          {closeLabel}
        </button>
      </section>
    </div>
  );
};

export default RegistrationInfoModal;
