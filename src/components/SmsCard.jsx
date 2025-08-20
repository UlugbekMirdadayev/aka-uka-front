import React from "react";
import { Phone, MessageCircle, Clock, DollarSign } from "lucide-react";

const SmsCard = ({ sms, onStatusCheck, onDelete, onDetails }) => {
  const formatPhone = (phone) => {
    if (!phone) return "";
    return phone.replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3-$4-$5");
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("uz-UZ");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DELIVRD":
      case "delivered":
        return "#28a745";
      case "sent":
        return "#007bff";
      case "pending":
        return "#ffc107";
      case "failed":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  return (
    <div className="sms-card">
      <div className="sms-card-header">
        <div className="phone-info">
          <Phone size={16} color="#666" />
          <span className="phone-number">{formatPhone(sms.phone)}</span>
        </div>
        <div 
          className="status-indicator"
          style={{ backgroundColor: getStatusColor(sms.status) }}
        />
      </div>

      <div className="sms-card-body">
        <div className="message-preview">
          <MessageCircle size={14} color="#666" />
          <p>
            {sms.message?.length > 80 
              ? `${sms.message.substring(0, 80)}...`
              : sms.message}
          </p>
        </div>

        <div className="sms-meta">
          <div className="meta-item">
            <Clock size={12} />
            <span>{formatDate(sms.sentAt || sms.createdAt)}</span>
          </div>
          
          {sms.cost && (
            <div className="meta-item">
              <DollarSign size={12} />
              <span>{sms.cost} so'm</span>
            </div>
          )}
        </div>
      </div>

      <div className="sms-card-actions">
        <button 
          onClick={() => onDetails(sms)}
          className="card-action-btn details-btn"
        >
          Batafsil
        </button>
        
        {sms.messageId && (
          <button 
            onClick={() => onStatusCheck(sms.messageId)}
            className="card-action-btn refresh-btn"
          >
            Yangilash
          </button>
        )}
        
        <button 
          onClick={() => onDelete(sms._id)}
          className="card-action-btn delete-btn"
        >
          O'chirish
        </button>
      </div>
    </div>
  );
};

export default SmsCard;
