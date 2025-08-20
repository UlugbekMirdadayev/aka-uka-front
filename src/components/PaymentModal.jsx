import React, { useState } from "react";
import Modal from "./Modal";
import Input from "./Input";
import { toast } from "react-toastify";
import api from "../services/api";
import "./PaymentModal.css";
import { X } from "lucide-react";

const PaymentModal = ({ isOpen, onClose, debtor, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    usd: 0,
    uzs: 0,
  });
  const [nextPayment, setNextPayment] = useState({
    amount: {
      usd: 0,
      uzs: 0,
    },
    dueDate: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    const toastId = toast.loading("To'lov amalga oshirilmoqda...");

    try {
      const payload = {
        payment: {
          usd: Number(paymentData.usd) || 0,
          uzs: Number(paymentData.uzs) || 0,
        },
      };

      // Agar keyingi to'lov ma'lumotlari berilgan bo'lsa
      if (
        nextPayment.dueDate ||
        nextPayment.amount.usd > 0 ||
        nextPayment.amount.uzs > 0
      ) {
        payload.nextPayment = {
          amount: {
            usd: Number(nextPayment.amount.usd) || 0,
            uzs: Number(nextPayment.amount.uzs) || 0,
          },
          dueDate: nextPayment.dueDate || null,
        };
      }

      await api.post(`/debtors/${debtor._id}/payment`, payload);

      toast.update(toastId, {
        render: "To'lov muvaffaqiyatli amalga oshirildi",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      onSuccess();
      onClose();

      // Reset form
      setPaymentData({ usd: 0, uzs: 0 });
      setNextPayment({ amount: { usd: 0, uzs: 0 }, dueDate: "" });
    } catch (err) {
      toast.update(toastId, {
        render: err?.response?.data?.message || "To'lovda xatolik yuz berdi",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const currentDebt = debtor?.currentDebt || { usd: 0, uzs: 0 };
  const totalPaid = debtor?.totalPaid || { usd: 0, uzs: 0 };
  const initialDebt = debtor?.initialDebt || { usd: 0, uzs: 0 };

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      modalStyle={{
        width: "600px",
        maxWidth: "100vw",
        height: "100dvh",
        maxHeight: "900px",
        borderRadius: window.innerWidth < 600 ? "0" : "8px",
      }}
      opened={isOpen}
    >
      <div className="payment-modal-content">
        <h2>To'lov qilish</h2>
        <button
          className="btn secondary"
          onClick={onClose}
          type="button"
          disabled={loading}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "32px",
            height: "32px",
            padding: 0,
            color: "#fff",
          }}
        >
          <X size={20} color="#fff" />
        </button>
        <div className="payment-modal-fields">
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              <strong>Mijoz:</strong> {debtor?.client?.fullName || "-"}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Telefon:</strong> {debtor?.client?.phone || "-"}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Boshlang'ich qarz:</strong>
              <div style={{ fontSize: "14px", color: "#666" }}>
                {initialDebt.uzs > 0 &&
                  `${initialDebt.uzs.toLocaleString()} so'm`}
                {initialDebt.uzs > 0 && initialDebt.usd > 0 && " + "}
                {initialDebt.usd > 0 && `${initialDebt.usd.toLocaleString()} $`}
              </div>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Joriy qarz:</strong>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#ef4444",
                }}
              >
                {currentDebt.uzs > 0 &&
                  `${currentDebt.uzs.toLocaleString()} so'm`}
                {currentDebt.uzs > 0 && currentDebt.usd > 0 && " + "}
                {currentDebt.usd > 0 && `${currentDebt.usd.toLocaleString()} $`}
              </div>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Jami to'langan:</strong>
              <div style={{ fontSize: "14px", color: "#22c55e" }}>
                {totalPaid.uzs > 0 && `${totalPaid.uzs.toLocaleString()} so'm`}
                {totalPaid.uzs > 0 && totalPaid.usd > 0 && " + "}
                {totalPaid.usd > 0 && `${totalPaid.usd.toLocaleString()} $`}
              </div>
            </div>
            {debtor?.description && (
              <div>
                <strong>Sabab:</strong> {debtor.description}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <h3>To'lov miqdori</h3>
            <div className="payment-modal-row">
              <Input
                label="UZS"
                type="number"
                placeholder="0"
                value={paymentData.uzs}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    uzs: Number(e.target.value) || 0,
                  }))
                }
                disabled={loading}
              />
              <Input
                label="USD"
                type="number"
                placeholder="0"
                value={paymentData.usd}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    usd: Number(e.target.value) || 0,
                  }))
                }
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <h3>Keyingi to'lov rejasi (ixtiyoriy)</h3>
            <div className="payment-modal-row" style={{ marginBottom: "8px" }}>
              <Input
                label="Keyingi UZS"
                type="number"
                placeholder="0"
                value={nextPayment.amount.uzs}
                onChange={(e) =>
                  setNextPayment((prev) => ({
                    ...prev,
                    amount: {
                      ...prev.amount,
                      uzs: Number(e.target.value) || 0,
                    },
                  }))
                }
                disabled={loading}
              />
              <Input
                label="Keyingi USD"
                type="number"
                placeholder="0"
                value={nextPayment.amount.usd}
                onChange={(e) =>
                  setNextPayment((prev) => ({
                    ...prev,
                    amount: {
                      ...prev.amount,
                      usd: Number(e.target.value) || 0,
                    },
                  }))
                }
                disabled={loading}
              />
            </div>
            <Input
              label="Keyingi to'lov muddati"
              type="date"
              value={nextPayment.dueDate}
              onChange={(e) =>
                setNextPayment((prev) => ({
                  ...prev,
                  dueDate: e.target.value,
                }))
              }
              disabled={loading}
            />
          </div>

          <div
            className="payment-modal-row"
            style={{ justifyContent: "flex-end", marginBottom: "16px" }}
          >
            <button
              type="button"
              className="btn secondary"
              onClick={onClose}
              disabled={loading}
            >
              Bekor qilish
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Saqlanmoqda..." : "To'lov qilish"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default PaymentModal;
