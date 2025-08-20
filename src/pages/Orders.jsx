import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import Input from "../components/Input";
import Table from "../components/Table";
import {
  X,
  Upload,
  Trash,
  Truck,
  Pen,
  Loader,
  PrintIcon,
} from "../assets/icons";
import { toast } from "react-toastify";
import api from "../services/api";
import "../styles/warehouse.css";
import moment from "moment/min/moment-with-locales";
import Switch from "../components/Switch";
import * as XLSX from "xlsx";
import Modal from "../components/Modal";
import SearchSelect from "../components/SearchSelect";

const paymentTypeOptions = [
  { label: "Naqd", value: "cash" },
  { label: "Karta", value: "card" },
  { label: "Nasiya", value: "debt" },
];

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(1);
  const [openPrint, setOpenPrint] = useState({ is_open: false, order: {} });
  const [showBestSelling, setShowBestSelling] = useState(false);

  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [orderStats, setOrderStats] = useState(null);

  const printRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      client: null,
      branch: "",
      products: [{ product: "", quantity: 1, price: 0 }],
      paymentType: "cash",
      paidAmount: 0,
      notes: "",
      status: "completed",
      date_returned: null,
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "products",
    rules: {
      required: "Kamida bitta mahsulot qo'shish kerak",
      minLength: {
        value: 1,
        message: "Kamida bitta mahsulot qo'shish kerak",
      },
    },
  });

  const handleProductChange = (productId, index) => {
    const existingProductIndex = fields.findIndex(
      (field, i) => i !== index && field.product === productId
    );
    if (existingProductIndex !== -1) {
      toast.error("Bu mahsulot allaqachon qo'shilgan");
      return;
    }
    setValue(`products.${index}.product`, productId, { shouldValidate: true });
    const product = productsList.find((p) => p._id === productId);
    if (product) {
      // Narxni to'g'ri o'rnatish (object yoki raqam bo'lishi mumkin)
      if (typeof product.salePrice === "object") {
        setValue(`products.${index}.price`, product.salePrice, {
          shouldValidate: true,
        });
      } else {
        setValue(`products.${index}.price`, product.salePrice || 0, {
          shouldValidate: true,
        });
      }
    }
  };

  const handleAddProduct = () => {
    append({ product: "", quantity: 1, price: 0 });
  };

  const fetchOrders = useCallback(
    async (currentPage = page, currentPageSize = pageSize) => {
      setTableLoading(true);
      try {
        const { data } = await api.get(
          `/orders?page=${currentPage}&limit=${currentPageSize}`
        );
        setOrders(data?.orders || []);
        setTotalPages(data?.totalPages || 1);
        setPage(currentPage);
        setTotalCount(data?.total || 1);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Xatolik yuz berdi");
      } finally {
        setTableLoading(false);
      }
    },
    [page, pageSize]
  );

  const fetchClients = async () => {
    try {
      const { data } = await api.get("/clients");
      setClients(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Mijozlar yuklanmadi");
    }
  };

  const fetchBranches = async () => {
    try {
      const { data } = await api.get("/branches");
      setBranches(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Filiallar yuklanmadi");
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/products?limit=1000");
      setProductsList(data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Mahsulotlar yuklanmadi");
    }
  };

  const fetchBestSellingProducts = async () => {
    try {
      const { data } = await api.get("/orders/bestselling");
      setBestSellingProducts(data);
    } catch (err) {
      console.error("Eng ko'p sotilgan mahsulotlarni yuklab bo'lmadi:", err);
    }
  };

  const fetchOrderStats = async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.branch) queryParams.append("branch", filters.branch);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);

      const { data } = await api.get(
        `/orders/stats/summary?${queryParams.toString()}`
      );
      setOrderStats(data);
    } catch (err) {
      console.error("Statistikani yuklab bo'lmadi:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchClients();
    fetchBranches();
    fetchProducts();
    fetchBestSellingProducts();
    fetchOrderStats();
  }, [fetchOrders]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchOrders(newPage, pageSize);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    fetchOrders(1, newPageSize); // Reset to first page when changing page size
  };

  const onSubmit = async (values) => {
    setLoading(true);
    const toastId = toast.loading("Yuklanmoqda...");
    try {
      // Проверка на наличие продуктов
      if (
        !values.products ||
        values.products.length === 0 ||
        !values.products.some((p) => p.product)
      ) {
        toast.update(toastId, {
          render: "Kamida bitta mahsulot qo'shish kerak!",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        return;
      }

      // Mahsulotlar bo'yicha totalAmount hisobi
      const totalAmount = productsWatch.reduce(
        (sum, item) => {
          return sum + Number(item.quantity) * Number(item.price || 0);
        },
        0
      );

      const paidAmount = Number(values.paidAmount) || 0;

      // debtAmount = totalAmount - paidAmount
      const debtAmount = Math.max(totalAmount - paidAmount, 0);

      const submitData = {
        ...values,
        totalAmount,
        paidAmount,
        debtAmount,
        date_returned:
          values.paymentType === "debt" && debtAmount > 0
            ? values.date_returned
            : null,
      };

      if (editing) {
        await api.patch(`/orders/${editing._id}`, submitData);
        toast.update(toastId, {
          render: "Buyurtma ma'lumotlari yangilandi!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        await api.post("/orders", submitData);
        toast.update(toastId, {
          render: "Buyurtma muvaffaqiyatli qo'shildi!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
      reset();
      setEditing(null);
      setOpened(false);
      fetchOrders();
      fetchProducts();
      fetchOrderStats();
      fetchBestSellingProducts();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Xatolik, qayta urining!";
      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // const handleDelete = async (id) => {
  //   if (window.confirm("Rostdan ham o'chirmoqchimisiz?")) {
  //     setLoading(true);
  //     try {
  //       await api.delete(`/orders/${id}`);
  //       toast.success("Buyurtma o'chirildi");
  //       fetchOrders();
  //       fetchProducts();
  //     } catch (err) {
  //       toast.error(err?.response?.data?.message || "Xatolik yuz berdi");
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  // };

  const handleStatusChange = async (orderId, newStatus) => {
    if (
      window.confirm(
        `Buyurtma holatini '${newStatus}' ga o'zgartirmoqchimisiz?`
      )
    ) {
      try {
        setLoading(true);
        const statusLabels = {
          pending: "Kutilmoqda",
          completed: "Bajarildi",
          cancelled: "Bekor qilindi",
        };

        await api.patch(`/orders/${orderId}/status`, { status: newStatus });
        toast.success(
          `Buyurtma holati '${statusLabels[newStatus]}' ga o'zgartirildi`
        );
        fetchOrders();
        fetchProducts();
        fetchOrderStats();
      } catch (err) {
        toast.error(err?.response?.data?.message || "Xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    }
  };

  const exportToExcel = () => {
    if (filteredOrders.length === 0) {
      toast.warning("Export qilish uchun ma'lumot yo'q");
      return;
    }

    const excelData = filteredOrders.map((order) => ({
      Holat:
        order.status === "pending"
          ? "Kutilmoqda"
          : order.status === "completed"
          ? "Bajarildi"
          : order.status === "cancelled"
          ? "Bekor qilindi"
          : order?.status,
      Mijoz: order?.client?.fullName || "-",
      Filial: order?.branch?.name || "-",
      "Jami summa": order?.totalAmount || 0,
      "Foyda": order.profitAmount || 0,
      "To'langan": order.paidAmount || 0,
      "Qarz": order.debtAmount || 0,

      "Yaratilgan sana": moment(order.createdAt).format("YYYY-MM-DD HH:mm"),
      Mahsulotlar: order.products
        .filter((p) => p?.product?.name)
        .map((p) => `${p.product.name} (${p.quantity} x ${p.price})`)
        .join(", "),
      Izoh: order.notes || "-",
    }));

    // Excel workbook yaratish
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    // Ustun kengliklarini sozlash
    const columnWidths = [
      { wch: 15 }, // Holat
      { wch: 20 }, // Mijoz
      { wch: 15 }, // Filial
      { wch: 20 }, // Buyurtma turi
      { wch: 15 }, // Jami summa (UZS)
      { wch: 15 }, // Jami summa (USD)
      { wch: 15 }, // Foyda (UZS)
      { wch: 15 }, // Foyda (USD)
      { wch: 15 }, // To'langan (UZS)
      { wch: 15 }, // To'langan (USD)
      { wch: 15 }, // Qarz (UZS)
      { wch: 15 }, // Qarz (USD)
      { wch: 18 }, // Yaratilgan sana
      { wch: 40 }, // Mahsulotlar
      { wch: 20 }, // Izoh
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Buyurtmalar");

    // Faylni yuklash
    const fileName = `buyurtmalar_${moment().format("YYYY-MM-DD")}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success("Excel fayl muvaffaqiyatli yuklandi!");
  };

  const editOrder = (order) => {
    setEditing(order);
    setOpened(true);
    // Reset defaults
    reset({
      client: null,
      branch: "",
      products: [{ product: "", quantity: 1, price: 0 }],
      paymentType: "cash",
      paidAmount: { uzs: 0, usd: 0 },
      notes: "",
      status: "completed",
      date_returned: null,
    });
    // Set values from order
    Object.entries(order).forEach(([key, value]) => {
      if (["car", "client", "branch"].includes(key)) {
        setValue(key, value?._id);
      } else if (key === "date_returned" && value) {
        // Ensure correct format for datetime-local input
        // moment gives local time, toISOString gives UTC, so format for input
        setValue(key, moment(value).format("YYYY-MM-DDTHH:mm"));
      } else if (key !== "products") {
        setValue(key, value);
      }
    });
    if (Array.isArray(order.products)) {
      remove();
      order.products.forEach((product, idx) => {
        if (idx === 0) {
          setValue(`products.0.product`, product?.product?._id || "");
          setValue(`products.0.quantity`, product?.quantity || 1);
          setValue(`products.0.price`, product?.price || 0);
        } else {
          append({
            product: product?.product?._id || "",
            quantity: product?.quantity || 1,
            price: product?.price || 0,
          });
        }
      });
    }
  };

  // --- Динамическая видимость столбцов ---
  const allColumns = [
    {
      key: "status",
      title: "Holat",
      render: (val) => {
        const statusLabels = {
          pending: "Kutilmoqda",
          completed: "Bajarildi",
          cancelled: "Bekor qilindi",
        };
        const colorMap = {
          completed: "#22c55e", // green
          cancelled: "#ef4444", // red
          pending: "#eab308", // yellow
        };
        return (
          <span
            style={{
              color: "#fff",
              background: colorMap[val] || "#888",
              borderRadius: 6,
              padding: "2px 10px",
              fontWeight: 600,
              fontSize: 15,
              display: "inline-block",
              minWidth: 90,
              textAlign: "center",
            }}
          >
            {statusLabels[val] || "-"}
          </span>
        );
      },
    },
    {
      key: "client",
      title: "Mijoz",
      render: (_, row) => row?.client?.fullName || "-",
    },
    {
      key: "car",
      title: "Mashina",
      render: (car) => {
        return car?.model ? `${car?.model?.name} [${car?.plateNumber}]` : "-";
      },
    },
    {
      key: "branch",
      title: "Filial",
      render: (_, row) => row.branch?.name || "-",
    },
    {
      key: "totalAmount",
      title: "Jami summa",
      render: (val) => {
        if (val && typeof val === "object" && val !== null) {
          return (
            <>
              {Number(val.uzs)?.toLocaleString()} so'm
              <br />
              {Number(val.usd)?.toLocaleString()} $
            </>
          );
        }
        return `${Number(val)?.toLocaleString()} so'm`;
      },
    },
    {
      key: "profitAmount",
      title: "Foyda",
      render: (val) => {
        if (val && typeof val === "object" && val !== null) {
          return (
            <>
              {Number(val.uzs)?.toLocaleString()} so'm
              <br />
              {Number(val.usd)?.toLocaleString()} $
            </>
          );
        }
        return val ? `${Number(val)?.toLocaleString()} so'm` : "-";
      },
    },
    {
      key: "paidAmount",
      title: "To'langan summa",
      render: (val) => {
        if (val && typeof val === "object" && val !== null) {
          return (
            <>
              {Number(val.uzs)?.toLocaleString()} so'm
              <br />
              {Number(val.usd)?.toLocaleString()} $
            </>
          );
        }
        return `${Number(val)?.toLocaleString()} so'm`;
      },
    },
    {
      key: "debtAmount",
      title: "Qarz miqdori",
      render: (val) => {
        if (val && typeof val === "object" && val !== null) {
          return (
            <>
              {Number(val.uzs)?.toLocaleString()} so'm
              <br />
              {Number(val.usd)?.toLocaleString()} $
            </>
          );
        }
        return `${Number(val)?.toLocaleString()} so'm`;
      },
    },
    {
      key: "products",
      title: "Mahsulotlar",
      render: (val) => {
        if (!Array.isArray(val) || val.length === 0) return "-";
        return val
          .filter((p) => p?.product && p.product?.name)
          .map(
            (p) =>
              `${p?.product?.name} (${p?.quantity} x ${Number(
                p?.price
              ).toLocaleString()})`
          )
          .join(", ");
      },
    },
    {
      key: "date_returned",
      title: "Qarz qaytarilish sanasi",
      render: (val) => (val ? moment(val).format("LL") : "-"),
    },
    {
      key: "createdAt",
      title: "Yaratilgan sana",
      render: (val, row) => (
        <div>
          {moment(val).format("LLLL")} <br /> ({moment(val).fromNow()})
          <br />
          <span>{row?.index || "-"} - buyurtma</span>
        </div>
      ),
    },
    {
      key: "updatedAt",
      title: "Yangilangan sana",
      render: (val) => moment(val).format("LLLL"),
    },
    {
      key: "notes",
      title: "Izoh",
    },
    {
      key: "actions",
      title: "Amallar",
      render: (_, row) => (
        <div
          className="actions-row"
          style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}
        >
          <button
            onClick={() => editOrder(row)}
            disabled={loading}
            style={{
              background: "#3f8cff",
              border: "none",
              borderRadius: "4px",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            <Pen color="#fff" size={16} />
          </button>

          {row.status !== "completed" && (
            <button
              onClick={() => handleStatusChange(row._id, "completed")}
              disabled={loading}
              style={{
                background: "#22c55e",
                border: "none",
                borderRadius: "4px",
                padding: "4px 8px",
                cursor: "pointer",
                color: "#fff",
              }}
              title="Bajarilgan deb belgilash"
            >
              ✓
            </button>
          )}

          {row.status !== "cancelled" && (
            <button
              onClick={() => handleStatusChange(row._id, "cancelled")}
              disabled={loading}
              style={{
                background: "#ef4444",
                border: "none",
                borderRadius: "4px",
                padding: "4px 8px",
                cursor: "pointer",
                color: "#fff",
              }}
              title="Bekor qilish"
            >
              ✕
            </button>
          )}

          {row.status !== "pending" && (
            <button
              onClick={() => handleStatusChange(row._id, "pending")}
              disabled={loading}
              style={{
                background: "#eab308",
                border: "none",
                borderRadius: "4px",
                padding: "4px 8px",
                cursor: "pointer",
              }}
              title="Kutilmoqda deb belgilash"
            >
              ⏳
            </button>
          )}

          <button
            onClick={() => setOpenPrint({ is_open: true, order: row })}
            disabled={loading}
            style={{
              background: "#6366f1",
              border: "none",
              borderRadius: "4px",
              padding: "4px 8px",
              cursor: "pointer",
              color: "#fff",
            }}
            title="Chek chiqarish"
          >
            <PrintIcon width={20} height={20} fill="#fff" />
          </button>
        </div>
      ),
    },
  ];

  const defaultVisible = [
    "status",
    "client",
    "car",
    "branch",
    "totalAmount",
    "profitAmount",
    "paidAmount",
    "debtAmount",
    "date_returned",
    "createdAt",
    "notes",
    "actions",
  ];
  const STORAGE_KEY = "orders_visible_columns";
  const getInitialVisibleColumns = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Error parsing visible columns from localStorage:", e);
      }
    }
    return defaultVisible;
  };
  const [visibleColumns, setVisibleColumns] = useState(
    getInitialVisibleColumns
  );
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);
  const columns = allColumns.filter(
    (col) => col.key === "actions" || visibleColumns.includes(col.key)
  );

  const productsWatch = watch("products");
  const paidAmountWatch = watch("paidAmount") || { uzs: 0, usd: 0 };

  // Новый расчёт totalAmount: каждая валюта только по своим товарам
  const totalAmount = productsWatch.reduce(
    (sum, item) => {
      const product = productsList.find((p) => p._id === item.product);
      const productCurrency = product?.currency || "uzs";

      if (typeof item.price === "object" && item.price !== null) {
        return {
          uzs:
            (sum.uzs || 0) +
            (item.price.uzs !== undefined
              ? Number(item.quantity) * Number(item.price.uzs || 0)
              : 0),
          usd:
            (sum.usd || 0) +
            (item.price.usd !== undefined
              ? Number(item.quantity) * Number(item.price.usd || 0)
              : 0),
        };
      } else {
        const itemTotal = Number(item.quantity) * Number(item.price || 0);
        if (productCurrency === "usd" || productCurrency === "USD") {
          return {
            uzs: sum.uzs || 0,
            usd: (sum.usd || 0) + itemTotal,
          };
        } else {
          return {
            uzs: (sum.uzs || 0) + itemTotal,
            usd: sum.usd || 0,
          };
        }
      }
    },
    { uzs: 0, usd: 0 }
  );

  // debtAmount всегда считается как разница totalAmount - paidAmount по каждой валюте
  const debtAmount = {
    uzs: Math.max(
      (totalAmount.uzs || 0) - (Number(paidAmountWatch?.uzs) || 0),
      0
    ),
    usd: Math.max(
      (totalAmount.usd || 0) - (Number(paidAmountWatch?.usd) || 0),
      0
    ),
  };

  // Очищать дату возврата, если долга нет
  useEffect(() => {
    if (debtAmount.uzs === 0 && debtAmount.usd === 0) {
      setValue("date_returned", null);
    }
  }, [debtAmount.uzs, debtAmount.usd, setValue]);

  // Автоматически устанавливать paid amount равным total amount по умолчанию
  useEffect(() => {
    const currentPaidUzs = Number(watch("paidAmount.uzs")) || 0;
    const currentPaidUsd = Number(watch("paidAmount.usd")) || 0;

    // Автоматически обновляем paidAmount при изменении totalAmount
    // Только если значения отличаются, чтобы избежать бесконечного цикла
    if ((totalAmount.uzs || 0) !== currentPaidUzs) {
      setValue("paidAmount.uzs", totalAmount.uzs || 0, {
        shouldValidate: true,
      });
    }

    if ((totalAmount.usd || 0) !== currentPaidUsd) {
      setValue("paidAmount.usd", totalAmount.usd || 0, {
        shouldValidate: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount]);

  const minDateReturned = useMemo(() => {
    const currentUTC = new Date(watch("createdAt") || Date.now());
    const minDate = new Date(currentUTC);
    minDate.setDate(currentUTC.getDate() + 7);
    return minDate.toISOString().split("T")[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch("createdAt")]);

  // --- Фильтры как в Warehouse ---
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Обновление статистики при изменении фильтров
  useEffect(() => {
    fetchOrderStats({
      branch: branchFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    });
  }, [branchFilter, startDateFilter, endDateFilter]);

  // const [car, setCar] = useState("");
  const filteredOrders = orders.filter((order) => {
    let ok = true;

    if (statusFilter && order?.status !== statusFilter) ok = false;
    if (clientFilter && order?.client?._id !== clientFilter) ok = false;
    if (branchFilter && order?.branch?._id !== branchFilter) ok = false;
    if (
      productFilter &&
      !order.products.find((pro) =>
        pro?.product?.name?.toLowerCase().includes(productFilter.toLowerCase())
      )
    )
      ok = false;

    // Фильтрация по датам
    if (startDateFilter) {
      const orderDate = new Date(order.createdAt);
      const startDate = new Date(startDateFilter);
      if (orderDate < startDate) ok = false;
    }

    if (endDateFilter) {
      const orderDate = new Date(order.createdAt);
      const endDate = new Date(endDateFilter);
      endDate.setHours(23, 59, 59, 999); // Включить весь день
      if (orderDate > endDate) ok = false;
    }

    return ok;
  });

  // Print uchun window.print logikasi
  const handlePrint = () => {
    if (!printRef.current) {
      toast.error("Chek ma'lumotlari topilmadi");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Chop etish oynasini ocha olmadik");
      return;
    }
    const printContent = printRef.current.innerHTML;
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Buyurtma Cheki</title>
          <meta charset="utf-8">
          <style>
            @page { size: 80mm auto; margin: 1mm; }
            @media print {
              body { margin: 0; padding: 0; font-family: 'Consolas', 'Courier New', monospace; font-size: 32px; line-height: 1.3; width: 80mm; }
              * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
              .no-print { display: none !important; }
            }
            body { margin: 0; padding: 5px; font-family: 'Consolas', 'Courier New', monospace; font-size: 32px; line-height: 1.3; width: 80mm; background: white; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(printHTML);
    printWindow.document.close();
  };

  return (
    <div className="page row-warehouse">
      {/* Фильтры — теперь горизонтально, как в Warehouse */}

      {/* Ko'rsatish: (переключатели столбцов) */}
      <div className="page-details">
        <div style={{ marginBottom: 12 }}>
          <div className="filters-container" style={{ marginBottom: 16 }}>
            <div className="row-form">
              <SearchSelect
                label="Holat"
                options={[
                  { label: "Barchasi", value: "" },
                  { label: "Kutilmoqda", value: "pending" },
                  { label: "Bajarildi", value: "completed" },
                  { label: "Bekor qilindi", value: "cancelled" },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ minWidth: 140 }}
              />
              <SearchSelect
                label="Mahsulot"
                options={[
                  { label: "Barchasi", value: "" },
                  ...orders
                    .flatMap((i) => i.products)
                    .filter((i) => i.product && i.product?.name)
                    .map((i) => ({
                      label: i.product?.name,
                      value: i.product?.name,
                    }))
                    .reduce((acc, item) => {
                      const product = acc.find((i) => i.value == item.value);
                      if (!product) {
                        acc.push({ label: item?.label, value: item.value });
                      }
                      return acc;
                    }, []),
                ]}
                value={productFilter}
                onChange={setProductFilter}
                style={{ minWidth: 140 }}
              />
              <SearchSelect
                label="Mijoz"
                options={[
                  { label: "Barchasi", value: "" },
                  ...clients.map((c) => ({ label: c.fullName, value: c._id })),
                ]}
                value={clientFilter}
                onChange={setClientFilter}
                style={{ minWidth: 140 }}
              />
              <SearchSelect
                label="Filial"
                options={[
                  { label: "Barchasi", value: "" },
                  ...branches.map((b) => ({ label: b?.name, value: b._id })),
                ]}
                value={branchFilter}
                onChange={setBranchFilter}
                style={{ minWidth: 140 }}
              />
              <Input
                label="Boshlanish sanasi"
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                style={{ minWidth: 160 }}
              />
              <Input
                label="Tugash sanasi"
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                style={{ minWidth: 160 }}
              />
            </div>
          </div>
          {/* Статистика заказов */}
          {orderStats && (
            <div
              style={{
                background: "#f7f9fc",
                borderRadius: 12,
                padding: "20px",
                margin: "20px 0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ marginBottom: 16, color: "#3f8cff" }}>
                Buyurtmalar statistikasi
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    Bugungi savdo
                  </div>
                  <div style={{ fontWeight: "bold", color: "#22c55e" }}>
                    {Number(orderStats.todaySales?.uzs || 0).toLocaleString()}{" "}
                    so'm
                    <br />
                    {Number(orderStats.todaySales?.usd || 0).toLocaleString()} $
                  </div>
                </div>
                <div
                  style={{
                    background: "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    Bugungi foyda
                  </div>
                  <div style={{ fontWeight: "bold", color: "#10b981" }}>
                    {Number(orderStats.todayProfit?.uzs || 0).toLocaleString()}{" "}
                    so'm
                    <br />
                    {Number(
                      orderStats.todayProfit?.usd || 0
                    ).toLocaleString()}{" "}
                    $
                  </div>
                </div>
                <div
                  style={{
                    background: "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    Jami savdo
                  </div>
                  <div style={{ fontWeight: "bold", color: "#3f8cff" }}>
                    {Number(orderStats.totalSales?.uzs || 0).toLocaleString()}{" "}
                    so'm
                    <br />
                    {Number(orderStats.totalSales?.usd || 0).toLocaleString()} $
                  </div>
                </div>
                <div
                  style={{
                    background: "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    Jami summa
                  </div>
                  <div style={{ fontWeight: "bold", color: "#6366f1" }}>
                    {Number(orderStats.totalAmount?.uzs || 0).toLocaleString()}{" "}
                    so'm
                    <br />
                    {Number(
                      orderStats.totalAmount?.usd || 0
                    ).toLocaleString()}{" "}
                    $
                  </div>
                </div>
                <div
                  style={{
                    background: "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    To'langan
                  </div>
                  <div style={{ fontWeight: "bold", color: "#059669" }}>
                    {Number(orderStats.totalPaid?.uzs || 0).toLocaleString()}{" "}
                    so'm
                    <br />
                    {Number(orderStats.totalPaid?.usd || 0).toLocaleString()} $
                  </div>
                </div>
                <div
                  style={{
                    background: "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    Qarz
                  </div>
                  <div style={{ fontWeight: "bold", color: "#ef4444" }}>
                    {Number(orderStats.totalDebt?.uzs || 0).toLocaleString()}{" "}
                    so'm
                    <br />
                    {Number(orderStats.totalDebt?.usd || 0).toLocaleString()} $
                  </div>
                </div>
                <div
                  style={{
                    background: "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    Lola foyda
                  </div>
                  <div style={{ fontWeight: "bold", color: "#8b5cf6" }}>
                    {Number(
                      orderStats.totalProfit?.byBranch?.Lola?.uzs || 0
                    ).toLocaleString()}
                    so'm
                    <br />
                    {Number(
                      orderStats.totalProfit?.byBranch?.Lola?.usd || 0
                    ).toLocaleString()}
                    $
                  </div>
                </div>
                <div
                  style={{
                    background: "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    Asosiy foyda
                  </div>
                  <div style={{ fontWeight: "bold", color: "#8b5cf6" }}>
                    {Number(
                      orderStats.totalProfit?.byBranch?.Asosiy?.uzs || 0
                    ).toLocaleString()}{" "}
                    so'm
                    <br />
                    {Number(
                      orderStats.totalProfit?.byBranch?.Asosiy?.usd || 0
                    ).toLocaleString()}{" "}
                    $
                  </div>
                </div>
                <div
                  style={{
                    background: "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    Umumiy foyda
                  </div>
                  <div style={{ fontWeight: "bold", color: "#8b5cf6" }}>
                    {Number(
                      orderStats.totalProfit?.total?.uzs || 0
                    ).toLocaleString()}{" "}
                    so'm
                    <br />
                    {Number(
                      orderStats.totalProfit?.total?.usd || 0
                    ).toLocaleString()}{" "}
                    $
                  </div>
                </div>
                <div
                  style={{
                    background: "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    Buyurtmalar soni
                  </div>
                  <div style={{ fontWeight: "bold", color: "#f59e0b" }}>
                    {orderStats.totalOrders || 0} ta
                  </div>
                </div>
                <div
                  style={{
                    background: "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      color: "#666",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    Mahsulotlar soni
                  </div>
                  <div style={{ fontWeight: "bold", color: "#06b6d4" }}>
                    {orderStats.productsCount || 0} ta
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Eng ko'p sotilgan mahsulotlar */}
          {bestSellingProducts.length > 0 && (
            <div
              style={{
                background: "#f7f9fc",
                borderRadius: 12,
                padding: "20px",
                margin: "20px 0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <Switch
                checked={showBestSelling}
                onChange={(checked) => setShowBestSelling(checked)}
                label="Eng ko'p sotilgan mahsulotlar"
              />
              {showBestSelling && (
                <Table
                  columns={[
                    {
                      key: "name",
                      title: "Mahsulot nomi",
                      render: (val) => (
                        <span style={{ fontWeight: "bold", color: "#333" }}>
                          {val}
                        </span>
                      ),
                    },
                    {
                      key: "totalSold",
                      title: "Sotilgan soni",
                      render: (val) => (
                        <span
                          style={{
                            background: "#3f8cff",
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          {val} ta
                        </span>
                      ),
                    },
                    {
                      key: "salePrice",
                      title: "Sotuv narxi",
                      render: (val, row) => (
                        <span style={{ color: "#22c55e", fontWeight: "500" }}>
                          {Number(val || 0).toLocaleString()}{" "}
                          {row.currency || "so'm"}
                        </span>
                      ),
                    },
                    {
                      key: "profit",
                      title: "Foyda",
                      render: (val, row) => (
                        <span style={{ color: "#8b5cf6", fontWeight: "bold" }}>
                          {Number(
                            (row.salePrice - row.costPrice) * row.totalSold || 0
                          ).toLocaleString()}{" "}
                          {row.currency || "so'm"}
                        </span>
                      ),
                    },
                  ]}
                  data={bestSellingProducts.slice(0, 10)}
                  sortable={false}
                  pagination={false}
                  loading={false}
                  style={{ marginTop: "16px" }}
                />
              )}
            </div>
          )}
          <div className="filters-container">Ko'rsatish:</div>
          <div className="row-form filters-container">
            {allColumns
              .filter((col) => col.key !== "actions")
              .map((col) => (
                <Switch
                  key={col.key}
                  checked={visibleColumns.includes(col.key)}
                  onChange={(checked) => {
                    setVisibleColumns((prev) => {
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
        </div>

        <div className="page-header">
          <div style={{ display: "flex", gap: "12px" }}>
            <Truck color="#3f8cff" />
            <span>Buyurtmalar</span>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={exportToExcel}
              disabled={loading || filteredOrders.length === 0}
              style={{
                background: "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Upload size={20} color="#fff" />
              <span>Excel Export</span>
            </button>
            <button
              onClick={() => {
                reset();
                setValue("branch", branches[0]?._id || "");
                setEditing(null);
                setOpened("new_order");
              }}
              disabled={loading}
            >
              <X size={24} color="#3F8CFF" as="+" />
              <span>YANGI BUYURTMA</span>
            </button>
          </div>
          <div></div>
        </div>
        <Table
          columns={columns}
          data={filteredOrders}
          sortable={true}
          pagination={false}
          pageSize={pageSize}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          loading={tableLoading}
        />
        <div className="pagination">
          <span>{totalCount} ta buyurtma</span>
          <button
            onClick={() => {
              if (page > 1) {
                setPage(page - 1);
              }
            }}
          >
            Orqaga
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => {
              if (page < totalPages) {
                setPage(page + 1);
              }
            }}
          >
            Keyingi
          </button>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`driwer-form${opened ? " opened" : ""}`}
      >
        <div className="form-body">
          <div className="page-header">
            <Upload />
            <span>{editing ? "Buyurtmani tahrirlash" : "YANGI BUYURTMA"}</span>
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
            <Controller
              control={control}
              name="client"
              render={({ field }) => (
                <SearchSelect
                  label="Mijoz"
                  options={[
                    { label: "Yangi mijoz", value: null },
                    ...clients.map((client) => ({
                      label: client.fullName,
                      value: client._id,
                    })),
                  ]}
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                  }}
                  disabled={loading}
                />
              )}
            />
            <Controller
              control={control}
              name="branch"
              rules={{ required: "Filial majburiy" }}
              render={({ field }) => (
                <SearchSelect
                  label="Filial"
                  options={branches.map((branch) => ({
                    label: branch?.name,
                    value: branch?._id,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.branch?.message}
                  required
                  disabled={loading}
                />
              )}
            />
          </div>
          {!watch("client") ? null : (
            <div className="row-form">
              <Controller
                control={control}
                name="car"
                render={({ field }) => (
                  <SearchSelect
                    label="Mashina"
                    options={(() => {
                      const client = clients.find(
                        ({ _id }) => _id === watch("client")
                      );
                      if (
                        !client ||
                        !Array.isArray(client.cars) ||
                        client.cars.length === 0
                      ) {
                        return [
                          {
                            label: "Mijozda mashina yo'q",
                            value: "",
                            disabled: true,
                          },
                        ];
                      }
                      return client?.cars.map((car) => {
                        return {
                          label: `${car?.model?.name} [${car?.plateNumber}]`,
                          value: car?._id,
                        };
                      });
                    })()}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.status?.message}
                    required={
                      clients.find(({ _id }) => _id === watch("client"))?.cars
                        ?.length > 0
                    }
                    disabled={loading}
                  />
                )}
              />
            </div>
          )}
          <div className="products-list">
            <div className="products-header">
              <h3>Mahsulotlar</h3>
            </div>
            {fields.map((field, index) => {
              // Tanlangan product _id
              const selectedProductId = watch(`products.${index}.product`);
              // Tanlangan product obyektini topamiz
              const selectedProduct = productsList.find(
                (p) => p._id === selectedProductId
              );

              return (
                <React.Fragment key={field.id}>
                  <div>
                    <Controller
                      control={control}
                      name={`products.${index}.product`}
                      rules={{ required: "Mahsulot majburiy" }}
                      render={({ field: productField }) => (
                        <SearchSelect
                          label="Mahsulot"
                          options={productsList
                            .filter(
                              (product) =>
                                !fields.some(
                                  (f, i) =>
                                    i !== index && f.product === product._id
                                )
                            )
                            .map((product) => ({
                              label: `${product?.name} | ${
                                product?.salePrice?.toLocaleString() +
                                " " +
                                product?.currency
                              }  (${product?.quantity} ${product?.unit})`,
                              value: product?._id,
                            }))}
                          value={productField.value}
                          onChange={(v) => {
                            handleProductChange(v, index);
                            productField.onChange(v);
                          }}
                          error={errors.products?.[index]?.product?.message}
                          required
                          disabled={loading}
                        />
                      )}
                    />

                    <div
                      className="row-form"
                      style={{
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      <Input
                        label="Narx"
                        value={(() => {
                          const currentPrice = watch(`products.${index}.price`);
                          if (
                            typeof currentPrice === "object" &&
                            currentPrice !== null
                          ) {
                            // Agar narx object bo'lsa, faqat ko'rsatish uchun
                            return selectedProduct?.currency === "usd"
                              ? currentPrice.usd || 0
                              : currentPrice.uzs || 0;
                          }
                          return currentPrice || 0;
                        })()}
                        onChange={(e) => {
                          const product = productsList.find(
                            (p) => p._id === selectedProductId
                          );
                          if (typeof product?.salePrice === "object") {
                            // Agar mahsulot narxi object bo'lsa, uni o'zgartirishga ruxsat bermaymiz
                            return;
                          }
                          setValue(`products.${index}.price`, e.target.value);
                        }}
                        type="number"
                        disabled={(() => {
                          const product = productsList.find(
                            (p) => p._id === selectedProductId
                          );
                          return (
                            loading || typeof product?.salePrice === "object"
                          );
                        })()}
                        style={{ marginTop: 15 }}
                      />
                      <Input
                        label="Miqdori"
                        type="number"
                        value={watch(`products.${index}.quantity`) || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (
                            value === "" ||
                            (Number(value) >= 0 &&
                              Number(value) <= selectedProduct?.quantity)
                          ) {
                            setValue(`products.${index}.quantity`, value);
                          }
                        }}
                        error={errors.products?.[index]?.quantity?.message}
                        required
                        disabled={loading}
                        style={{ marginTop: 15 }}
                      />
                      <Input
                        label="Umumiy narx"
                        readonly
                        value={(() => {
                          const price = watch(`products.${index}.price`);
                          const quantity = watch(`products.${index}.quantity`);
                          if (typeof price === "object" && price !== null) {
                            const totalUzs =
                              Number(price.uzs || 0) * Number(quantity || 0);
                            const totalUsd =
                              Number(price.usd || 0) * Number(quantity || 0);
                            if (totalUzs > 0 && totalUsd > 0) {
                              return `${totalUzs.toLocaleString()} so'm / ${totalUsd.toLocaleString()} $`;
                            } else if (totalUsd > 0) {
                              return `${totalUsd.toLocaleString()} $`;
                            } else {
                              return `${totalUzs.toLocaleString()} so'm`;
                            }
                          }
                          const total =
                            Number(price || 0) * Number(quantity || 0);
                          const currency =
                            selectedProduct?.currency === "usd" ||
                            selectedProduct?.currency === "USD"
                              ? "$"
                              : "so'm";
                          return `${total.toLocaleString()} ${currency}`;
                        })()}
                        style={{ marginTop: 15 }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => remove(index)}
                    disabled={loading || fields.length === 1}
                  >
                    <Trash color="#fff" />
                  </button>
                </React.Fragment>
              );
            })}
          </div>
          <div className="row-form">
            <button
              type="button"
              className="btn primary"
              onClick={handleAddProduct}
              disabled={loading}
            >
              <X size={24} color="#fff" as="+" />
              <span>Yana Qo'shish</span>
            </button>
          </div>
          <div className="row-form">
            <Controller
              control={control}
              name="paymentType"
              rules={{ required: "To'lov turi majburiy" }}
              render={({ field }) => (
                <SearchSelect
                  label="To'lov turi"
                  options={paymentTypeOptions}
                  value={field.value}
                  onChange={(v) => {
                    // Проверяем, есть ли долг при выборе других типов оплаты
                    const currentDebtUzs = Math.max(
                      (totalAmount.uzs || 0) -
                        (Number(paidAmountWatch?.uzs) || 0),
                      0
                    );
                    const currentDebtUsd = Math.max(
                      (totalAmount.usd || 0) -
                        (Number(paidAmountWatch?.usd) || 0),
                      0
                    );

                    if (
                      v !== "debt" &&
                      (currentDebtUzs > 0 || currentDebtUsd > 0)
                    ) {
                      toast.info(
                        "To'liq summa to'lanmagan. Nasiya usulini tanlang yoki to'langan summani to'liq kiriting"
                      );
                      return;
                    }

                    field.onChange(v);
                  }}
                  error={errors.paymentType?.message}
                  required
                  disabled={loading}
                />
              )}
            />
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <SearchSelect
                  label="Holat"
                  options={[
                    { label: "Kutilmoqda", value: "pending" },
                    { label: "Bajarildi", value: "completed" },
                    { label: "Bekor qilindi", value: "cancelled" },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.status?.message}
                  required
                  disabled={loading}
                />
              )}
            />
          </div>

          {/* Отображение общей суммы */}
          {(totalAmount.uzs > 0 || totalAmount.usd > 0) && (
            <div
              style={{
                background: "#f7f9fc",
                borderRadius: 8,
                padding: "16px 32px",
                margin: "16px 0",
                boxShadow: "0 1px 4px #e3e8f0",
              }}
            >
              <h4 style={{ margin: 0, marginBottom: 8, color: "#3f8cff" }}>
                Jami summa:
              </h4>
              <div style={{ display: "flex", gap: 12, width: "100%" }}>
                <Input
                  label="Jami summa (UZS)"
                  value={`${Number(
                    totalAmount.uzs || 0
                  ).toLocaleString()} so'm`}
                  readOnly
                  disabled
                  style={{
                    background: "#e6f3ff",
                    color: "#3f8cff",
                    fontWeight: "bold",
                  }}
                />
                <Input
                  label="Jami summa (USD)"
                  value={`${Number(totalAmount.usd || 0).toLocaleString()} $`}
                  readOnly
                  disabled
                  style={{
                    background: "#e6f3ff",
                    color: "#3f8cff",
                    fontWeight: "bold",
                  }}
                />
              </div>
            </div>
          )}

          <div className="row-form">
            <div style={{ display: "flex", gap: 12, width: "100%" }}>
              <Controller
                control={control}
                name="paidAmount.uzs"
                rules={{
                  min: { value: 0, message: "0 dan kam bo'lmasligi kerak" },
                  max: {
                    value: totalAmount.uzs,
                    message: `Maksimal summa: ${totalAmount.uzs?.toLocaleString()} so'm`,
                  },
                }}
                render={({ field }) => (
                  <Input
                    label="To'langan summa UZS"
                    type="number"
                    placeholder={`Maksimal: ${totalAmount.uzs?.toLocaleString()} so'm`}
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val === "") {
                        field.onChange(0);
                        return;
                      }
                      val = val.replace(/[^\d]/g, "");
                      const numVal = Number(val);
                      if (numVal > (totalAmount.uzs || 0)) {
                        field.onChange(totalAmount.uzs || 0);
                      } else {
                        field.onChange(numVal);
                      }
                    }}
                    error={errors.paidAmount?.uzs?.message}
                    disabled={loading}
                  />
                )}
              />
              <Controller
                control={control}
                name="paidAmount.usd"
                rules={{
                  min: { value: 0, message: "0 dan kam bo'lmasligi kerak" },
                  max: {
                    value: totalAmount.usd,
                    message: `Maksimal summa: ${totalAmount.usd?.toLocaleString()} $`,
                  },
                }}
                render={({ field }) => (
                  <Input
                    label="To'langan summa USD"
                    type="number"
                    placeholder={`Maksimal: ${totalAmount.usd?.toLocaleString()} $`}
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val === "") {
                        field.onChange(0);
                        return;
                      }
                      val = val.replace(/[^\d.]/g, "");
                      const numVal = Number(val);
                      if (numVal > (totalAmount.usd || 0)) {
                        field.onChange(totalAmount.usd || 0);
                      } else {
                        field.onChange(numVal);
                      }
                    }}
                    error={errors.paidAmount?.usd?.message}
                    disabled={loading}
                  />
                )}
              />
            </div>
          </div>
          {(debtAmount.uzs > 0 ||
            debtAmount.usd > 0 ||
            watch("paymentType") == "debt") && (
            <div className="row-form">
              <Input
                label="Qarz miqdori (UZS)"
                value={`${Number(debtAmount.uzs || 0).toLocaleString()} so'm`}
                readOnly
                disabled
              />
              <Input
                label="Qarz miqdori (USD)"
                value={`${Number(debtAmount.usd || 0).toLocaleString()} $`}
                readOnly
                disabled
              />
              <Input
                label="Qarz qaytarilish sanasi"
                type="datetime-local"
                min={minDateReturned}
                {...register("date_returned", {
                  required:
                    debtAmount.uzs > 0 || debtAmount.usd > 0
                      ? "Qarz uchun muddat majburiy"
                      : false,
                  validate: (value) => {
                    if ((debtAmount.uzs > 0 || debtAmount.usd > 0) && !value)
                      return "Qarz uchun muddat majburiy";
                    if (value && value < minDateReturned)
                      return `Sanani ${minDateReturned} dan keyin tanlang`;
                    return true;
                  },
                })}
                error={errors.date_returned?.message}
                disabled={loading}
              />
            </div>
          )}
          <div className="row-form">
            <Input
              label="Izoh"
              {...register("notes", {
                maxLength: {
                  value: 500,
                  message: "Izoh 500 ta belgidan oshmasligi kerak",
                },
              })}
              error={errors.notes?.message}
              disabled={loading}
            />
          </div>

          <div className="row-form">
            <button
              type="reset"
              className="btn secondary"
              onClick={() => reset()}
              disabled={loading}
            >
              <span>Tozalash</span>
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? (
                <Loader size={24} />
              ) : (
                <span>{editing ? "Saqlash" : "Buyurtma berish"}</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Chek preview modal */}
      {openPrint.is_open && (
        <Modal
          onClose={() => setOpenPrint({ is_open: false, order: {} })}
          modalStyle={{
            width: "120mm",
            height: "95dvh",
            maxHeight: "95dvh",
          }}
          opened={openPrint.is_open}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            <h3 style={{ margin: 0, textAlign: "center" }}>Chek chiqarish</h3>
            <div
              style={{
                border: "1px solid #ddd",
                padding: "10px",
                height: "calc(90dvh - 150px)",
                overflow: "auto",
                backgroundColor: "#f9f9f9",
              }}
            >
              <OrderReceiptContent ref={printRef} order={openPrint.order} />
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              <button
                className="btn primary"
                onClick={handlePrint}
                style={{ minWidth: "120px" }}
              >
                <PrintIcon width={18} height={18} fill="#FFF" />
                <span style={{ marginLeft: "8px" }}>Chop etish</span>
              </button>
              <button
                className="btn secondary"
                onClick={() => setOpenPrint({ is_open: false, order: {} })}
                style={{ minWidth: "120px" }}
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrdersPage;

// Order uchun ReceiptContent
const OrderReceiptContent = React.forwardRef(({ order }, ref) => {
  const currentDate = new Date(order?.createdAt).toLocaleString("uz-UZ");
  // --- добавляем состояние для пагинации товаров ---
  const [page, setPage] = React.useState(1);
  const pageSize = 10; // Количество товаров на странице

  if (!order) {
    return (
      <div ref={ref} style={{ padding: "20px", textAlign: "center" }}>
        <p>Ma'lumot topilmadi</p>
      </div>
    );
  }

  // Пагинация товаров
  const products = order.products || [];
  const totalPages = Math.ceil(products.length / pageSize);
  const paginatedProducts = products.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div
      ref={ref}
      style={{
        margin: "0 auto",
        fontFamily: "'Consolas', 'Courier New', monospace",
        fontSize: "26px",
        lineHeight: "1.5",
        color: "#000",
        backgroundColor: "#fff",
        padding: "14px",
        border: "none",
        width: "100%",
        maxWidth: "620px",
        boxSizing: "border-box",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
      }}
    >
      {/* Заголовок */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "25px",
        }}
      >
        <img
          src="./logo.png"
          alt="logo"
          style={{
            width: "90px",
            height: "90px",
            marginBottom: "10px",
            display: "block",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            textAlign: "center",
            marginBottom: "14px",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "5px",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            Nakladnoy
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#666",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            {order?.branch?.name || "-"} {currentDate}
          </div>
          <div
            style={{
              fontSize: "16px",
              color: "#666",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            Chek raqami: #{order?.index || "000000"}
          </div>
        </div>
      </div>
      {/* Разделитель */}
      <div
        style={{
          borderTop: "1px dashed #000",
          margin: "8px 0",
          width: "100%",
        }}
      ></div>
      {/* Mijoz va buyurtma info */}
      <div style={{ marginBottom: "14px", fontSize: "16px" }}>
        <div style={{ marginBottom: "2px" }}>
          <strong>Mijoz:</strong> {order?.client?.fullName || "-"} (
          {order?.client?.phone || "-"})
        </div>
      </div>
      {/* Разделитель */}
      <div
        style={{
          borderTop: "1px dashed #000",
          margin: "8px 0",
          width: "100%",
        }}
      ></div>
      {/* Mahsulotlar */}
      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            fontWeight: "bold",
            marginBottom: "7px",
            fontSize: "15px",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          MAHSULOTLAR:
        </div>
        {paginatedProducts.length > 0 ? (
          paginatedProducts.map((item, index) => (
            <div
              key={index + (page - 1) * pageSize}
              style={{
                marginBottom: "8px",
                fontSize: "15px",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "1px",
                  fontWeight: "bold",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {item?.product?.name || "Mahsulot"}
                </span>
                <span style={{ whiteSpace: "nowrap" }}>
                  {item?.quantity || 1}x
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "15px",
                  color: "#666",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {(item?.price || 0).toLocaleString()}{" "}
                  {item?.currency || "UZS"}
                </span>
                <span style={{ whiteSpace: "nowrap" }}>
                  {(
                    (item?.price || 0) * (item?.quantity || 1)
                  ).toLocaleString()}{" "}
                  {item?.currency || "UZS"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              fontSize: "15px",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            Ma'lumot yo'q
          </div>
        )}
        {/* --- Пагинация для товаров --- */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 8,
              gap: 8,
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "2px 10px",
                fontSize: 16,
                borderRadius: 4,
                border: "1px solid #ccc",
                background: page === 1 ? "#eee" : "#fff",
                cursor: page === 1 ? "not-allowed" : "pointer",
              }}
            >
              {"<"}
            </button>
            <span style={{ fontSize: 16 }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "2px 10px",
                fontSize: 16,
                borderRadius: 4,
                border: "1px solid #ccc",
                background: page === totalPages ? "#eee" : "#fff",
                cursor: page === totalPages ? "not-allowed" : "pointer",
              }}
            >
              {">"}
            </button>
          </div>
        )}
      </div>
      {/* Разделитель */}
      <div
        style={{
          borderTop: "1px dashed #000",
          margin: "8px 0",
          width: "100%",
        }}
      ></div>
      {/* Итоги */}
      <div style={{ marginBottom: "14px", fontSize: "15px" }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            textAlign: "center",
            margin: "5px 0",
            lineHeight: "1",
          }}
        >
          JAMI TO'LOV: <br />
          <span
            style={{ fontSize: "8px", color: "#000", fontWeight: "normal" }}
          >
            Chegirmalarni hisobga olgan holda
          </span>
        </h3>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            fontSize: "15px",
            marginBottom: "2px",
          }}
        >
          <span>UZS:</span>
          <span>{(order?.totalAmount?.uzs || 0).toLocaleString()} so'm</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            fontSize: "15px",
          }}
        >
          <span>USD:</span>
          <span>{(order?.totalAmount?.usd || 0).toLocaleString()} $</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            fontSize: "15px",
            marginTop: "8px",
          }}
        >
          <span>To'langan:</span>
          <span>
            {(order?.paidAmount?.uzs || 0).toLocaleString()} so'm /{" "}
            {(order?.paidAmount?.usd || 0).toLocaleString()} $
          </span>
        </div>
        {order?.debtAmount?.uzs || order?.debtAmount?.usd ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              fontSize: "15px",
              marginTop: "8px",
            }}
          >
            <span>Qarz:</span>
            <span>
              {order?.debtAmount?.uzs
                ? `${(order?.debtAmount?.uzs || 0).toLocaleString()} so'm `
                : null}
              {order?.debtAmount?.usd
                ? `${(order?.debtAmount?.usd || 0).toLocaleString()} $`
                : null}
            </span>
          </div>
        ) : null}
      </div>
      {/* Разделитель */}
      <div
        style={{
          borderTop: "1px dashed #000",
          margin: "8px 0",
          width: "100%",
        }}
      ></div>
      {/* Izoh va qaytarilish sanasi */}
      {order?.date_returned && (
        <div style={{ marginBottom: "8px", fontSize: "15px" }}>
          <strong>Qarz qaytarilish sanasi:</strong>{" "}
          {moment(order.date_returned).format("DD.MM.YYYY HH:mm")}
        </div>
      )}
      {order?.notes && (
        <div style={{ marginBottom: "8px", fontSize: "15px" }}>
          <strong>Izoh:</strong> {order.notes}
        </div>
      )}
      {/* Подвал */}
      <div
        style={{
          textAlign: "center",
          marginTop: "14px",
          fontSize: "15px",
          color: "#666",
        }}
      >
        <div
          style={{
            marginTop: "10px",
            fontSize: "10px",
            color: "#333",
          }}
        >
          &copy;{new Date().getFullYear()} UFLEX.{" "}
          <a style={{ color: "#222" }} href="https://t.me/u_flex">
            Telegram: @u_flex
          </a>{" "}
          <br /> IT - xizmatlar va dasturiy ta'minot ishlab chiqish
        </div>
      </div>
    </div>
  );
});
OrderReceiptContent.displayName = "OrderReceiptContent";
