import React, { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  };

  const panelStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    minWidth: "400px",
    maxWidth: "90vw",
    maxHeight: "85vh",
    overflowY: "auto",
    position: "relative",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    color: "#111827",
    margin: 0,
  };

  const closeButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#6b7280",
    padding: "4px 8px",
    borderRadius: "4px",
    lineHeight: 1,
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          {title && <h2 style={titleStyle}>{title}</h2>}
          <button
            style={closeButtonStyle}
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
