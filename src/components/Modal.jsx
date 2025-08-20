import React from "react";
import { X } from "lucide-react";

const Modal = ({
  children,
  onClose,
  modalStyle,
  opened,
  title,
  size = "medium",
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (opened) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [onClose, opened]);

  if (!opened) return null;

  const getSizeStyles = () => {
    if (window.innerWidth < 600) {
      return { minWidth: "100dvw", maxWidth: "100dvw", width: "100%" };
    }
    switch (size) {
      case "small":
        return { minWidth: 300, maxWidth: 400 };
      case "large":
        return { minWidth: 600, maxWidth: "80vw", width: "90%" };
      default:
        return { minWidth: 400, maxWidth: "60vw" };
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          ...getSizeStyles(),
          ...modalStyle,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 24px",
              borderBottom: "1px solid #e9ecef",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#2c3e50",
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color="#6c757d" />
            </button>
          </div>
        )}
        <div
          style={{
            padding: title
              ? "0 24px 24px"
              : window.innerWidth > 600
              ? "24px"
              : "0px",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
