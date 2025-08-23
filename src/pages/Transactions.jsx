import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import moment from "moment/min/moment-with-locales";
import Input from "../components/Input";
import Table from "../components/Table";
import { X, Upload, Trash, Pen, Loader, Folder } from "../assets/icons";
import api from "../services/api";
import SearchSelect from "../components/SearchSelect";
import "../styles/warehouse.css";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [clients, setClients] = useState([]);

  // Состояния для фильтров
  const [filters, setFilters] = useState({
    type: "",
    paymentType: "",
    amount: "",
    client: "",
    branch: "",
    description: "",
    dateFrom: "",
    dateTo: "",
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
    setFocus,
  } = useForm({
    defaultValues: {
      type: "cash-in",
      paymentType: "cash",
      amount: "",
      description: "",
      client: "",
      branch: "",
    },
  });

  const getTransactionTypeLabel = (type) => {
    const typeLabels = {
      "cash-in": "Kirim",
      "cash-out": "Chiqim",
      order: "Buyurtma",
      service: "Xizmat",
      "debt-payment": "Qarz to'lovi",
      "debt-created": "Qarz yaratildi",
    };
    return typeLabels[type] || type;
  };

  const getPaymentTypeLabel = (paymentType) => {
    const paymentLabels = {
      cash: "Naqd",
      card: "Karta",
      debt: "Qarz",
    };
    return paymentLabels[paymentType] || paymentType;
  };

  const getClients = useCallback(async () => {
    try {
      const { data } = await api.get("/clients");
      setClients(data || []);
    } catch (err) {
      console.log(err);
    }
  }, []);

  const getTransactions = useCallback(async () => {
    setTableLoading(true);
    try {
      let endpoint = "/transactions";

      const { data } = await api.get(endpoint);
      setTransactions(data.transactions);
    } catch (err) {
      console.log(err);
      toast.error("Xatolik: tranzaksiyalarni yuklab bo'lmadi.");
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    getTransactions();
    getClients();
  }, [getTransactions, getClients]);

  const onSubmit = async (values) => {
    setLoading(true);
    const toastId = toast.loading("Saqlanmoqda...");
    try {
      const payload = {
        type: values.type,
        paymentType: values.paymentType,
        amount: Number(values.amount) || 0,
        description: values.description,
        client: values.client || null,
        branch: values.branch || null,
      };
      if (editing) {
        await api.put(`/transactions/${editing._id}`, payload);
        toast.update(toastId, {
          render: "Tranzaksiya yangilandi",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        const endpoint = values.type === "cash-in" ? "/cash-in" : "/cash-out";
        await api.post("/transactions" + endpoint, payload);
        toast.update(toastId, {
          render: "Tranzaksiya qo'shildi",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
      reset();
      setOpened(false);
      setEditing(null);
      getTransactions();
    } catch (err) {
      toast.update(toastId, {
        render:
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Xatolik yuz berdi",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Rostdan ham o'chirmoqchimisiz?")) {
      try {
        setLoading(true);
        await api.delete(`/transactions/${id}`);
        toast.success("Tranzaksiya o'chirildi");
        getTransactions();
      } catch (err) {
        console.log(err);
        toast.error("Xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    }
  };

  const editTransaction = (item) => {
    setEditing(item);
    setOpened(true);
    setValue("type", item.type);
    setValue("paymentType", item.paymentType);
    setValue("amount", item.amount || "");
    setValue("description", item.description || "");
    setValue("client", item.client?._id || "");
    setValue("branch", item.branch?._id || "");
  };

  useEffect(() => {
    if (opened) setFocus("amountUZS");
  }, [opened, setFocus]);

  const columns = [
    {
      key: "type",
      title: "Turi",
      render: (value) => getTransactionTypeLabel(value),
    },
    {
      key: "paymentType",
      title: "To'lov turi",
      render: (value) => getPaymentTypeLabel(value),
    },
    {
      key: "amount",
      title: "Miqdor",
      render: (_, row) => (row.amount ? row.amount.toLocaleString() : "-"),
    },
    {
      key: "client",
      title: "Mijoz",
      render: (_, row) => row.client?.fullName || "-",
    },
    {
      key: "description",
      title: "Izoh",
      render: (value) => value || "-",
    },
    {
      key: "createdAt",
      title: "Sana",
      render: (_, row) => moment(row.createdAt).format("DD.MM.YYYY HH:mm"),
    },
    {
      key: "createdBy",
      title: "Yaratuvchi",
      render: (_, row) => row.createdBy?.name || "-",
    },
    {
      title: "Amallar",
      render: (_, row) => (
        <div className="actions-row">
          <button onClick={() => editTransaction(row)} disabled={loading}>
            <Pen />
          </button>
          <button onClick={() => handleDelete(row._id)} disabled={loading}>
            <Trash />
          </button>
        </div>
      ),
    },
  ];

  // Функция фильтрации данных
  const filteredTransactions = transactions.filter((transaction) => {
    if (filters.type && transaction.type !== filters.type) return false;
    if (filters.paymentType && transaction.paymentType !== filters.paymentType)
      return false;
    if (
      filters.amount &&
      (!transaction.amount ||
        Number(transaction.amount) < Number(filters.amount))
    )
      return false;
    if (filters.client && transaction.client?._id !== filters.client)
      return false;
    if (filters.branch && transaction.branch?._id !== filters.branch)
      return false;
    if (
      filters.description &&
      !transaction.description
        ?.toLowerCase()
        .includes(filters.description.toLowerCase())
    )
      return false;
    if (
      filters.dateFrom &&
      moment(transaction.createdAt).isBefore(filters.dateFrom, "day")
    )
      return false;
    if (
      filters.dateTo &&
      moment(transaction.createdAt).isAfter(filters.dateTo, "day")
    )
      return false;
    return true;
  });

  return (
    <div className="page row-warehouse">
      <div className="page-details">
        <div className="page-header">
          <Folder />
          <span>Tranzaksiyalar</span>
          <button
            onClick={() => {
              reset();
              setEditing(null);
              setOpened(true);
            }}
            disabled={loading}
          >
            <X size={24} color="#3F8CFF" as="+" />
            <span>{editing ? "Tahrirlash" : "Yangi tranzaksiya"}</span>
          </button>
        </div>

        <div className="filters-container">
          <div className="row-form">
            <SearchSelect
              label="Turi"
              options={[
                { label: "Barchasi", value: "" },
                { label: "Kirim", value: "cash-in" },
                { label: "Chiqim", value: "cash-out" },
              ]}
              value={filters.type}
              onChange={(v) => setFilters({ ...filters, type: v })}
            />
            <SearchSelect
              label="To'lov turi"
              options={[
                { label: "Barchasi", value: "" },
                { label: "Naqd", value: "cash" },
                { label: "Karta", value: "card" },
                { label: "Qarz", value: "debt" },
              ]}
              value={filters.paymentType}
              onChange={(v) => setFilters({ ...filters, paymentType: v })}
            />
            <SearchSelect
              label="Mijoz"
              options={[
                { label: "Barchasi", value: "" },
                ...clients.map((client) => ({
                  label: client.fullName,
                  value: client._id,
                })),
              ]}
              value={filters.client}
              onChange={(v) => setFilters({ ...filters, client: v })}
            />
            <Input
              label="Minimal miqdor"
              type="number"
              step="0.01"
              placeholder="10000"
              value={filters.amount}
              onChange={(e) =>
                setFilters({ ...filters, amount: e.target.value })
              }
            />
            <Input
              label="Izoh bo'yicha"
              placeholder="Izoh"
              value={filters.description}
              onChange={(e) =>
                setFilters({ ...filters, description: e.target.value })
              }
            />
            <Input
              label="Boshlanish sanasi"
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters({ ...filters, dateFrom: e.target.value })
              }
            />
            <Input
              label="Tugash sanasi"
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters({ ...filters, dateTo: e.target.value })
              }
            />
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              <button
                type="button"
                className="btn secondary"
                onClick={() =>
                  setFilters({
                    type: "",
                    paymentType: "",
                    amount: "",
                    client: "",
                    branch: "",
                    description: "",
                    dateFrom: "",
                    dateTo: "",
                  })
                }
              >
                Tozalash
              </button>
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredTransactions}
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
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`driwer-form${opened ? " opened" : ""}`}
      >
        <div className="form-body">
          <div className="page-header">
            <Upload />
            <span>{editing ? "Tahrirlash" : "Yangi tranzaksiya"}</span>
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
            <SearchSelect
              label="Turi"
              options={[
                { label: "Kirim", value: "cash-in" },
                { label: "Chiqim", value: "cash-out" },
                { label: "Buyurtma", value: "order" },
                { label: "Xizmat", value: "service" },
                { label: "Qarz to'lovi", value: "debt-payment" },
                { label: "Qarz yaratildi", value: "debt-created" },
              ]}
              value={watch("type")}
              onChange={(v) => setValue("type", v)}
              disabled={loading}
            />
            <SearchSelect
              label="To'lov turi"
              options={[
                { label: "Naqd", value: "cash" },
                { label: "Karta", value: "card" },
                { label: "Qarz", value: "debt" },
              ]}
              value={watch("paymentType")}
              onChange={(v) => setValue("paymentType", v)}
              disabled={loading}
            />
          </div>

          <div className="row-form">
            <Input
              label="Miqdor"
              type="number"
              placeholder="10000"
              step="0.01"
              {...register("amount", {
                min: { value: 0, message: "0 dan katta bo'lishi kerak" },
              })}
              error={errors.amount?.message}
              disabled={loading}
            />
          </div>

          <div className="row-form">
            <SearchSelect
              label="Mijoz"
              options={[
                { label: "Tanlanmagan", value: "" },
                ...clients.map((client) => ({
                  label: client.fullName,
                  value: client._id,
                })),
              ]}
              value={watch("client")}
              onChange={(v) => setValue("client", v)}
              disabled={loading}
            />
          </div>

          <div className="row-form">
            <Input
              label="Izoh"
              placeholder="Izoh"
              {...register("description")}
              error={errors.description?.message}
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
              Tozalash
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? <Loader size={24} /> : <span>Saqlash</span>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Transactions;
