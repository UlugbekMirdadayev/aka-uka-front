import { useCallback, useEffect, useState } from "react";
import { Pen, Trash, Upload, WereHouse, X } from "../assets/icons";
import Table from "../components/Table";
import "../styles/warehouse.css";
import Input from "../components/Input";
import { useForm } from "react-hook-form";
import api from "../services/api";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
// import moment from "moment/min/moment-with-locales";
import Switch from "../components/Switch";
import SearchSelect from "../components/SearchSelect";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Warehouse = () => {
  const [opened, setOpened] = useState(false);
  // const [openedBatch, setOpenedBatch] = useState(false);
  const [products, setProducts] = useState([]);
  // const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  // const [editBatchId, setEditBatchId] = useState(null);
  const [openFilter, setOpenFilter] = useState(false);
  const [openedColumns, setOpenedColumns] = useState(false);
  const { user } = useSelector(({ user }) => user);
  // Состояния для фильтров
  const [filters, setFilters] = useState({
    name: "",
    minCostPrice: "",
    maxCostPrice: "",
    minSalePrice: "",
    maxSalePrice: "",
    minQuantity: "",
    maxQuantity: "",
    unit: "",
    currency: "",
    isAvailable: "",
  });

  // Состояния для пагинации и сортировки
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pageInput, setPageInput] = useState("1");

  // Debounced search для имени продукта
  const debouncedNameFilter = useDebounce(filters.name, 500);

  // Fetch products and batches - pagination, sorting and name filter on backend
  const fetchProducts = useCallback(
    async (page = 1, pageLimit = limit, nameFilter = "") => {
      setTableLoading(true);
      try {
        const params = {
          page,
          limit: pageLimit,
          sortBy,
          sortOrder,
          // Только фильтр по имени отправляем на бэкенд
          ...(nameFilter && { name: nameFilter }),
        };

        const res = await api.get("/products", params);
        setProducts(res.data.data || []);
        setCurrentPage(res.data.pagination?.currentPage || 1);
        setTotalPages(res.data.pagination?.totalPages || 0);
        setTotalCount(res.data.pagination?.totalCount || 0);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Mahsulotlarni yuklashda xatolik";
        toast.error(errorMessage);
      } finally {
        setTableLoading(false);
      }
    },
    [limit, sortBy, sortOrder]
  );

  // Функция для фильтрации продуктов только на фронте (кроме имени)
  const getFilteredProducts = useCallback(() => {
    return products.filter((product) => {
      // Фильтр по имени убираем - он работает на бэкенде

      // Фильтры по ценам
      if (
        filters.minCostPrice &&
        Number(product.costPrice) < Number(filters.minCostPrice)
      ) {
        return false;
      }
      if (
        filters.maxCostPrice &&
        Number(product.costPrice) > Number(filters.maxCostPrice)
      ) {
        return false;
      }
      if (
        filters.minSalePrice &&
        Number(product.salePrice) < Number(filters.minSalePrice)
      ) {
        return false;
      }
      if (
        filters.maxSalePrice &&
        Number(product.salePrice) > Number(filters.maxSalePrice)
      ) {
        return false;
      }
      // Фильтры по количеству
      if (
        filters.minQuantity &&
        Number(product.quantity) < Number(filters.minQuantity)
      ) {
        return false;
      }
      if (
        filters.maxQuantity &&
        Number(product.quantity) > Number(filters.maxQuantity)
      ) {
        return false;
      }

      // Фильтр по единице измерения
      if (filters.unit && product.unit !== filters.unit) {
        return false;
      }

      // Фильтр по валюте
      if (filters.currency && product.currency !== filters.currency) {
        return false;
      }

      // Фильтр по доступности
      if (filters.isAvailable !== "") {
        const isAvailable = filters.isAvailable === "true";
        if (product.isAvailable !== isAvailable) {
          return false;
        }
      }

      return true;
    });
  }, [products, filters]);

  // Функция для изменения лимита
  const handleLimitChange = useCallback(
    (newLimit) => {
      setLimit(newLimit);
      fetchProducts(1, newLimit, filters.name);
    },
    [fetchProducts, filters.name]
  );

  // Функция для изменения сортировки
  const handleSortChange = useCallback(
    (sortField, order) => {
      setSortBy(sortField);
      setSortOrder(order);
      fetchProducts(1, limit, filters.name);
    },
    [fetchProducts, limit, filters.name]
  );

  // Функция для обработки изменения фильтра по имени (теперь без прямого вызова API)
  const handleNameFilterChange = useCallback((name) => {
    setFilters((f) => ({ ...f, name }));
    // API вызов произойдет через debounced useEffect
  }, []);

  // Функция для сброса фильтров
  const resetFilters = useCallback(() => {
    setFilters({
      name: "",
      minCostPrice: "",
      maxCostPrice: "",
      minSalePrice: "",
      maxSalePrice: "",
      minQuantity: "",
      maxQuantity: "",
      unit: "",
      currency: "",
      isAvailable: "",
    });
    // Сбрасываем фильтр по имени и обновляем данные
    fetchProducts(1, limit, "");
  }, [fetchProducts, limit]);

  // Функция для смены страницы
  const handlePageChange = useCallback(
    (page) => {
      fetchProducts(page, limit, filters.name);
      setPageInput(page);
    },
    [fetchProducts, limit, filters.name]
  );

  // Функция для прямого перехода на страницу
  const handleDirectPageChange = useCallback(
    (e) => {
      if (e.key === "Enter") {
        const page = parseInt(pageInput);
        if (page >= 1 && page <= totalPages) {
          handlePageChange(page);
          setPageInput("");
        }
      }
    },
    [pageInput, totalPages, handlePageChange]
  );

  // Фильтрация теперь происходит на фронте
  const filteredProducts = getFilteredProducts();

  const {
    register: registerProduct,
    setValue: setValueProduct,
    formState: { errors: errorsProduct },
    handleSubmit: handleSubmitProduct,
    reset: resetProduct,
    watch: watchProduct,
  } = useForm({
    defaultValues: {
      name: "",
      costPrice: "",
      salePrice: "",
      quantity: "",
      minQuantity: 1,
      unit: "kg",
      description: "",
      isAvailable: true,
    },
  });

  useEffect(() => {
    fetchProducts(1, limit, "");
  }, [fetchProducts, limit]);

  // Эффект для debounced поиска по имени
  useEffect(() => {
    if (debouncedNameFilter !== filters.name) {
      return; // Избегаем лишних вызовов
    }
    fetchProducts(1, limit, debouncedNameFilter);
  }, [debouncedNameFilter, fetchProducts, limit, filters.name]);

  const buildProductFormData = (data, isUpdate = false) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("costPrice", data.costPrice);
    formData.append("salePrice", data.salePrice);
    formData.append("quantity", data.quantity);
    formData.append("minQuantity", data.minQuantity);
    formData.append("unit", data.unit);
    formData.append("description", data.description || "");
    formData.append("isAvailable", data.isAvailable ? "true" : "false");

    if (isUpdate) {
      // Yangilanish uchun
      const newFiles = [];
      const oldImages = [];

      (data.images || []).forEach((img) => {
        if (img instanceof File) {
          // Yangi fayllar
          newFiles.push(img);
        } else if (typeof img === "string") {
          // String - bu URL yoki file_id bo'lishi mumkin
          if (img.startsWith("http")) {
            // URL format
            oldImages.push({ fileURL: img, file_id: "" });
          } else {
            // file_id format
            oldImages.push({ file_id: img, fileURL: "" });
          }
        } else if (img && typeof img === "object") {
          // Obyekt format - backend format bilan mos
          const oldImg = {
            fileURL: img.fileURL || img.url || "",
            file_id: img.file_id || "",
          };
          // fileURL yoki file_id mavjud bo'lsa qo'shamiz
          if (oldImg.fileURL || oldImg.file_id) {
            oldImages.push(oldImg);
          }
        }
      });

      // Yangi fayllarni qo'shamiz
      newFiles.forEach((file) => {
        formData.append("newImages", file);
      });

      // Eski rasmlarni JSON formatda yuboramiz
      if (oldImages.length > 0) {
        formData.append("oldImages", JSON.stringify(oldImages));
      }

      // O'chirilgan rasmlarni yuboramiz
      if (data.deletedImages && data.deletedImages.length > 0) {
        formData.append("deletedImages", JSON.stringify(data.deletedImages));
      }
    } else {
      // Yaratish uchun - faqat yangi fayllar
      (data.images || []).forEach((img) => {
        if (img instanceof File) {
          formData.append("images", img);
        }
      });
    }

    formData.append(
      "discount",
      JSON.stringify(data.discount || { price: 0, children: [] })
    );
    return formData;
  };

  const createProduct = useCallback(async (data) => {
    const formData = buildProductFormData(data, false);
    const response = await api.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }, []);

  const updateProduct = useCallback(async (id, data) => {
    const formData = buildProductFormData(data, true);
    const response = await api.patch(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }, []);

  const deleteProduct = useCallback(
    async (id) => {
      setLoading(true);
      try {
        await api.delete(`/products/${id}`);
        toast.success("Mahsulot o'chirildi");
        const newPage =
          products.length === 1 && currentPage > 1
            ? currentPage - 1
            : currentPage;

        fetchProducts(newPage, limit, filters.name);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Mahsulotni o'chirishda xatolik";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [products.length, currentPage, fetchProducts, limit, filters.name]
  );

  // CRUD for batches
  // const createBatch = async (data) => {
  //   setLoading(true);
  //   try {
  //     const res = await api.post("/batches", data);
  //     setBatches((prev) => [res.data, ...prev]);
  //     toast.success("Partiya qo'shildi");
  //   } catch (err) {
  //     const errorMessage =
  //       err.response?.data?.message ||
  //       err.message ||
  //       "Partiya qo'shishda xatolik";
  //     toast.error(errorMessage);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const updateBatch = async (batch_number, data) => {
  //   setLoading(true);
  //   try {
  //     const res = await api.patch(`/batches/${batch_number}`, data);
  //     setBatches((prev) =>
  //       prev.map((b) => (b.batch_number === batch_number ? res.data : b))
  //     );
  //     toast.success("Partiya yangilandi");
  //   } catch (err) {
  //     const errorMessage =
  //       err.response?.data?.message ||
  //       err.message ||
  //       "Partiya yangilashda xatolik";
  //     toast.error(errorMessage);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const deleteBatch = async (batch_number) => {
  //   setLoading(true);
  //   try {
  //     await api.delete(`/batches/${batch_number}`);
  //     setBatches((prev) => prev.filter((b) => b.batch_number !== batch_number));
  //     toast.success("Partiya o'chirildi");
  //   } catch (err) {
  //     const errorMessage =
  //       err.response?.data?.message ||
  //       err.message ||
  //       "Partiya o'chirishda xatolik";
  //     toast.error(errorMessage);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Form submit handlers
  const onSubmit = useCallback(
    async (values) => {
      const payload = {
        name: values.name,
        costPrice: Number(values.costPrice),
        salePrice: Number(values.salePrice),
        quantity: Number(values.quantity),
        createdBy: user?._id,
        minQuantity: Number(values.minQuantity),
        unit: values.unit,
        description: values.description || "",
        isAvailable: values.isAvailable !== false, // default to true if not set
      };

      setLoading(true);
      try {
        if (editId) {
          await updateProduct(editId, payload);
        } else {
          await createProduct(payload);
        }
        resetProduct();
        setOpened(false);
        setEditId(null);

        // Янги элемент қўшилганда биринчи саҳифага ўтиш
        const targetPage = editId ? currentPage : 1;

        fetchProducts(targetPage, limit, filters.name);
        toast.success(editId ? "Mahsulot yangilandi" : "Mahsulot qo'shildi");
      } catch (error) {
        console.error(error);
        const errorMessage =
          error.response?.data?.message || error.message || "Xatolik yuz berdi";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [
      user?._id,
      editId,
      resetProduct,
      currentPage,
      fetchProducts,
      limit,
      createProduct,
      updateProduct,
      filters.name,
    ]
  );

  // const onBatchSubmit = async (values) => {
  //   const batchData = {
  //     batch_number: values.batch_number?.toUpperCase(),
  //   };
  //   try {
  //     if (editBatchId) {
  //       await updateBatch(editBatchId, batchData);
  //     } else {
  //       await createBatch(batchData);
  //     }
  //     resetBatch();
  //     setOpenedBatch(false);
  //     setEditBatchId(null);
  //     // fetchBatches();
  //   } catch (error) {
  //     console.error(error);
  //     const errorMessage =
  //       error.response?.data?.message || error.message || "Xatolik yuz berdi";
  //     toast.error(errorMessage);
  //   }
  // };

  // Edit handlers
  const handleEdit = (obj) => {
    setOpened(true);
    Object.entries(obj).forEach(([key, value]) => {
      setValueProduct(key, value?._id ? value._id : value);
    });
    setEditId(obj._id);
  };

  const handleDelete = (id) => {
    if (window.confirm("O'chirishni xohlaysizmi?")) {
      deleteProduct(id);
    }
  };

  // const handleBatchEdit = (batch) => {
  //   setOpenedBatch(true);
  //   setValueBatch("batch_number", batch.batch_number);
  //   setEditBatchId(batch.batch_number);
  // };

  // const handleBatchDelete = (id) => {
  //   if (window.confirm("O'chirishni xohlaysizmi?")) {
  //     deleteBatch(id);
  //   }
  // };

  // Все возможные столбцы
  const allColumns = [
    { key: "name", title: "Nomi" },
    {
      key: "costPrice",
      title: "Tannarx",
      render: (_, row) =>
        `${Number(row.costPrice)?.toLocaleString()} ${row.currency}`,
    },
    {
      key: "salePrice",
      title: "Sotish narxi",
      render: (_, row) =>
        `${Number(row.salePrice)?.toLocaleString()} ${row.currency}`,
    },

    {
      key: "profit",
      title: "Taxminiy 1 maxsulotdan foyda",
      render: (_, row) => {
        const profit = Number(row.salePrice) - Number(row.costPrice);
        return `${profit?.toLocaleString()} ${row.currency}`;
      },
    },
    {
      key: "totalProfit",
      title: "Umumiy taxminiy foyda",
      render: (_, row) => {
        const profit =
          (Number(row.salePrice) - Number(row.costPrice)) *
          Number(row.quantity);
        return `${profit?.toLocaleString()} ${row.currency}`;
      },
    },
    {
      key: "quantity",
      title: "Miqdori",
      render: (_, row) =>
        `${row.quantity?.toLocaleString()} ${row.unit || "kg"}`,
    },
    {
      key: "totalCost",
      title: "Kapitali",
      render: (_, row) =>
        `${(Number(row.costPrice) * Number(row.quantity))?.toLocaleString()} ${
          row.currency
        }`,
    },
    // {
    //   key: "batch_number",
    //   title: "Partiya raqami",
    //   render: (_, row) => row.batch_number || "-",
    // },
    {
      key: "createdBy",
      title: "Yaratgan",
      render: (_, row) => row.createdBy?.fullName || "-",
    },
    {
      key: "description",
      title: "Tavsif",
      render: (_, row) => row.description || "-",
    },
    {
      key: "isAvailable",
      title: "Sotuvga qo'yilgan",
      render: (_, row) => (
        <span
          style={{
            color: row.isAvailable ? "#28a745" : "#dc3545",
            fontWeight: "bold",
          }}
        >
          {row.isAvailable ? "Ha" : "Yo'q"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Amallar",
      render: (_, obj) => (
        <div className="actions-row">
          <button
            type="button"
            onClick={() => handleEdit(obj)}
            disabled={loading}
          >
            <Pen />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(obj._id)}
            disabled={loading}
          >
            <Trash />
          </button>
        </div>
      ),
    },
  ];

  // Состояние для видимых столбцов (по умолчанию только основные)
  const defaultVisible = ["name", "costPrice", "salePrice", "quantity"];
  // localStorage bilan bog'lash
  const STORAGE_KEY = "warehouse_visible_columns";
  const getInitialVisibleColumns = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.every((k) => typeof k === "string")
        ) {
          return parsed;
        }
      }
    } catch {
      // intentionally left blank
    }
    return defaultVisible;
  };
  const [visibleColumns, setVisibleColumns] = useState(
    getInitialVisibleColumns
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
    } catch {
      // intentionally left blank
    }
  }, [visibleColumns]);

  // Получить массив столбцов для Table
  const columns = allColumns.filter(
    (col) => col.key === "actions" || visibleColumns.includes(col.key)
  );

  return (
    <div className="page row-warehouse">
      <div className="page-details">
        <div className="page-header">
          <WereHouse />
          <span>Ombor Moduli</span>
          {/* <button
            type="button"
            onClick={() => {
              setOpenedBatch(true);
              setValueBatch(
                "batch_number",
                moment().format("LLLL")?.toUpperCase()
              );
            }}
          >
            <X size={24} color="#3F8CFF" as="+" />
            <span>Partiya qo'shish</span>
          </button> */}
          <button
            type="button"
            onClick={() => {
              setOpened(true);
              resetProduct({
                name: "",
                costPrice: "",
                salePrice: "",
                quantity: "",
                minQuantity: 1,
                unit: "kg",
                description: "",
                isAvailable: true,
              });
              setEditId(null);
            }}
          >
            <X size={24} color="#3F8CFF" as="+" />
            <span>{"Qo'shish"}</span>
          </button>
        </div>
        <h1 className="title-page">Maxsulotlar</h1>
        <div className="filters-container">
          <Switch
            checked={openFilter}
            onChange={(checked) => {
              setOpenFilter(checked);
              if (!checked) {
                setFilters({
                  name: "",
                  minCostPrice: "",
                  maxCostPrice: "",
                  minSalePrice: "",
                  maxSalePrice: "",
                  minQuantity: "",
                  maxQuantity: "",
                  unit: "",
                });
              }
            }}
            label={"Filtrlar"}
          />
        </div>
        {openFilter ? (
          <div className="filters-container" style={{ marginBottom: 16 }}>
            {/* 1-Qator: Nomi, Partiya, Birlik */}
            <div className="row-form">
              <Input
                label="Nomi"
                placeholder="Mahsulot nomi"
                value={filters.name}
                onChange={(e) => handleNameFilterChange(e.target.value)}
                style={{ minWidth: 120 }}
              />
              {/* <SearchSelect
                label="Partiya"
                options={[
                  { label: "Barchasi", value: "" },
                  ...batches.map((b) => ({
                    label: b.batch_number,
                    value: b.batch_number,
                  })),
                ]}
                value={filters.batch_number}
                onChange={(v) => setFilters((f) => ({ ...f, batch_number: v }))}
                style={{ minWidth: 120 }}
              /> */}
              <SearchSelect
                label="Birlik"
                options={[
                  { label: "Barchasi", value: "" },
                  { label: "kg", value: "kg" },
                  { label: "litr", value: "litr" },
                  { label: "dona", value: "dona" },
                ]}
                value={filters.unit}
                onChange={(v) => setFilters((f) => ({ ...f, unit: v }))}
                style={{ minWidth: 100 }}
              />
            </div>

            {/* 2-Qator: Narxlar */}
            <div className="row-form">
              <Input
                label="Tannarx (min)"
                type="number"
                step="0.01"
                value={filters.minCostPrice}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, minCostPrice: e.target.value }))
                }
                style={{ minWidth: 100 }}
              />
              <Input
                label="Tannarx (max)"
                type="number"
                step="0.01"
                value={filters.maxCostPrice}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, maxCostPrice: e.target.value }))
                }
                style={{ minWidth: 100 }}
              />
              <Input
                label="Sotish narxi (min)"
                type="number"
                step="0.01"
                value={filters.minSalePrice}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, minSalePrice: e.target.value }))
                }
                style={{ minWidth: 100 }}
              />
              <Input
                label="Sotish narxi (max)"
                type="number"
                step="0.01"
                value={filters.maxSalePrice}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, maxSalePrice: e.target.value }))
                }
                style={{ minWidth: 100 }}
              />
            </div>

            {/* 3-Qator: Miqdor, valyuta, filial, sotuvga qo'yilgan va tozalash */}
            <div className="row-form">
              <Input
                label="Miqdori (min)"
                type="number"
                step="0.01"
                value={filters.minQuantity}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, minQuantity: e.target.value }))
                }
                style={{ minWidth: 100 }}
              />
              <Input
                label="Miqdori (max)"
                type="number"
                step="0.01"
                value={filters.maxQuantity}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, maxQuantity: e.target.value }))
                }
                style={{ minWidth: 100 }}
              />

              <SearchSelect
                label="Sotuvga qo'yilgan"
                options={[
                  { label: "Barchasi", value: "" },
                  { label: "Ha", value: "true" },
                  { label: "Yo'q", value: "false" },
                ]}
                value={filters.isAvailable}
                onChange={(v) => setFilters((f) => ({ ...f, isAvailable: v }))}
                style={{ minWidth: 120 }}
              />

              <button
                type="button"
                className="btn secondary"
                style={{ alignSelf: "flex-end", marginLeft: 8 }}
                onClick={resetFilters}
              >
                Tozalash
              </button>
            </div>
          </div>
        ) : null}
        <div style={{ marginBottom: 12 }}>
          <div className="filters-container">
            <Switch
              checked={openedColumns}
              onChange={(checked) => {
                setOpenedColumns(checked);
              }}
              label={"Ro'yxatdagi ustunlar"}
            />
          </div>

          {openedColumns && (
            <div className="row-form filters-container">
              {allColumns
                .filter((col) => col.key !== "actions")
                .map((col) => (
                  <Switch
                    key={col.key}
                    checked={visibleColumns.includes(col.key)}
                    onChange={(checked) => {
                      setVisibleColumns((prev) =>
                        checked
                          ? [...prev, col.key]
                          : prev.filter((key) => key !== col.key)
                      );
                    }}
                    label={col.title}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Информация о фильтрации */}
        {Object.values(filters).some((value) => value !== "") && (
          <div style={{ marginBottom: 12, fontSize: 14, color: "#666" }}>
            Филтрланган натижалар: {filteredProducts.length} та ({totalCount}{" "}
            тадан)
          </div>
        )}

        <Table
          columns={columns}
          data={filteredProducts}
          onRowClick={(row) => console.log(row)}
          sortable={true}
          pagination={false}
          onSort={handleSortChange}
          pageSize={limit}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          totalCount={totalCount}
          totalPages={totalPages}
          loading={tableLoading || loading}
        />

        {/* Пагинация */}
        {totalPages > 1 && (
          <div
            className="pagination-container"
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span>Nechtadan ko'rish:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                style={{
                  padding: "4px 8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || tableLoading}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: currentPage === 1 ? "#f5f5f5" : "#fff",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                Oldinga
              </button>

              <span
                style={{
                  margin: "0 15px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <input
                  min="1"
                  max={totalPages}
                  placeholder="№"
                  title="Sahifa raqamini kiriting va Enter bosing"
                  value={pageInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    // Ограничиваем ввод только цифрами
                    if (value === "" || /^[1-9]\d*$/.test(value)) {
                      setPageInput(value);
                    }
                  }}
                  onKeyPress={handleDirectPageChange}
                  onBlur={() => {
                    if (pageInput == currentPage) return;
                    const page = Number(pageInput);
                    if (page >= 1 && page <= totalPages) {
                      handlePageChange(page);
                    } else {
                      setPageInput(currentPage.toString());
                    }
                  }}
                  style={{
                    width: "60px",
                    padding: "4px 8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                />
                / {totalPages} ({totalCount} ta maxsulot)
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || tableLoading}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor:
                    currentPage === totalPages ? "#f5f5f5" : "#fff",
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
                }}
              >
                Keyingi
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Product Form */}
      <form
        onSubmit={handleSubmitProduct(onSubmit)}
        className={`driwer-form${opened ? " opened" : ""}`}
      >
        <div className="form-body">
          <div className="page-header">
            <Upload />
            <span>{editId ? "Yangilash" : "Qo'shish"}</span>
            <button
              onClick={() => {
                setOpened(false);
                setEditId(null);
                resetProduct();
              }}
              type="button"
            >
              <X size={24} color="#3F8CFF" />
              <span>Yopish</span>
            </button>
          </div>
          <div className="row-form">
            <Input
              label="Mahsulot nomi"
              error={errorsProduct.name?.message}
              placeholder="Mahsulot nomi"
              {...registerProduct("name", { required: "Majburiy" })}
              disabled={loading}
            />
            <Input
              label="Tannarx"
              error={errorsProduct.costPrice?.message}
              placeholder="Tannarx (masalan: 3.5)"
              type="number"
              step="0.01"
              {...registerProduct("costPrice", {
                required: "Majburiy",
                min: 0,
                valueAsNumber: true,
              })}
              disabled={loading}
            />
            <Input
              label="Sotish narxi"
              error={errorsProduct.salePrice?.message}
              placeholder="Sotish narxi (masalan: 10.6)"
              type="number"
              step="0.01"
              {...registerProduct("salePrice", {
                required: "Majburiy",
                min: 0,
                valueAsNumber: true,
                validate: (value) => {
                  const costPrice = watchProduct("costPrice");
                  return (
                    Number(value) >= Number(costPrice) ||
                    "Sotish narxi tannarxdan kam bo'lmasligi kerak"
                  );
                },
              })}
              disabled={loading}
            />
          </div>
          <div className="row-form">
            <Input
              label="Miqdori"
              error={errorsProduct.quantity?.message}
              placeholder="Miqdori"
              type="number"
              step="0.01"
              {...registerProduct("quantity", { required: "Majburiy", min: 0 })}
              disabled={loading}
            />
            <Input
              label="Minimal miqdor"
              error={errorsProduct.minQuantity?.message}
              placeholder="Minimal miqdor"
              type="number"
              step="0.01"
              {...registerProduct("minQuantity", {
                required: "Majburiy",
                min: 0,
              })}
              disabled={loading}
            />
            <SearchSelect
              label="Birlik"
              options={[
                { label: "kg", value: "kg" },
                { label: "litr", value: "litr" },
                { label: "dona", value: "dona" },
                // ...добавьте нужные единицы
              ]}
              onChange={(v) => setValueProduct("unit", v)}
              value={watchProduct("unit") || ""}
              disabled={loading}
            />
          </div>
          <div className="row-form">
            <Input
              label="Tavsif"
              placeholder="Mahsulot haqida qisqacha ma'lumot"
              type="text"
              {...registerProduct("description")}
              value={watchProduct("description") || ""}
              onChange={(e) => setValueProduct("description", e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="row-form">
            <button
              type="reset"
              className="btn secondary"
              onClick={() => {
                resetProduct();
                setEditId(null);
              }}
              disabled={loading}
            >
              <span>Tozalash</span>
            </button>
            <Switch
              label="Sotuvga qo'yilgan"
              checked={watchProduct("isAvailable")}
              onChange={(checked) => setValueProduct("isAvailable", checked)}
            />
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? <span>Yuklanmoqda...</span> : <span>Saqlash</span>}
            </button>
          </div>
        </div>
      </form>
      {/* Batch Form */}
      {/* <form
        onSubmit={handleSubmitBatch(onBatchSubmit)}
        className={`driwer-form${openedBatch ? " opened" : ""}`}
      >
        <div className="form-body">
          <div className="page-header">
            <Upload />
            <span>Partiya {editBatchId ? "yangilash" : "qo'shish"}</span>
            <button
              onClick={() => {
                setOpenedBatch(false);
                setEditBatchId(null);
                resetBatch();
              }}
              type="button"
            >
              <X size={24} color="#3F8CFF" />
              <span>Yopish</span>
            </button>
          </div>
          <div className="row-form">
            <Input
              label="Partiya raqami"
              placeholder="Partiya raqami"
              {...registerBatch("batch_number", {
                required: "Partiya raqami majburiy",
              })}
              value={watchBatch("batch_number")?.toUpperCase()}
              onChange={(e) =>
                setValueBatch("batch_number", e.target.value.toUpperCase())
              }
              error={errorsBatch.batch_number?.message}
              disabled={loading}
            />
          </div>
          <div className="row-form">
            <button
              type="reset"
              className="btn secondary"
              onClick={() => {
                resetBatch();
                setEditBatchId(null);
              }}
              disabled={loading}
            >
              <span>Tozalash</span>
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              <span>Saqlash</span>
            </button>
          </div>
          <div className="row-form">
            <Table
              columns={batchColumns}
              data={batches}
              onRowClick={(row) => console.log(row)}
              sortable={true}
              pagination={true}
              pageSize={10}
              tableLoading={tableLoading}
            />
          </div>
        </div>
      </form> */}
    </div>
  );
};

export default Warehouse;
