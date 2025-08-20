import React from "react";
import { CheckCircle, XCircle, Clock, Send } from "lucide-react";

const SmsStatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "DELIVRD":
      case "delivered":
        return { 
          color: "#28a745", 
          icon: CheckCircle, 
          text: "Yetkazildi",
          bgColor: "#d4edda",
          borderColor: "#c3e6cb"
        };
      case "sent":
        return { 
          color: "#007bff", 
          icon: Send, 
          text: "Jo'natildi",
          bgColor: "#d1ecf1",
          borderColor: "#bee5eb"
        };
      case "pending":
        return { 
          color: "#ffc107", 
          icon: Clock, 
          text: "Kutilmoqda",
          bgColor: "#fff3cd",
          borderColor: "#ffeaa7"
        };
      case "failed":
        return { 
          color: "#dc3545", 
          icon: XCircle, 
          text: "Xatolik",
          bgColor: "#f8d7da",
          borderColor: "#f5c6cb"
        };
      default:
        return { 
          color: "#6c757d", 
          icon: Clock, 
          text: status || "Noma'lum",
          bgColor: "#e2e3e5",
          borderColor: "#d6d8db"
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 8px",
        borderRadius: "12px",
        fontSize: "0.75rem",
        fontWeight: "500",
        color: config.color,
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      <Icon size={12} />
      {config.text}
    </span>
  );
};

export default SmsStatusBadge;
