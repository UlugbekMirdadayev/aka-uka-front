import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";
import api from "../services/api";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Table from "../components/Table";
import {
  Plus,
  Send,
  MessageCircle,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  Trash2,
  FileText,
  BadgeCheck,
  BadgeX,
} from "lucide-react";
import "../styles/sms.css";
import SearchSelect from "../components/SearchSelect";

const Sms = () => {
  const [opened, setOpened] = useState(false);
  const [multipleOpened, setMultipleOpened] = useState(false);
  const [verificationOpened, setVerificationOpened] = useState(false);
  const [detailsOpened, setDetailsOpened] = useState(false);
  const [statsOpened, setStatsOpened] = useState(false);
  const [templatesOpened, setTemplatesOpened] = useState(false);
  const [reportsOpened, setReportsOpened] = useState(false);
  const [createTemplateOpened, setCreateTemplateOpened] = useState(false);

  const [smsHistory, setSmsHistory] = useState([]);
  const [balance, setBalance] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [selectedSms, setSelectedSms] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [reports, setReports] = useState(null);
  const [messageCheck, setMessageCheck] = useState(null);
  const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const [filters, setFilters] = useState({
    phone: "",
    status: "",
    type: "",
    startDate: "",
    endDate: "",
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [activeTab, setActiveTab] = useState("sms"); // yangi tab holati

  // Single SMS form
  const {
    register: registerSingle,
    handleSubmit: handleSubmitSingle,
    reset: resetSingle,
    formState: { errors: errorsSingle },
    watch: watchSingle,
    setValue,
  } = useForm({
    defaultValues: {
      phone: "",
      message: "",
      from: "4546",
    },
  });

  // Multiple SMS form
  const {
    register: registerMultiple,
    handleSubmit: handleSubmitMultiple,
    reset: resetMultiple,
    control: controlMultiple,
    formState: { errors: errorsMultiple },
  } = useForm({
    defaultValues: {
      recipients: [{ phone: "", message: "", from: "4546" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: controlMultiple,
    name: "recipients",
  });

  // Verification SMS form
  const {
    register: registerVerification,
    handleSubmit: handleSubmitVerification,
    reset: resetVerification,
    formState: { errors: errorsVerification },
  } = useForm({
    defaultValues: {
      phone: "",
      code: "",
      appName: "Sklad",
    },
  });

  // Template form
  const {
    register: registerTemplate,
    handleSubmit: handleSubmitTemplate,
    reset: resetTemplate,
    formState: { errors: errorsTemplate },
  } = useForm({
    defaultValues: {
      template: "",
    },
  });

  // Fetch functions
  const fetchSmsHistory = useCallback(
    async (page = 1) => {
      setTableLoading(true);
      try {
        const params = {
          page,
          limit: 20,
          ...filters,
        };

        const res = await api.get("/sms/history", params);
        setSmsHistory(res.data.data.sms);
        setPagination(res.data.data.pagination);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "SMS tarixini yuklashda xatolik";
        toast.error(errorMessage);
      } finally {
        setTableLoading(false);
      }
    },
    [filters]
  );

  const fetchBalance = useCallback(async () => {
    try {
      const res = await api.get("/sms/balance");
      setBalance(res.data.data);
    } catch (err) {
      console.error("Balansni yuklashda xatolik:", err);
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get("/sms/statistics", params);
      setStatistics(res.data.data);
    } catch (err) {
      console.error("Statistikani yuklashda xatolik:", err);
    }
  }, [filters.startDate, filters.endDate]);

  // Fetch clients for select
  useEffect(() => {
    const fetchClientsList = async () => {
      try {
        const { data } = await api.get("/clients");
        setClients(
          (data || [])?.sort((a, b) => (a.visitIndex - b.visitIndex ? -1 : 1))
        );
      } catch (err) {
        console.error("Mijozlarni yuklashda xatolik:", err);
      }
    };
    fetchClientsList();
  }, []);

  const testConnection = useCallback(async () => {
    try {
      const res = await api.get("/sms/test-connection");
      setConnectionStatus(res.data.data.connected);
    } catch {
      setConnectionStatus(false);
      toast.error("Eskiz API bilan aloqada muammo");
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await api.get("/sms/templates");
      setTemplates(res.data.data);
    } catch (err) {
      console.error("Shablonlarni yuklashda xatolik:", err);
    }
  }, []);

  const fetchUserInfo = useCallback(async () => {
    try {
      const res = await api.get("/sms/user-info");
      setUserInfo(res.data.data);
    } catch (err) {
      console.error("Foydalanuvchi ma'lumotlarini yuklashda xatolik:", err);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const res = await api.get("/sms/reports/summary", {
        year,
        month,
      });
      setReports(res.data.data);
    } catch (err) {
      console.error("Hisobotlarni yuklashda xatolik:", err);
    }
  }, []);

  useEffect(() => {
    fetchSmsHistory();
    fetchBalance();
    fetchStatistics();
    testConnection();
    fetchTemplates();
    fetchUserInfo();
    fetchReports();
  }, [
    fetchSmsHistory,
    fetchBalance,
    fetchStatistics,
    testConnection,
    fetchTemplates,
    fetchUserInfo,
    fetchReports,
  ]);

  // SMS operations
  const sendSingleSms = async (data) => {
    setLoading(true);
    try {
      const phone = data.phone.replace(/\D/g, "");
      const formattedPhone = phone.startsWith("998") ? phone : `998${phone}`;

      const res = await api.post("/sms/send", {
        phone: formattedPhone,
        message: data.message,
        from: data.from,
      });

      toast.success(res.data.message || "SMS muvaffaqiyatli jo'natildi");
      resetSingle();
      setOpened(false);
      fetchSmsHistory();
      fetchBalance();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "SMS jo'natishda xatolik";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendMultipleSms = async (data) => {
    setLoading(true);
    try {
      const recipients = data.recipients.map((r) => {
        const phone = r.phone.replace(/\D/g, "");
        const formattedPhone = phone.startsWith("998") ? phone : `998${phone}`;

        return {
          phone: formattedPhone,
          message: r.message,
          from: r.from,
        };
      });

      const res = await api.post("/sms/send-multiple", { recipients });

      toast.success(res.data.message);
      resetMultiple();
      setMultipleOpened(false);
      fetchSmsHistory();
      fetchBalance();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "SMS'larni jo'natishda xatolik";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationSms = async (data) => {
    setLoading(true);
    try {
      const phone = data.phone.replace(/\D/g, "");
      const formattedPhone = phone.startsWith("998") ? phone : `998${phone}`;

      const res = await api.post("/sms/send-verification", {
        phone: formattedPhone,
        code: data.code,
        appName: data.appName,
      });

      toast.success(
        res.data.message || "Tasdiqlash kodi muvaffaqiyatli jo'natildi"
      );
      resetVerification();
      setVerificationOpened(false);
      fetchSmsHistory();
      fetchBalance();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Tasdiqlash SMS'ini jo'natishda xatolik";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkSmsStatus = async (messageId) => {
    try {
      const res = await api.get(`/sms/status/${messageId}`);
      toast.success(res.data.message || "SMS holati yangilandi");
      fetchSmsHistory();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "SMS holatini tekshirishda xatolik";
      toast.error(errorMessage);
    }
  };

  // Check SMS message for blacklist and cost
  const checkSmsMessage = async (message) => {
    try {
      const res = await api.post("/sms/check", { message });
      return res.data.data;
    } catch (err) {
      console.error("SMS tekshirish xatosi:", err);
      toast.error("SMS tekshirishda xatolik yuz berdi");
      return null;
    }
  };

  const deleteSmsFromHistory = async (id) => {
    if (!window.confirm("SMS tarixini o'chirshni xohlaysizmi?")) return;

    try {
      await api.delete(`/sms/${id}`);
      toast.success("SMS tarixi o'chirildi");
      fetchSmsHistory();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "SMS tarixini o'chirishda xatolik";
      toast.error(errorMessage);
    }
  };

  // Template operations
  const createTemplate = async (data) => {
    setLoading(true);
    try {
      const res = await api.post("/sms/template", {
        template: data.template,
      });

      toast.success(res.data.message || "Shablon muvaffaqiyatli yaratildi");
      resetTemplate();
      setCreateTemplateOpened(false);
      fetchTemplates();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Shablon yaratishda xatolik";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm("Shablonni o'chirshni xohlaysizmi?")) return;

    try {
      await api.delete(`/sms/template/${templateId}`);
      toast.success("Shablon o'chirildi");
      fetchTemplates();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Shablonni o'chirishda xatolik";
      toast.error(errorMessage);
    }
  };

  const applyTemplate = (template) => {
    // Single SMS modalga shablon matnini ko'chirish
    resetSingle({
      phone: "",
      message: template.template || template.content,
      from: "4546",
    });
    setTemplatesOpened(false);
    setOpened(true);
  };

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      phone: "",
      status: "",
      type: "",
      startDate: "",
      endDate: "",
    });
  };

  // Refresh all data
  const refreshAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSmsHistory(),
        fetchBalance(),
        fetchStatistics(),
        testConnection(),
      ]);
      toast.success("Ma'lumotlar yangilandi");
    } catch (err) {
      console.error("Ma'lumotlarni yangilashda xatolik:", err);
      toast.error("Ma'lumotlarni yangilashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh balance and connection status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBalance();
      testConnection();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchBalance, testConnection]);

  // Format phone number
  const formatPhone = (phone) => {
    if (!phone) return "";
    // Handle both formats: 998XXXXXXXXX and +998XXXXXXXXX
    const cleanPhone = phone.replace(/^\+/, "").replace(/\D/g, "");
    if (cleanPhone.length === 12 && cleanPhone.startsWith("998")) {
      return cleanPhone.replace(
        /(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/,
        "$1 $2 $3-$4-$5"
      );
    } else if (cleanPhone.length === 9) {
      // Add 998 prefix if missing
      return `998 ${cleanPhone.substring(0, 2)} ${cleanPhone.substring(
        2,
        5
      )}-${cleanPhone.substring(5, 7)}-${cleanPhone.substring(7)}`;
    }
    return phone; // Return original if format is unexpected
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("uz-UZ");
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusConfig = (status) => {
      status = status?.toLowerCase() || "";
      switch (status) {
        case "delivrd":
        case "delivered":
          return { color: "#28a745", icon: CheckCircle, text: "Yetkazildi" };
        case "sent":
          return { color: "#007bff", icon: Send, text: "Jo'natildi" };
        case "pending":
          return { color: "#ffc107", icon: Clock, text: "Kutilmoqda" };
        case "failed":
          return { color: "#dc3545", icon: XCircle, text: "Xatolik" };
        default:
          return { color: "#6c757d", icon: Clock, text: status || "Noma'lum" };
      }
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
      <span
        style={{
          color: config.color,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontWeight: "500",
        }}
      >
        <Icon size={14} color={config.color} />
        {config.text}
      </span>
    );
  };

  // Ulanganlik badge komponenti
  const ConnectionBadge = () => {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 16,
          fontWeight: 600,
          fontSize: 14,
          background: connectionStatus ? "#e0ffe0" : "#ffe0e0",
          color: connectionStatus ? "#22c55e" : "#dc2626",
          border: `1px solid ${connectionStatus ? "#22c55e" : "#dc2626"}`,
          marginLeft: 12,
        }}
        title={
          connectionStatus
            ? "Eskiz API bilan aloqa mavjud"
            : "Eskiz API bilan aloqa yo'q"
        }
      >
        {connectionStatus ? (
          <>
            <BadgeCheck size={16} color="#22c55e" />
            Ulangan
          </>
        ) : (
          <>
            <BadgeX size={16} color="#dc2626" />
            Ulanmagan
          </>
        )}
      </span>
    );
  };

  // Table columns
  const columns = [
    {
      key: "phone",
      title: "Telefon",
      render: (_, row) => formatPhone(row.phone),
    },
    {
      key: "message",
      title: "Xabar",
      render: (_, row) => (
        <div style={{ maxWidth: "200px" }}>
          {row.message?.length > 50
            ? `${row.message.substring(0, 50)}...`
            : row.message}
        </div>
      ),
    },
    {
      key: "status",
      title: "Holat",
      render: (_, row) => <StatusBadge status={row.status} />,
    },
    {
      key: "type",
      title: "Tur",
      render: (_, row) => {
        const types = {
          order: "Buyurtma",
          notification: "Bildirishnoma",
          verification: "Tasdiqlash",
          marketing: "Marketing",
        };
        return types[row.type] || row.type;
      },
    },
    {
      key: "cost",
      title: "Narx",
      render: (_, row) => (row.cost ? `${row.cost} so'm` : "-"),
    },
    {
      key: "sentAt",
      title: "Jo'natilgan vaqt",
      render: (_, row) => formatDate(row.sentAt || row.createdAt),
    },
    {
      key: "sentBy",
      title: "Jo'natgan",
      render: (_, row) => row.sentBy?.fullName || "-",
    },
    {
      key: "actions",
      title: "Amallar",
      render: (_, row) => (
        <div className="actions-row">
          <button
            type="button"
            onClick={() => {
              setSelectedSms(row);
              setDetailsOpened(true);
            }}
            title="Batafsil"
          >
            <Eye size={16} />
          </button>
          {row.messageId && (
            <button
              type="button"
              onClick={() => checkSmsStatus(row.messageId)}
              title="Holatni yangilash"
            >
              <RefreshCw size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => deleteSmsFromHistory(row._id)}
            title="O'chirish"
            style={{ color: "#dc3545" }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  // Clientlar uchun table ustunlari
  const clientColumns = useMemo(
    () => [
      { key: "fullName", title: "Ismi" },
      {
        key: "phone",
        title: "Telefon",
        render: (_, row) => formatPhone(row.phone),
      },
      {
        key: "visitIndex",
        title: "Servicega tashrifi",
        render: (_, row) => `${row.visitIndex || 0} marta`,
      },
      {
        key: "is_vip",
        title: "VIP",
        render: (_, row) => (row.isVip ? "Ha" : "Yo'q"),
      },
      {
        key: "createdAt",
        title: "Yaratilgan",
        render: (_, row) => formatDate(row.createdAt),
      },
    ],
    []
  );

  const messageLength = watchSingle("message")?.length || 0;
  const currentMessage = watchSingle("message") || "";
  const maxLength = 918;

  // Real-time message checking
  useEffect(() => {
    const checkMessage = async () => {
      if (currentMessage && currentMessage.length > 0) {
        const checkResult = await checkSmsMessage(currentMessage);
        setMessageCheck(checkResult);
      } else {
        setMessageCheck(null);
      }
    };

    const timeoutId = setTimeout(checkMessage, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [currentMessage]);

  return (
    <div className="sms-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>SMS Xizmatlari</h1>
          <p>SMS jo'natish va boshqarish tizimi</p>
          {userInfo && (
            <div className="user-badge">
              <span className="user-name">{userInfo.name}</span>
              <span className={`user-status ${userInfo.status}`}>
                {userInfo.status === "active" ? "Faol" : userInfo.status}
              </span>
              {userInfo.is_vip && <span className="vip-badge">VIP</span>}
            </div>
          )}
        </div>

        <div className="header-actions">
          <ConnectionBadge />
          <button
            onClick={refreshAllData}
            className="refresh-btn"
            title="Ma'lumotlarni yangilash"
            disabled={loading}
          >
            <RefreshCw size={16} />
            {loading ? "Yangilanmoqda..." : "Yangilash"}
          </button>

          <button onClick={() => setStatsOpened(true)} className="stats-btn">
            <DollarSign size={16} />
            Statistika
          </button>

          <button
            onClick={() => setTemplatesOpened(true)}
            className="templates-btn"
          >
            <FileText size={16} />
            Shablonlar
          </button>

          <button
            onClick={() => setReportsOpened(true)}
            className="reports-btn"
          >
            <FileText size={16} />
            Hisobotlar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign />
          </div>
          <div className="stat-content">
            <h3>
              {(balance?.balance || userInfo?.balance || 0)?.toLocaleString()}{" "}
              so'm
            </h3>
            <p>Hisob balansi</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <MessageCircle />
          </div>
          <div className="stat-content">
            <h3>{statistics?.summary?.total || 0}</h3>
            <p>Jami SMS</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle />
          </div>
          <div className="stat-content">
            <h3>
              {statistics?.summary?.delivered || statistics?.summary?.sent || 0}
            </h3>
            <p>Yetkazildi</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <XCircle />
          </div>
          <div className="stat-content">
            <h3>{statistics?.summary?.failed || 0}</h3>
            <p>Xatolik</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        <button onClick={() => setOpened(true)} className="primary-btn">
          <Send size={16} />
          Bitta SMS jo'natish
        </button>

        <button
          onClick={() => setMultipleOpened(true)}
          className="secondary-btn"
        >
          <Users size={16} />
          Ko'plab SMS jo'natish
        </button>

        <button
          onClick={() => setVerificationOpened(true)}
          className="tertiary-btn"
        >
          <MessageCircle size={16} />
          Tasdiqlash kodi
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 18 }}>
        <button
          className={`tab-button${activeTab === "sms" ? " active" : ""}`}
          onClick={() => setActiveTab("sms")}
        >
          SMS Tarixi
        </button>
        <button
          className={`tab-button${activeTab === "clients" ? " active" : ""}`}
          onClick={() => setActiveTab("clients")}
        >
          Mijozlar
        </button>
      </div>

      {/* Filters */}
      {activeTab === "sms" && (
        <div className="filters-section">
          <div className="filters-row">
            <Input
              placeholder="Telefon raqami"
              value={filters.phone}
              onChange={(e) => handleFilterChange("phone", e.target.value)}
            />

            <SearchSelect
              options={[
                { value: "", label: "Barcha holatlar" },
                { value: "pending", label: "Kutilmoqda" },
                { value: "sent", label: "Jo'natildi" },
                { value: "delivered", label: "Yetkazildi" },
                { value: "DELIVRD", label: "Yetkazildi" },
                { value: "failed", label: "Xatolik" },
              ]}
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              placeholder="Holat"
            />

            <SearchSelect
              options={[
                { value: "", label: "Barcha turlar" },
                { value: "order", label: "Buyurtma" },
                { value: "notification", label: "Bildirishnoma" },
                { value: "verification", label: "Tasdiqlash" },
                { value: "marketing", label: "Marketing" },
              ]}
              value={filters.type}
              onChange={(value) => handleFilterChange("type", value)}
              placeholder="Tur"
            />

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="date-input"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="date-input"
            />

            <button onClick={clearFilters} className="clear-btn">
              Tozalash
            </button>
          </div>
        </div>
      )}

      {/* Table section */}
      <div className="table-section">
        {activeTab === "sms" && (
          <>
            <h2>SMS Tarixi</h2>
            <Table
              columns={columns}
              data={smsHistory}
              loading={tableLoading}
              pagination={{
                ...pagination,
                onPageChange: fetchSmsHistory,
              }}
            />
          </>
        )}
        {activeTab === "clients" && (
          <>
            <h2>Mijozlar ro'yxati</h2>
            <Table columns={clientColumns} data={clients} />
          </>
        )}
      </div>

      {/* Single SMS Modal */}
      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false);
          resetSingle();
        }}
        title="Bitta SMS jo'natish"
      >
        <form onSubmit={handleSubmitSingle(sendSingleSms)} className="sms-form">
          {/* Client select */}
          <SearchSelect
            label="Mijoz tanlang (ixtiyoriy)"
            options={[
              { value: "", label: "Tanlanmagan" },
              ...clients.map((c) => ({
                value: c.phone,
                label: `${c.fullName} (${c.phone})`,
              })),
            ]}
            value={watchSingle("phone")}
            onChange={(v) => {
              resetSingle({
                ...watchSingle(),
                phone: v,
              });
            }}
            style={{ marginBottom: 8 }}
          />
          {/* Phone input */}
          <Input
            label="Telefon raqami"
            placeholder="998901234567"
            {...registerSingle("phone", {
              required: "Telefon raqami majburiy",
              validate: (value) => {
                const cleanPhone = value.replace(/\D/g, "");
                if (cleanPhone.length < 9) {
                  return "Telefon raqami juda qisqa";
                }
                if (cleanPhone.length > 12) {
                  return "Telefon raqami juda uzun";
                }
                const formattedPhone = cleanPhone.startsWith("998")
                  ? cleanPhone
                  : `998${cleanPhone}`;
                if (!/^998\d{9}$/.test(formattedPhone)) {
                  return "Telefon raqami 998XXXXXXXXX formatida bo'lishi kerak";
                }
                return true;
              },
            })}
            error={errorsSingle.phone?.message}
          />

          <div className="textarea-wrapper">
            <label>Xabar matni</label>
            <textarea
              {...registerSingle("message", {
                required: "Xabar matni majburiy",
                maxLength: {
                  value: maxLength,
                  message: `Xabar ${maxLength} belgidan oshmasligi kerak`,
                },
              })}
              placeholder="SMS matnini kiriting..."
              rows={4}
              className={errorsSingle.message ? "error" : ""}
            />
            <div className="message-info">
              <div className="char-counter">
                {messageLength}/{maxLength}
                {messageCheck && (
                  <span className="parts-info">
                    • {messageCheck.parts} qism
                  </span>
                )}
              </div>
              {messageCheck && messageCheck.is_blacklisted && (
                <div className="blacklist-warning">
                  ⚠️ Xabar qora ro'yxatda!
                </div>
              )}
              {messageCheck && messageCheck.cost && (
                <div className="cost-info">
                  Taxminiy narx: {Object.values(messageCheck.cost)[0] || 0} so'm
                </div>
              )}
            </div>
            {errorsSingle.message && (
              <span className="error-message">
                {errorsSingle.message.message}
              </span>
            )}
          </div>

          <Input
            label="Jo'natuvchi (ixtiyoriy)"
            placeholder="4546"
            {...registerSingle("from")}
          />

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Jo'natilmoqda..." : "SMS jo'natish"}
          </button>
        </form>
      </Modal>

      {/* Multiple SMS Modal */}
      <Modal
        opened={multipleOpened}
        onClose={() => {
          setMultipleOpened(false);
          resetMultiple();
        }}
        title="Ko'plab SMS jo'natish"
        size="large"
      >
        <form
          onSubmit={handleSubmitMultiple(sendMultipleSms)}
          className="sms-form"
        >
          {fields.map((field, index) => (
            <div key={field.id} className="recipient-row">
              <h4>Qabul qiluvchi #{index + 1}</h4>
              <SearchSelect
                label="Mijoz tanlang (ixtiyoriy)"
                options={[
                  { value: "", label: "Tanlanmagan" },
                  ...clients.map((c) => ({
                    value: c.phone,
                    label: `${c.fullName} (${c.phone})`,
                  })),
                ]}
                value={watchSingle(`recipients.${index}.phone`)}
                onChange={(v) => {
                  setValue(`recipients.${index}.phone`, v, {
                    shouldValidate: true,
                  });
                }}
                style={{ marginBottom: 8 }}
              />
              <Input
                label="Telefon raqami"
                placeholder="998901234567"
                {...registerMultiple(`recipients.${index}.phone`, {
                  required: "Telefon raqami majburiy",
                  validate: (value) => {
                    const cleanPhone = value.replace(/\D/g, "");
                    if (cleanPhone.length < 9) {
                      return "Telefon raqami juda qisqa";
                    }
                    if (cleanPhone.length > 12) {
                      return "Telefon raqami juda uzun";
                    }
                    const formattedPhone = cleanPhone.startsWith("998")
                      ? cleanPhone
                      : `998${cleanPhone}`;
                    if (!/^998\d{9}$/.test(formattedPhone)) {
                      return "Telefon raqami 998XXXXXXXXX formatida bo'lishi kerak";
                    }
                    return true;
                  },
                })}
                onChange={(e) => {
                  setValue(`recipients.${index}.phone`, e.target.value, {
                    shouldValidate: true,
                  });
                }}
                value={watchSingle(`recipients.${index}.phone`)}
                error={errorsMultiple.recipients?.[index]?.phone?.message}
              />

              <div className="textarea-wrapper">
                <label>Xabar matni</label>
                <textarea
                  {...registerMultiple(`recipients.${index}.message`, {
                    required: "Xabar matni majburiy",
                    maxLength: {
                      value: maxLength,
                      message: `Xabar ${maxLength} belgidan oshmasligi kerak`,
                    },
                  })}
                  placeholder="SMS matnini kiriting..."
                  rows={3}
                />
                {errorsMultiple.recipients?.[index]?.message && (
                  <span className="error-message">
                    {errorsMultiple.recipients[index].message.message}
                  </span>
                )}
              </div>

              <Input
                label="Jo'natuvchi (ixtiyoriy)"
                placeholder="4546"
                {...registerMultiple(`recipients.${index}.from`)}
              />

              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="remove-recipient-btn"
                >
                  O'chirish
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => append({ phone: "", message: "", from: "4546" })}
            className="add-recipient-btn"
          >
            <Plus size={16} />
            Qabul qiluvchi qo'shish
          </button>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Jo'natilmoqda..." : "SMS'larni jo'natish"}
          </button>
        </form>
      </Modal>

      {/* Verification SMS Modal */}
      <Modal
        opened={verificationOpened}
        onClose={() => {
          setVerificationOpened(false);
          resetVerification();
        }}
        title="Tasdiqlash kodi jo'natish"
      >
        <form
          onSubmit={handleSubmitVerification(sendVerificationSms)}
          className="sms-form"
        >
          <Input
            label="Telefon raqami"
            placeholder="998901234567"
            {...registerVerification("phone", {
              required: "Telefon raqami majburiy",
              validate: (value) => {
                const cleanPhone = value.replace(/\D/g, "");
                if (cleanPhone.length < 9) {
                  return "Telefon raqami juda qisqa";
                }
                if (cleanPhone.length > 12) {
                  return "Telefon raqami juda uzun";
                }
                const formattedPhone = cleanPhone.startsWith("998")
                  ? cleanPhone
                  : `998${cleanPhone}`;
                if (!/^998\d{9}$/.test(formattedPhone)) {
                  return "Telefon raqami 998XXXXXXXXX formatida bo'lishi kerak";
                }
                return true;
              },
            })}
            error={errorsVerification.phone?.message}
          />

          <Input
            label="Tasdiqlash kodi (ixtiyoriy)"
            placeholder="123456"
            {...registerVerification("code")}
            help="Bo'sh qoldirilsa, avtomatik yaratiladi"
          />

          <Input
            label="Ilova nomi"
            placeholder="Sklad"
            {...registerVerification("appName")}
          />

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Jo'natilmoqda..." : "Tasdiqlash kodi jo'natish"}
          </button>
        </form>
      </Modal>

      {/* SMS Details Modal */}
      <Modal
        opened={detailsOpened}
        onClose={() => {
          setDetailsOpened(false);
          setSelectedSms(null);
        }}
        title="SMS Tafsilotlari"
      >
        {selectedSms && (
          <div className="sms-details">
            <div className="detail-row">
              <strong>Telefon:</strong>
              <span>{formatPhone(selectedSms.phone)}</span>
            </div>

            <div className="detail-row">
              <strong>Xabar:</strong>
              <span>{selectedSms.message}</span>
            </div>

            <div className="detail-row">
              <strong>Holat:</strong>
              <StatusBadge status={selectedSms.status} />
            </div>

            <div className="detail-row">
              <strong>Tur:</strong>
              <span>{selectedSms.type}</span>
            </div>

            {selectedSms.cost && (
              <div className="detail-row">
                <strong>Narx:</strong>
                <span>{selectedSms.cost} so'm</span>
              </div>
            )}

            <div className="detail-row">
              <strong>Jo'natilgan vaqt:</strong>
              <span>
                {formatDate(selectedSms.sentAt || selectedSms.createdAt)}
              </span>
            </div>

            {selectedSms.sentBy && (
              <div className="detail-row">
                <strong>Jo'natgan:</strong>
                <span>{selectedSms.sentBy.fullName}</span>
              </div>
            )}

            {selectedSms.messageId && (
              <div className="detail-row">
                <strong>Message ID:</strong>
                <span>{selectedSms.messageId}</span>
              </div>
            )}

            {selectedSms.failureReason && (
              <div className="detail-row">
                <strong>Xatolik sababi:</strong>
                <span style={{ color: "#dc3545" }}>
                  {selectedSms.failureReason}
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Statistics Modal */}
      <Modal
        opened={statsOpened}
        onClose={() => setStatsOpened(false)}
        title="SMS Statistikasi"
        size="large"
      >
        {statistics && (
          <div className="statistics-content">
            <div className="stats-summary">
              <h3>Umumiy ma'lumotlar</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span>Jami SMS:</span>
                  <strong>{statistics.summary.total}</strong>
                </div>
                <div className="summary-item">
                  <span>Yetkazildi:</span>
                  <strong>
                    {statistics.summary.delivered || statistics.summary.sent}
                  </strong>
                </div>
                <div className="summary-item">
                  <span>Xatolik:</span>
                  <strong>{statistics.summary.failed}</strong>
                </div>
                <div className="summary-item">
                  <span>Tasdiqlash:</span>
                  <strong>{statistics.summary.verification}</strong>
                </div>
                <div className="summary-item">
                  <span>Umumiy xarajat:</span>
                  <strong>{statistics.summary.totalCost} so'm</strong>
                </div>
              </div>
            </div>

            {statistics.statusStats && statistics.statusStats.length > 0 && (
              <div className="status-stats">
                <h3>Status bo'yicha</h3>
                <div className="status-grid">
                  {statistics.statusStats.map((stat, index) => (
                    <div key={index} className="status-item">
                      <span>{stat._id}:</span>
                      <strong>{stat.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {statistics.typeStats && statistics.typeStats.length > 0 && (
              <div className="type-stats">
                <h3>Tur bo'yicha</h3>
                <div className="type-grid">
                  {statistics.typeStats.map((stat, index) => (
                    <div key={index} className="type-item">
                      <span>{stat._id || "Boshqa"}:</span>
                      <strong>{stat.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {statistics.dailyStats && statistics.dailyStats.length > 0 && (
              <div className="daily-stats">
                <h3>Kunlik statistika (oxirgi 30 kun)</h3>
                <div className="daily-grid">
                  {statistics.dailyStats.map((stat, index) => (
                    <div key={index} className="daily-item">
                      <span>
                        {typeof stat._id === "object"
                          ? `${stat._id.year}-${String(stat._id.month).padStart(
                              2,
                              "0"
                            )}-${String(stat._id.day).padStart(2, "0")}`
                          : stat._id}
                        :
                      </span>
                      <strong>{stat.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Templates Modal */}
      <Modal
        opened={templatesOpened}
        onClose={() => setTemplatesOpened(false)}
        title="SMS Shablonlari"
        size="large"
      >
        <div className="templates-content">
          <div className="templates-header">
            <h3>Mavjud Shablonlar</h3>
            <button
              className="create-template-btn"
              onClick={() => setCreateTemplateOpened(true)}
            >
              <Plus size={16} />
              Yangi shablon
            </button>
          </div>

          {templates && templates.length > 0 ? (
            <div className="templates-list">
              {templates.map((template, index) => (
                <div key={template._id || index} className="template-item">
                  <div className="template-content">
                    <h4>Shablon #{template.id || index + 1}</h4>
                    <p>{template.template || template.content}</p>
                    {template.createdAt && (
                      <small>
                        Yaratilgan:{" "}
                        {new Date(template.createdAt).toLocaleDateString(
                          "uz-UZ"
                        )}
                      </small>
                    )}
                  </div>
                  <div className="template-actions">
                    <button
                      className="use-template-btn"
                      onClick={() => applyTemplate(template)}
                    >
                      Ishlatish
                    </button>
                    <button
                      className="delete-template-btn"
                      onClick={() =>
                        deleteTemplate(template._id || template.id)
                      }
                      title="O'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-templates">
              <p>Hozircha shablonlar mavjud emas</p>
              <button
                className="create-first-template-btn"
                onClick={() => setCreateTemplateOpened(true)}
              >
                Birinchi shablonni yaratish
              </button>
            </div>
          )}

          {userInfo && (
            <div className="user-info-section">
              <h3>Hisob Ma'lumotlari</h3>
              <div className="user-info-grid">
                <div className="info-item">
                  <span>Foydalanuvchi:</span>
                  <strong>{userInfo.name || "N/A"}</strong>
                </div>
                <div className="info-item">
                  <span>Email:</span>
                  <strong>{userInfo.email || "N/A"}</strong>
                </div>
                <div className="info-item">
                  <span>Status:</span>
                  <strong>{userInfo.status || "N/A"}</strong>
                </div>
              </div>
              <div className="user-info-grid">
                <div className="info-item">
                  <span>Rol:</span>
                  <strong>{userInfo.role || "N/A"}</strong>
                </div>
                <div className="info-item">
                  <span>Balans:</span>
                  <strong>{userInfo.balance || 0} so'm</strong>
                </div>
                <div className="info-item">
                  <span>VIP:</span>
                  <strong>{userInfo.is_vip ? "Ha" : "Yo'q"}</strong>
                </div>
                <div className="info-item">
                  <span>Yaratilgan:</span>
                  <strong>
                    {userInfo.created_at
                      ? new Date(userInfo.created_at).toLocaleDateString(
                          "uz-UZ"
                        )
                      : "N/A"}
                  </strong>
                </div>
                <div className="info-item">
                  <span>Yangilangan:</span>
                  <strong>
                    {userInfo.updated_at
                      ? new Date(userInfo.updated_at).toLocaleDateString(
                          "uz-UZ"
                        )
                      : "N/A"}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Reports Modal */}
      <Modal
        opened={reportsOpened}
        onClose={() => setReportsOpened(false)}
        title="SMS Hisobotlari"
        size="large"
      >
        <div className="reports-content">
          {reports && (
            <>
              <div className="reports-period">
                <h3>
                  Hisobot davri: {reports.period.year}
                  {reports.period.month && ` - ${reports.period.month}-oy`}
                </h3>
              </div>

              <div className="reports-summary">
                <div className="summary-section">
                  <h4>Eskiz.uz API ma'lumotlari</h4>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span>Jami SMS:</span>
                      <strong>{reports.eskizData?.sms_count || 0}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Jami xarajat:</span>
                      <strong>
                        {reports.eskizData?.total_price || 0} so'm
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="summary-section">
                  <h4>Mahalliy ma'lumotlar</h4>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span>Jami SMS:</span>
                      <strong>{reports.localData?.totalSms || 0}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Yetkazildi:</span>
                      <strong>{reports.localData?.delivered || 0}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Xatolik:</span>
                      <strong>{reports.localData?.failed || 0}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Kutilmoqda:</span>
                      <strong>{reports.localData?.pending || 0}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Jami xarajat:</span>
                      <strong>{reports.localData?.totalCost || 0} so'm</strong>
                    </div>
                  </div>
                </div>

                {reports.monthlyBreakdown &&
                  reports.monthlyBreakdown.length > 0 && (
                    <div className="summary-section">
                      <h4>Oylik taqsimot</h4>
                      <div className="monthly-breakdown">
                        {reports.monthlyBreakdown.map((month, index) => (
                          <div key={index} className="month-item">
                            <span>
                              {typeof month._id === "object"
                                ? `${new Date().getFullYear()}-${String(
                                    month._id.month
                                  ).padStart(2, "0")}`
                                : `${month._id || month.month || index + 1}`}
                              -oy:
                            </span>
                            <div className="month-stats">
                              <span>{month.count || 0} SMS</span>
                              <span>{month.cost || 0} so'm</span>
                              <span>{month.delivered || 0} yetkazildi</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="summary-section">
                  <h4>Hisob ma'lumotlari</h4>
                  <div className="account-info">
                    <div className="balance-info">
                      <span>Joriy balans:</span>
                      <strong>
                        {reports.account?.balance?.balance || 0} so'm
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Create Template Modal */}
      <Modal
        opened={createTemplateOpened}
        onClose={() => {
          setCreateTemplateOpened(false);
          resetTemplate();
        }}
        title="Yangi SMS Shabloni"
      >
        <form
          onSubmit={handleSubmitTemplate(createTemplate)}
          className="sms-form"
        >
          <div className="textarea-wrapper">
            <label>Shablon matni</label>
            <textarea
              {...registerTemplate("template", {
                required: "Shablon matni majburiy",
                minLength: {
                  value: 5,
                  message: "Shablon kamida 5 belgidan iborat bo'lishi kerak",
                },
                maxLength: {
                  value: 500,
                  message: "Shablon 500 belgidan oshmasligi kerak",
                },
              })}
              placeholder="Shablon matnini kiriting... Masalan: Hurmatli {name}, sizning buyurtmangiz #{order_id} tayyor!"
              rows={6}
              className={errorsTemplate.template ? "error" : ""}
            />
            <div className="help-text">
              <p>Shablon o'zgaruvchilari:</p>
              <ul>
                <li>{"{{name}}"} - Mijoz ismi</li>
                <li>{"{{phone}}"} - Telefon raqami</li>
                <li>{"{{order_id}}"} - Buyurtma ID</li>
                <li>{"{{amount}}"} - Summa</li>
                <li>{"{{date}}"} - Sana</li>
              </ul>
            </div>
            {errorsTemplate.template && (
              <span className="error-message">
                {errorsTemplate.template.message}
              </span>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => {
                setCreateTemplateOpened(false);
                resetTemplate();
              }}
              className="cancel-btn"
            >
              Bekor qilish
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Yaratilmoqda..." : "Shablon yaratish"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sms;
