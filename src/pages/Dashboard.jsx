import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import moment from "moment/min/moment-with-locales";
import "moment/locale/uz";
import { toast } from "react-toastify";
import {
  DashboardIcon,
  Dollar,
  Balance,
  Cart,
  Pen,
  Trash,
  Loader,
  X,
  Upload,
  Folder,
} from "../assets/icons";
import Table from "../components/Table";
import DebtTimer from "../components/DebtTimer";
import NumberAnimation from "../components/Counter";
import api from "../services/api";
import Input from "../components/Input";
import "../styles/dashboard.css";
import Switch from "../components/Switch";
import * as XLSX from "xlsx";
import "../styles/warehouse.css";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import PaymentModal from "../components/PaymentModal";
import ClientForm from "../components/ClientForm";
import SearchSelect from "../components/SearchSelect";

moment.locale("uz");

// Простой компонент для модального окна данных
const Data = () => {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h3>Ma'lumotlar</h3>
      <p>Bu yerda ma'lumotlar ko'rsatiladi</p>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState({});
  const [debtors, setDebtors] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [openModal, setOpenModal] = useState({ is_open: false, form: "" });
  const [tabs, setTabs] = useState("debt");
  const [bestSellingFilter, setBestSellingFilter] = useState({
    name: "",
  });
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);

  // Расширенные фильтры для qarzdorlar
  const [debtorFilters, setDebtorFilters] = useState({
    client: "",
    status: "",
    initialDebtMin: "",
    initialDebtMax: "",
    currentDebtMin: "",
    currentDebtMax: "",
    totalPaidMin: "",
    totalPaidMax: "",
    startDate: "",
    endDate: "",
    nextPaymentDue: "",
    hasLastPayment: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const [today, setToday] = useState(() => {
    return moment().startOf("day");
  });

  const [endOfMonth, setEndOfMonth] = useState(() => moment().endOf("month"));
  const currnetDate = moment().startOf("day");

  const statsIcons = useMemo(
    () => [
      {
        key: "todayIncome",
        prefix: "so'm",
        title: "Bugungi daromad",
        icon: <Balance />,
        bg: "linear-gradient(201deg, #CAF1FF 3.14%, #CDF4FF 86.04%)",
        onClick: () => {
          setOpenModal({ is_open: true, form: "todayIncome" });
        },
        hide: today.format("YYYY-MM-DD") === currnetDate.format("YYYY-MM-DD"),
      },

      {
        key: "clients.regular.total",
        prefix: "ta",
        title: "Oddiy Mijozlar",
        icon: <Dollar size={42} />,
        bg: "linear-gradient(201deg, #FFE5D3 3.14%, #FFF6EF 86.04%)",
        hide: false,
        accessor: (stats) => stats.clients?.regular?.total,
      },
      {
        key: "debtors",
        prefix: "so'm",
        title: "Jami qarzlar",
        icon: <Dollar size={42} />,
        bg: "linear-gradient(201deg, #FFE5D3 3.14%, #FFF6EF 86.04%)",
        hide: false,
        render: (debtors) => debtors?.amount,
      },

      {
        key: "stockCount",
        prefix: "ta",
        title: "Ombordagi mahsulotlar",
        icon: <Cart size={42} color="#ff007b" />,
        bg: "linear-gradient(201deg, #FFA3CF 3.14%, #FFD4F3 86.04%)",
        onClick: () => {
          navigate("/warehouse");
        },
        hide: false,
      },
      {
        key: "productCapital",
        prefix: "so'm",
        title: "Mahsulot kapitali",
        icon: <Folder size={42} />,
        bg: "linear-gradient(201deg, #FFE5D3 3.14%, #FFF6EF 86.04%)",
        hide: false,
      },
      {
        key: "clients.new",
        prefix: "ta",
        title: "Yangi mijozlar",
        icon: <Pen size={42} color="#fff" />,
        bg: "linear-gradient(201deg, #FEE3BC 3.14%, #F39876 86.04%)",
        hide: false,
        accessor: (stats) => stats.clients?.new,
      },
      {
        key: "clients.total",
        prefix: "ta",
        title: "Jami mijozlar",
        icon: <DashboardIcon size={42} />,
        bg: "linear-gradient(201deg, #B5FFFC 3.14%, #6EE2F5 86.04%)",
        hide: false,
        accessor: (stats) => stats.clients?.total,
      },
      {
        key: "debtors.total.count",
        prefix: "ta",
        title: "Qarzdorlar soni",
        icon: <Pen size={42} color="#fff" />,
        bg: "linear-gradient(201deg, #E0C3FC 3.14%, #8EC5FC 86.04%)",
        hide: false,
        accessor: (stats) => stats.debtors?.count,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, setToday, currnetDate]
  );
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      client: "",
      description: "",
      currentDebt: 0,
      nextPayment: {
        amount: 0,
        dueDate: "",
      },
    },
  });

  // Fetch stats, debtors
  const fetchAll = async () => {
    try {
      const statsRes = await api.get(
        `/dashboard/summary?startofMonth=${today.toISOString()}&endofManth=${endOfMonth.toISOString()}`
      );

      // Получаем данные статистики
      const statsData = statsRes.data?.data?.topCards || {};
      const chartData = statsRes.data?.data?.charts || {};

      // Установка данных
      setStats(statsData);
      setCharts(chartData);

      console.log("Dashboard data:", statsRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    }
  };

  const getDebtors = useCallback(async () => {
    try {
      const params = {};

      // ...other filters can be added here if needed...
      const query = new URLSearchParams(params).toString();
      const { data } = await api.get(`/debtors${query ? "?" + query : ""}`);
      setDebtors(data);
    } catch (err) {
      console.error(err);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    }
  }, []);

  const getClients = async () => {
    try {
      const clientsRes = await api.get("/clients");
      setClients(clientsRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    }
  };

  // Функция для обработки успешного создания клиента
  const handleClientCreated = (newClient) => {
    setClients((prev) => [newClient, ...prev]);
    setClientModalOpen(false);
    // Автоматически выбираем созданного клиента
    setValue("client", newClient._id);
    toast.success("Mijoz muvaffaqiyatli yaratildi va tanlandi!");
  };
  // П
  // олучить все продукты (товары) для сопоставления lowStockProducts
  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/products");
      setProducts(data?.data);
    } catch (err) {
      console.error(err);
      toast.error("Mahsulotlarni yuklab bo‘lmadi");
    }
  };

  const getBestSelling = async () => {
    try {
      const { data } = await api.get("/orders/bestselling");
      setBestSelling(
        data?.length > 0 ? data?.sort((a, b) => b.totalSold - a.totalSold) : []
      );
    } catch (error) {
      toast.error(error);
    }
  };

  const getAll = async () => {
    setTableLoading(true);
    try {
      await fetchProducts();
      await getClients();
      await getBestSelling();
      await fetchAll();
    } catch (err) {
      console.log(err);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    getAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getDebtors();
  }, [getDebtors]);

  // Handle form open for edit/add
  const openDrawerForEdit = (debtor) => {
    console.log("Редактирование должника:", debtor);
    setEditing(debtor);
    setOpened(true);
  };

  // Обновляем форму при изменении editing
  useEffect(() => {
    if (editing && opened) {
      // Форматируем дату для input[type="date"]
      const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        try {
          // Если дата уже в формате YYYY-MM-DD, возвращаем как есть
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
          }
          // Иначе конвертируем через moment
          return moment(dateString).format("YYYY-MM-DD");
        } catch (error) {
          console.warn("Ошибка форматирования даты:", dateString, error);
          return "";
        }
      };

      const formData = {
        client: editing.client?._id || "",
        description: editing.description || "",
        currentDebt: Number(editing.currentDebt) || 0,
        nextPayment: {
          amount: Number(editing.nextPayment?.amount) || 0,
          dueDate: formatDateForInput(editing.nextPayment?.dueDate),
        },
      };

      console.log("Данные для формы:", formData);
      reset(formData);
    }
  }, [editing, opened, reset]);

  const openDrawerForAdd = () => {
    console.log("Добавление нового должника");
    setEditing(null);
    setOpened(true);
    // Небольшая задержка, чтобы useEffect успел отработать
    setTimeout(() => {
      const formData = {
        client: "",
        description: "",
        currentDebt: 0,
        nextPayment: {
          amount: 0,
          dueDate: "",
        },
      };
      console.log("Данные для новой формы:", formData);
      reset(formData);
    }, 100);
  };

  // Save (add/edit) handler
  const onSubmit = async (values) => {
    setLoading(true);
    const toastId = toast.loading("Saqlanmoqda...");
    try {
      const payload = {
        client: values.client,
        description: values.description,
        currentDebt: Number(values.currentDebt) || 0,
        nextPayment: {
          amount: Number(values.nextPayment.amount) || 0,
          dueDate: values.nextPayment.dueDate || null,
        },
      };

      if (editing) {
        await api.patch(`/debtors/${editing._id}`, payload);
        toast.update(toastId, {
          render: "Qarzdor yangilandi",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        await api.post("/debtors", payload);
        toast.update(toastId, {
          render: "Qarzdor qo'shildi",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
      getDebtors();
      setOpened(false);
      setEditing(null);
      reset();
    } catch (err) {
      toast.update(toastId, {
        render: err?.response?.data?.message || "Xatolik yuz berdi",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Payment handler
  const handlePayment = (debtor) => {
    setSelectedDebtor(debtor);
    setPaymentModalOpen(true);
  };

  // Delete handler
  const handleDelete = async (id) => {
    if (!window.confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    setLoading(true);
    try {
      await api.delete(`/debtors/${id}`);
      toast.success("Qarzdor o'chirildi");
      getDebtors();
    } catch (err) {
      console.error(err);
      toast.error("O'chirishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Функция для подсчета активных фильтров
  const getActiveFiltersCount = () => {
    const activeFilters = Object.values(debtorFilters).filter(
      (value) => value !== ""
    );
    return activeFilters.length;
  };

  // Excel export handler for debtors
  const exportDebtorsToExcel = () => {
    if (filteredDebtors.length === 0) {
      toast.warning("Export qilish uchun qarzdorlar ma'lumoti yo'q");
      return;
    }

    toast.info("Excel fayli tayyorlanmoqda...");

    try {
      const excelData = filteredDebtors.map((debtor, index) => ({
        "№": index + 1,
        "Mijoz ismi": debtor?.client?.fullName || "-",
        "Mijoz telefони": debtor?.client?.phone || "-",
        "Mijoz manzili": debtor?.client?.address || "-",
        Sabab: debtor?.description || "-",
        "Boshlang'ich qarz": debtor?.initialDebt || 0,
        "Joriy qarz": debtor?.currentDebt || 0,
        "Jami to'langan": debtor?.totalPaid || 0,
        "Oxirgi to'lov sanasi": debtor?.lastPayment?.date
          ? moment(debtor.lastPayment.date).format("DD.MM.YYYY")
          : "-",
        "Oxirgi to'lov": debtor?.lastPayment?.amount || 0,
        "Keyingi to'lov sanasi": debtor?.nextPayment?.dueDate
          ? moment(debtor.nextPayment.dueDate).format("DD.MM.YYYY")
          : "-",
        "Keyingi to'lov": debtor?.nextPayment?.amount || 0,
        "To'lov holati":
          debtor?.status === "pending"
            ? "Kutilmoqda"
            : debtor?.status === "partial"
            ? "Qisman to'langan"
            : debtor?.status === "paid"
            ? "To'langan"
            : debtor?.status === "overdue"
            ? "Muddati o'tgan"
            : debtor?.status,
        "Qarz yaratilgan sana": debtor?.initialDebtDate
          ? moment(debtor.initialDebtDate).format("DD.MM.YYYY")
          : "-",
        "Yaratilgan sana": moment(debtor.createdAt).format("DD.MM.YYYY HH:mm"),
        "Yangilangan sana": moment(debtor.updatedAt).format("DD.MM.YYYY HH:mm"),
        "Qarz muddati (kunlar)": debtor?.initialDebtDate
          ? moment().diff(moment(debtor.initialDebtDate), "days") + " kun"
          : "-",
        Izoh: debtor?.notes || "-",
      }));

      // Excel workbook yaratish
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();

      // Ustun kengliklarini sozlash
      const columnWidths = [
        { wch: 5 }, // №
        { wch: 20 }, // Mijoz ismi
        { wch: 15 }, // Mijoz telefoni
        { wch: 25 }, // Mijoz manzili
        { wch: 25 }, // Sabab
        { wch: 18 }, // Boshlang'ich qarz
        { wch: 15 }, // Joriy qarz
        { wch: 18 }, // Jami to'langan
        { wch: 18 }, // Oxirgi to'lov sanasi
        { wch: 15 }, // Oxirgi to'lov
        { wch: 18 }, // Keyingi to'lov sanasi
        { wch: 15 }, // Keyingi to'lov
        { wch: 18 }, // To'lov holati
        { wch: 18 }, // Qarz yaratilgan sana
        { wch: 18 }, // Yaratilgan sana
        { wch: 18 }, // Yangilangan sana
        { wch: 15 }, // Qarz muddati
        { wch: 30 }, // Izoh
      ];
      worksheet["!cols"] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Qarzdorlar");

      // Faylni yuklash
      const fileName = `qarzdorlar_hisoboti_${moment().format(
        "DD-MM-YYYY_HH-mm"
      )}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(
        `${filteredDebtors.length} ta qarzdor ma'lumotlari Excel faylga yuklandi!`
      );
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Excel faylni yaratishda xatolik yuz berdi");
    }
  };

  // Table columns
  const allDebtorColumns = [
    {
      key: "client.fullName",
      title: "Mijoz",
      render: (_, row) => {
        return row.client?.fullName || "-";
      },
    },
    {
      key: "client.phone",
      title: "Telefon",
      render: (_, row) => row.client?.phone || "-",
      style: { minWidth: 150 },
    },
    {
      key: "description",
      title: "Sabab",
      render: (_, row) => row.description || "-",
    },
    {
      key: "initialDebt",
      title: "Boshlang'ich qarz",
      render: (_, row) => {
        const debt = row.initialDebt || 0;
        return `${debt.toLocaleString()} so'm`;
      },
    },
    {
      key: "initialDebtDate",
      title: "Qarz yaratilgan sana",
      render: (_, row) =>
        row.initialDebtDate ? moment(row.initialDebtDate).format("LL") : "-",
    },
    {
      key: "currentDebt",
      title: "Joriy qarz",
      render: (_, row) => {
        const debt = row.currentDebt || 0;
        return `${debt.toLocaleString()} so'm`;
      },
    },
    {
      key: "totalPaid",
      title: "Jami to'langan",
      render: (_, row) => {
        const paid = row.totalPaid || 0;
        return `${paid.toLocaleString()} so'm`;
      },
    },
    {
      key: "lastPayment",
      title: "Oxirgi to'lov",
      render: (_, row) => {
        const lastPayment = row.lastPayment;
        if (!lastPayment || !lastPayment.date) return "-";

        const amount = lastPayment.amount || 0;
        const amountText = `${amount.toLocaleString()} so'm`;

        return (
          <div>
            <div>{amountText}</div>
            <small style={{ color: "#666" }}>
              {moment(lastPayment?.date).format("DD.MM.YYYY")}
            </small>
          </div>
        );
      },
    },
    {
      key: "nextPayment",
      title: "Keyingi to'lov",
      render: (_, row) => {
        const nextPayment = row.nextPayment;
        if (!nextPayment || !nextPayment?.dueDate) return "-";

        const amount = nextPayment.amount || 0;
        const amountText = `${amount.toLocaleString()} so'm`;

        const isOverdue = moment(nextPayment?.dueDate).isBefore(
          moment(),
          "day"
        );

        return (
          <div>
            <div>{amountText}</div>
            <small style={{ color: isOverdue ? "#ef4444" : "#666" }}>
              {moment(nextPayment?.dueDate).format("DD.MM.YYYY")}
              {isOverdue && " (Muddati o'tgan)"}
            </small>
          </div>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      render: (_, row) => {
        const statusLabels = {
          pending: "Kutilmoqda",
          partial: "Qisman to'langan",
          paid: "To'langan",
          overdue: "Muddati o'tgan",
        };
        const statusColors = {
          pending: "#eab308",
          partial: "#3b82f6",
          paid: "#22c55e",
          overdue: "#ef4444",
        };
        return (
          <span
            style={{
              backgroundColor: statusColors[row?.status] || "#888",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {statusLabels[row?.status] || row?.status}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      title: "Yaratilgan",
      render: (_, row) => moment(row?.createdAt).format("DD.MM.YYYY HH:mm"),
    },
    {
      key: "updatedAt",
      title: "Yangilangan",
      render: (_, row) => moment(row?.updatedAt).format("DD.MM.YYYY HH:mm"),
    },
    {
      key: "debtAge",
      title: "Qarz muddati",
      render: (_, row) =>
        row?.nextPayment ? (
          <DebtTimer
            targetDate={row?.nextPayment?.dueDate}
            showAsPassed={true}
          />
        ) : (
          "-"
        ),
    },
    {
      key: "actions",
      title: "Amallar",
      render: (_, row) => (
        <div className="actions-row">
          <button
            onClick={() => handlePayment(row)}
            disabled={loading}
            type="button"
            title="To'lov qilish"
            style={{
              backgroundColor: "#22c55e",
              border: "none",
              borderRadius: "4px",
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Dollar size={24} color="#fff" />
          </button>
          <button
            onClick={() => openDrawerForEdit(row)}
            disabled={loading}
            type="button"
            style={{
              backgroundColor: "#3b82f6",
              border: "none",
              borderRadius: "4px",
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Pen size={16} color="#fff" />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            disabled={loading}
            type="button"
            style={{
              backgroundColor: "#ef4444",
              border: "none",
              borderRadius: "4px",
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trash size={16} color="#fff" />
          </button>
        </div>
      ),
    },
  ];

  // Column visibility logic for debtors table
  const defaultVisibleDebtorColumns = [
    "client.fullName",
    "currentDebt",
    "totalPaid",
    "status",
    "lastPayment",
    "nextPayment",
    "createdAt",
    "debtAge",
    "actions",
  ];

  const DEBTOR_STORAGE_KEY = "debtors_visible_columns";

  const getInitialVisibleDebtorColumns = () => {
    const saved = localStorage.getItem(DEBTOR_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Error parsing visible columns from localStorage:", e);
      }
    }
    return defaultVisibleDebtorColumns;
  };

  const [visibleDebtorColumns, setVisibleDebtorColumns] = useState(
    getInitialVisibleDebtorColumns
  );

  useEffect(() => {
    localStorage.setItem(
      DEBTOR_STORAGE_KEY,
      JSON.stringify(visibleDebtorColumns)
    );
  }, [visibleDebtorColumns]);

  const columns = allDebtorColumns.filter(
    (col) => col?.key === "actions" || visibleDebtorColumns?.includes(col?.key)
  );

  const bestSellingColumns = [
    {
      key: "name",
      title: "Nomi",
      render: (_, row) => {
        return row.name;
      },
    },
    {
      key: "totalSold",
      title: "Jami sotilgan",
      render: (_, row) => `${row.totalSold} ${row.unit || "dona"}`,
    },
    {
      key: "costPrice",
      title: "Tannarx",
      render: (_, row) => `${Number(row.costPrice)?.toLocaleString()} so'm`,
    },
    {
      key: "salePrice",
      title: "Sotish narxi",
      render: (_, row) => `${Number(row.salePrice)?.toLocaleString()} so'm`,
    },
    // {
    //   key: "discount_one",
    //   title: "Chegirma (1 dona)",
    //   render: (_, row) => (
    //     <div
    //       onClick={() => {
    //         const discountInfo = row.discount;
    //         const message = [
    //           `Chegirma haqida ma'lumot: ${discountInfo?.price?.toLocaleString()} ${
    //             row.currency
    //           }`,
    //           "",
    //           "Chegirma 1 dona uchun amal qiladi.",
    //           "",
    //           "Ko'proq maxsulotlar uchun chegirmalar:",
    //           "",
    //           discountInfo?.children?.length
    //             ? discountInfo.children
    //                 .map(
    //                   (d) =>
    //                     `${d.quantity}+ dona: ${d.value.toLocaleString()} ${
    //                       row.currency
    //                     }`
    //                 )
    //                 .join("\n")
    //             : "Chegirma mavjud emas.",
    //         ].join("\n");
    //         alert(message);
    //         toast.info(message, { position: "top-right", autoClose: 5000 });
    //       }}
    //     >
    //       {row?.discount?.price
    //         ? `${Number(row.discount.price).toLocaleString()} ${row.currency}`
    //         : "-"}
    //     </div>
    //   ),
    // },
    {
      key: "quantity",
      title: "Miqdori",
      render: (_, row) => row.quantity?.toLocaleString(),
    },
  ];

  const Data = () => {
    if (openModal.form === "todayProfit") {
      return (
        <>
          <h1>Bugungi foyda</h1>
        </>
      );
    }
    if (openModal.form === "todayIncome") {
      return (
        <>
          <h1>Haftalik Daromadlar</h1>
          {charts.weeklyIncome && charts.weeklyIncome.length > 0 ? (
            <>
              <div style={{ marginTop: 20 }}>
                <h3>Haftalik daromad jadvali</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Sana</th>
                      <th>Summa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charts.weeklyIncome.map((item, index) => (
                      <tr key={index}>
                        <td>{moment(item.date).format("DD.MM.YYYY")}</td>
                        <td>{(item.amount || 0).toLocaleString()} so'm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p>Haftalik daromad ma'lumotlari topilmadi</p>
          )}
          <button className="btn primary" onClick={() => navigate("/orders")}>
            Hammasini ko`rish
          </button>
        </>
      );
    }

    if (openModal.form === "productCapital") {
      console.log("Product Capital Data:", stats.productCapital);
      return (
        <>
          <h1>Mahsulot kapitali</h1>
          {stats.productCapital && (
            <>
              <div style={{ marginTop: 20 }}>
                <h3>Umumiy kapital</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Summa</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: "bold" }}>
                        {(stats.productCapital || 0).toLocaleString()} so'm
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      );
    }

    return (
      <>
        <h1>Not Found</h1>
      </>
    );
  };

  // const navigate = useNavigate();

  const filteredDebtors = useMemo(() => {
    return debtors?.filter((i) => {
      let ok = true;

      // Фильтр по клиенту
      if (
        debtorFilters.client &&
        !i.client?.fullName
          ?.trim()
          ?.toLowerCase()
          .includes(debtorFilters.client?.trim().toLowerCase())
      ) {
        ok = false;
      }

      // Фильтр по статусу
      if (debtorFilters.status && i.status !== debtorFilters.status) {
        ok = false;
      }

      // Фильтр по валюте (больше не нужен, убираем проверку)
      // if (debtorFilters.currency) {
      //   // Логика фильтрации по валюте убрана
      // }

      // Фильтры по сумме долга (теперь простые числа)
      const totalInitialDebt = i.initialDebt || 0;
      const totalCurrentDebt = i.currentDebt || 0;
      const totalPaid = i.totalPaid || 0;

      if (
        debtorFilters.initialDebtMin &&
        totalInitialDebt < Number(debtorFilters.initialDebtMin)
      ) {
        ok = false;
      }
      if (
        debtorFilters.initialDebtMax &&
        totalInitialDebt > Number(debtorFilters.initialDebtMax)
      ) {
        ok = false;
      }
      if (
        debtorFilters.currentDebtMin &&
        totalCurrentDebt < Number(debtorFilters.currentDebtMin)
      ) {
        ok = false;
      }
      if (
        debtorFilters.currentDebtMax &&
        totalCurrentDebt > Number(debtorFilters.currentDebtMax)
      ) {
        ok = false;
      }
      if (
        debtorFilters.totalPaidMin &&
        totalPaid < Number(debtorFilters.totalPaidMin)
      ) {
        ok = false;
      }
      if (
        debtorFilters.totalPaidMax &&
        totalPaid > Number(debtorFilters.totalPaidMax)
      ) {
        ok = false;
      }

      // Фильтр по дате создания
      if (
        debtorFilters.startDate &&
        moment(i.createdAt).isBefore(debtorFilters.startDate, "day")
      ) {
        ok = false;
      }
      if (
        debtorFilters.endDate &&
        moment(i.createdAt).isAfter(debtorFilters.endDate, "day")
      ) {
        ok = false;
      }

      // Фильтр по следующему платежу
      if (debtorFilters.nextPaymentDue) {
        if (debtorFilters.nextPaymentDue === "overdue") {
          if (
            !i.nextPayment?.dueDate ||
            !moment(i.nextPayment.dueDate).isBefore(moment(), "day")
          ) {
            ok = false;
          }
        } else if (debtorFilters.nextPaymentDue === "upcoming") {
          if (
            !i.nextPayment?.dueDate ||
            moment(i.nextPayment.dueDate).isBefore(moment(), "day")
          ) {
            ok = false;
          }
        } else if (debtorFilters.nextPaymentDue === "none") {
          if (i.nextPayment?.dueDate) {
            ok = false;
          }
        }
      }

      // Фильтр по наличию последнего платежа
      if (debtorFilters.hasLastPayment !== "") {
        const hasPayment = Boolean(i.lastPayment?.date);
        if (debtorFilters.hasLastPayment === "true" && !hasPayment) {
          ok = false;
        }
        if (debtorFilters.hasLastPayment === "false" && hasPayment) {
          ok = false;
        }
      }

      return ok;
    });
  }, [debtors, debtorFilters]);

  const filteredProduct = () => {
    return stats.lowStockProducts || [];
  };
  const bestSellingFiltered = bestSelling.filter((i) => {
    let ok = true;
    if (
      bestSellingFilter.name &&
      !i.name?.toLowerCase().includes(bestSellingFilter.name.toLowerCase())
    )
      ok = false;

    return ok;
  });
  return (
    <div className="page row-warehouse">
      <div className="page-details">
        <div
          className="page-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ display: "flex", gap: 5 }}>
            <DashboardIcon />
            Statistika
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 15,
            }}
            className="calendar-controls"
          >
            <Input
              type="date"
              label=""
              value={today.format("YYYY-MM-DD")}
              onChange={(e) => {
                setToday(moment(e.target.value).startOf("day"));
                fetchAll();
              }}
            />
            <Input
              type="date"
              label=""
              value={endOfMonth.format("YYYY-MM-DD")}
              onChange={(e) => {
                setEndOfMonth(moment(e.target.value).endOf("month"));
                fetchAll();
              }}
            />
            <button onClick={openDrawerForAdd} disabled={loading} type="button">
              <X size={24} color="#3F8CFF" as="+" />
              <span>Qo‘shish</span>
            </button>
          </div>
        </div>
        <div className="stats">
          {statsIcons.map((item, idx) => {
            // Используем accessor функцию, если она есть, иначе берем значение напрямую
            const value = item.accessor
              ? item.accessor(stats)
              : stats[item.key];

            // Проверяем если у элемента есть собственная render функция
            const hasCustomRender =
              item.render && typeof item.render === "function";

            return (
              <div
                key={idx}
                className="stats-card"
                onClick={() => item.onClick && item.onClick()}
                style={{
                  display: item.hide ? "none" : "flex",
                  cursor: item.onClick ? "pointer" : "default",
                }}
              >
                <div className="icon-box" style={{ background: item.bg }}>
                  {item.icon}
                </div>
                <div className="info">
                  <span>{item.title}</span>
                  <p
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {hasCustomRender ? (
                      item.render(value)
                    ) : (
                      <>
                        <NumberAnimation duration={700} value={value || 0} />{" "}
                        {item.prefix}
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {/* <div className="charts">
          {charts.weeklyIncome && charts.weeklyIncome.length > 0 && (
            <KirimChart
              data={charts.weeklyIncome.map((item) => item.uzs || 0)}
              total={charts.weeklyIncome.reduce(
                (sum, item) => sum + (item.uzs || 0),
                0
              )}
              currency="uzs"
            />
          )}
          {charts.weeklyIncome && charts.weeklyIncome.length > 0 && (
            <KirimChart
              data={charts.weeklyIncome.map((item) => item.usd || 0)}
              total={charts.weeklyIncome.reduce(
                (sum, item) => sum + (item.usd || 0),
                0
              )}
              currency="usd"
            />
          )}
        </div> */}
        <div style={{ margin: 10 }}>
          <button
            onClick={() => setTabs("debt")}
            style={{
              padding: "8px 16px",
              marginRight: "8px",
              border: "none",
              background: "none",
              borderBottom: tabs === "debt" ? "2px solid #3F8CFF" : "none",
              color: tabs === "debt" ? "#3F8CFF" : "#666",
              fontWeight: tabs === "debt" ? "bold" : "normal",
              cursor: "pointer",
            }}
          >
            Qarzdorlar ro‘yhati
          </button>
          <button
            onClick={() => setTabs("product")}
            style={{
              padding: "8px 16px",
              marginRight: "8px",
              border: "none",
              background: "none",
              borderBottom: tabs === "product" ? "2px solid #3F8CFF" : "none",
              color: tabs === "product" ? "#3F8CFF" : "#666",
              fontWeight: tabs === "product" ? "bold" : "normal",
              cursor: "pointer",
            }}
          >
            Kam Qolgan maxsulotlar
          </button>
          <button
            onClick={() => setTabs("bestSelling")}
            style={{
              padding: "8px 16px",
              marginRight: "8px",
              border: "none",
              background: "none",
              borderBottom:
                tabs === "bestSelling" ? "2px solid #3F8CFF" : "none",
              color: tabs === "bestSelling" ? "#3F8CFF" : "#666",
              fontWeight: tabs === "bestSelling" ? "bold" : "normal",
              cursor: "pointer",
            }}
          >
            Kop sotilyapgan tovarlar
          </button>
          {/* <button
            onClick={() => setTabs("smsmodul")}
            style={{
              padding: "8px 16px",
              marginRight: "8px",
              border: "none",
              background: "none",
              borderBottom: tabs === "smsmodul" ? "2px solid #3F8CFF" : "none",
              color: tabs === "smsmodul" ? "#3F8CFF" : "#666",
              fontWeight: tabs === "smsmodul" ? "bold" : "normal",
              cursor: "pointer",
            }}
          >
            Sms modul
          </button> */}
        </div>
        {tabs === "debt" ? (
          <>
            {showFilters && (
              <div className="filters-container">
                <div className="row-form">
                  <Input
                    label="Mijoz bo'yicha qidirish"
                    placeholder="Mijoz ismi"
                    value={debtorFilters.client}
                    onChange={(e) =>
                      setDebtorFilters({
                        ...debtorFilters,
                        client: e.target.value,
                      })
                    }
                    style={{ width: "100%" }}
                  />
                  <SearchSelect
                    label="Status"
                    placeholder="Status tanlang"
                    value={debtorFilters.status}
                    onChange={(value) =>
                      setDebtorFilters({
                        ...debtorFilters,
                        status: value,
                      })
                    }
                    options={[
                      { value: "", label: "Barchasi" },
                      { value: "pending", label: "Kutilmoqda" },
                      { value: "partial", label: "Qisman to'langan" },
                      { value: "paid", label: "To'langan" },
                      { value: "overdue", label: "Muddati o'tgan" },
                    ]}
                  />
                  <Input
                    label="Boshlang'ich qarz miqdori (min)"
                    placeholder="Min"
                    type="number"
                    step="0.01"
                    value={debtorFilters.initialDebtMin}
                    onChange={(e) =>
                      setDebtorFilters({
                        ...debtorFilters,
                        initialDebtMin: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Boshlang'ich qarz miqdori (maks)"
                    placeholder="Max"
                    type="number"
                    step="0.01"
                    value={debtorFilters.initialDebtMax}
                    onChange={(e) =>
                      setDebtorFilters({
                        ...debtorFilters,
                        initialDebtMax: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="row-form">
                  <Input
                    label="Hozirgi qarz miqdori (min)"
                    placeholder="Min"
                    type="number"
                    step="0.01"
                    value={debtorFilters.currentDebtMin}
                    onChange={(e) =>
                      setDebtorFilters({
                        ...debtorFilters,
                        currentDebtMin: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Joriy qarz miqdori (maks)"
                    placeholder="Max"
                    type="number"
                    step="0.01"
                    value={debtorFilters.currentDebtMax}
                    onChange={(e) =>
                      setDebtorFilters({
                        ...debtorFilters,
                        currentDebtMax: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Jami to'langan (min)"
                    placeholder="Min"
                    type="number"
                    step="0.01"
                    value={debtorFilters.totalPaidMin}
                    onChange={(e) =>
                      setDebtorFilters({
                        ...debtorFilters,
                        totalPaidMin: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Jami to'langan (maks)"
                    placeholder="Max"
                    type="number"
                    step="0.01"
                    value={debtorFilters.totalPaidMax}
                    onChange={(e) =>
                      setDebtorFilters({
                        ...debtorFilters,
                        totalPaidMax: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDebtorFilters({
                        client: "",
                        status: "",
                        initialDebtMin: "",
                        initialDebtMax: "",
                        currentDebtMin: "",
                        currentDebtMax: "",
                        totalPaidMin: "",
                        totalPaidMax: "",
                        startDate: "",
                        endDate: "",
                        nextPaymentDue: "",
                        hasLastPayment: "",
                      })
                    }
                    className="btn secondary"
                  >
                    Tozalash
                  </button>
                </div>
              </div>
            )}
            <div className="debtors-controls">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  margin: "0 15px",
                }}
              >
                <span>Ko'rsatish:</span>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    backgroundColor: "#f3f4f6",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {debtors.length} tadan ta {filteredDebtors.length}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <button
                  onClick={exportDebtorsToExcel}
                  className="excel-export-btn"
                  disabled={filteredDebtors.length === 0}
                >
                  <Upload size={16} color="#fff" />
                  Excel yuklash
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="filter-toggle-btn"
                  style={{ position: "relative" }}
                >
                  {showFilters ? "Filtrlarni yashirish" : "Ko'proq filtrlar"}
                  {getActiveFiltersCount() > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        borderRadius: "50%",
                        minWidth: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="filters-container">
              {allDebtorColumns
                .filter((col) => col.key !== "actions")
                .map((col) => (
                  <Switch
                    key={col.key}
                    checked={visibleDebtorColumns.includes(col.key)}
                    onChange={(checked) => {
                      setVisibleDebtorColumns((prev) => {
                        if (checked) {
                          return [...prev, col.key];
                        } else {
                          return prev.filter((k) => k !== col.key);
                        }
                      });
                    }}
                    label={col.title}
                  />
                ))}
            </div>
            <Table
              columns={columns}
              data={filteredDebtors}
              sortable={true}
              pagination={true}
              pageSize={10}
              tableLoading={tableLoading}
            />
            {tableLoading && (
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <Loader size={32} />
              </div>
            )}
          </>
        ) : null}
        {tabs === "product" ? (
          <>
            {/* Kam Qolgan maxsulotlar */}
            <div style={{ marginTop: 40 }}>
              {tableLoading ? (
                <div style={{ textAlign: "center", margin: "24px 0" }}>
                  <Loader size={32} />
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nomi</th>
                      <th>Qolgan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(stats.lowStockProducts) &&
                    stats.lowStockProducts.length > 0 ? (
                      filteredProduct().map((p) => {
                        const prod = products?.find(
                          (prod) => prod?._id === p?._id
                        );
                        return (
                          <tr key={p?._id}>
                            <td>{p?.name || prod?.name || "-"}</td>
                            <td>{`${p?.quantity || 0} ${
                              prod?.unit || "dona"
                            }`}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          style={{ textAlign: "center", color: "#888" }}
                        >
                          Barcha mahsulotlar yetarli
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : null}
        {tabs === "bestSelling" ? (
          <>
            <div
              style={{
                display: "flex",
                gap: "15px",
                paddingLeft: 27,
                paddingRight: 27,
                marginBottom: 15,
              }}
            >
              <Input
                label="Nomi"
                value={bestSellingFilter.name}
                onChange={(v) =>
                  setBestSellingFilter((f) => ({ ...f, name: v.target.value }))
                }
              />
            </div>
            <Table
              columns={bestSellingColumns}
              data={bestSellingFiltered}
              tableLoading={tableLoading}
            />
            {tableLoading && (
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <Loader size={32} />
              </div>
            )}
          </>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`driwer-form${opened ? " opened" : ""}`}
      >
        <div className="form-body">
          <div className="page-header">
            <Upload />
            <span>{editing ? "Tahrirlash" : "Yangi qarzdor"}</span>
            <button
              type="button"
              onClick={() => {
                reset();
                setEditing(null);
                setOpened(false);
              }}
              disabled={loading}
            >
              <X size={24} color="#3F8CFF" />
              <span>Yopish</span>
            </button>
          </div>
          <div className="row-form">
            <div style={{ flex: 1 }}>
              <Controller
                control={control}
                name="client"
                rules={{ required: "Mijoz majburiy" }}
                render={({ field }) => (
                  <SearchSelect
                    label="Mijoz"
                    options={clients.map((client) => ({
                      label: client.fullName,
                      value: client._id,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.client?.message}
                    required
                    disabled={loading}
                  />
                )}
              />
            </div>
            <button
              type="button"
              className="btn primary"
              onClick={() => setClientModalOpen(true)}
              disabled={loading}
              style={{
                height: "56px",
                alignSelf: "flex-end",
                marginLeft: "10px",
                minWidth: "140px",
              }}
            >
              <X as="+" size={16} />
              <span>Yangi mijoz</span>
            </button>
          </div>
          <div className="row-form">
            <Input
              label="Qarz miqdori (so'm)"
              type="number"
              placeholder="0"
              step="0.01"
              {...register("currentDebt", {
                min: { value: 0, message: "Minimal qiymat 0 bo'lishi kerak" },
              })}
              error={errors.currentDebt?.message}
              disabled={loading}
            />
          </div>
          <div className="row-form">
            <Input
              label="Keyingi to'lov miqdori (so'm)"
              type="number"
              placeholder="0"
              step="0.01"
              {...register("nextPayment.amount", {
                min: { value: 0, message: "Minimal qiymat 0 bo'lishi kerak" },
              })}
              error={errors.nextPayment?.amount?.message}
              disabled={loading}
            />
          </div>
          <div className="row-form">
            <Input
              label="Keyingi to'lov muddati"
              type="date"
              {...register("nextPayment.dueDate")}
              error={errors.nextPayment?.dueDate?.message}
              disabled={loading}
            />
          </div>
          <div className="row-form">
            <Input
              label="Sabab"
              placeholder="Sabab"
              {...register("description")}
              error={errors.description?.message}
              disabled={loading}
              as="textarea"
            />
          </div>
          <div className="row-form">
            <button
              type="reset"
              className="btn secondary"
              onClick={() => reset()}
              disabled={loading}
            >
              Tozalash
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? <Loader size={24} /> : <span>Saqlash</span>}
            </button>
          </div>
        </div>
      </form>
      {openModal.is_open ? (
        <Modal
          modalStyle={{ width: "90%", height: "90%" }}
          onClose={() => setOpenModal({ is_open: false, form: "" })}
          opened={openModal.is_open}
        >
          <Data />
        </Modal>
      ) : null}

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedDebtor(null);
        }}
        debtor={selectedDebtor}
        onSuccess={() => getDebtors()}
      />

      {/* Модальное окно для создания нового клиента */}
      {clientModalOpen && (
        <Modal
          modalStyle={{
            width: "100%",
            maxWidth: "800px",
            height: "100%",
            maxHeight: "900px",
            minWidth: "none",
            padding: 0,
            borderRadius: window.innerWidth < 600 ? "0" : "8px",
          }}
          onClose={() => setClientModalOpen(false)}
          opened={clientModalOpen}
        >
          <ClientForm
            onSuccess={handleClientCreated}
            onCancel={() => setClientModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
