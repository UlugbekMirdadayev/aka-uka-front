import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import Input from "../components/Input";
import Table from "../components/Table";
import {
  X,
  Upload,
  Trash,
  Pen,
  UserGroup,
  Loader,
  EyeIcon,
} from "../assets/icons";
import "../styles/warehouse.css";
import api from "../services/api";
import { toast } from "react-toastify";
import Modal from "../components/Modal";
import Switch from "../components/Switch";

const Clients = () => {
  const [opened, setOpened] = useState(false);
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // new state for tabs
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [openClient, setOpenClient] = useState(false);
  const [client, setClient] = useState({});
  const [clientFilter, setClientFilter] = useState({
    branch: "",
    name: "",
    carModel: "",
    carPlate: "",
    phone: "",
    birthday: "",
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
    setFocus,
  } = useForm({
    defaultValues: {
      fullName: "",
      phone: "+998",
      clientType: "Oddiy",
      description: "",
      password: "",
      branch: "",
      birthday: "",
      cars: [],
    },
  });

  const { replace: replaceCars } = useFieldArray({
    control,
    name: "cars",
  });

  const fetchClients = async () => {
    setTableLoading(true);
    try {
      const res = await api.get("clients");
      setClients(res.data || []);
    } catch (err) {
      toast.error(
        "Mijozlarni yuklashda xatolik: " +
          (err?.response?.data?.message || "Noma'lum xatolik yuz berdi")
      );
    } finally {
      setTableLoading(false);
    }
  };

  const createClient = async (client) => {
    const res = await api.post("clients", client);
    return res.data;
  };

  const updateClient = async (id, client) => {
    const res = await api.patch(`clients/${id}`, client);
    return res.data;
  };

  const deleteClient = async (id) => {
    const res = await api.delete(`clients/${id}`);
    return res.data;
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Map frontend form to backend model
  const mapFormToBackend = (data) => ({
    fullName: data.fullName,
    phone: data.phone ? data.phone.replace(/\D/g, "") : "",
    notes: data.description,
    branch: data.branch || null,
    password: data.password || "123456",
    birthday: data.birthday || undefined,
    cars: (data.cars || []).map((car) => {
      // Автоматический расчет monthlyKm из dailyKm если monthlyKm не указан
      let calculatedMonthlyKm = undefined;
      if (
        car.monthlyKm === undefined ||
        car.monthlyKm === null ||
        car.monthlyKm === ""
      ) {
        // Если monthlyKm не указан, но есть dailyKm - рассчитываем
        if (
          car.dailyKm !== undefined &&
          car.dailyKm !== null &&
          car.dailyKm !== ""
        ) {
          calculatedMonthlyKm = Number(car.dailyKm) * 30; // 30 дней в месяце
        }
      } else {
        calculatedMonthlyKm = Number(car.monthlyKm);
      }

      return {
        model: car.model?._id || car.model,
        plateNumber: car.plateNumber,
        dailyKm:
          car.dailyKm !== undefined &&
          car.dailyKm !== null &&
          car.dailyKm !== ""
            ? Number(car.dailyKm)
            : undefined,
        monthlyKm: calculatedMonthlyKm,
      };
    }),
  });

  // When opening the drawer for edit, set default values
  const handleEdit = (row) => {
    setEditing(row);
    setOpened(true);
    setValue("fullName", row.fullName || "");
    setValue("phone", formatPhoneNumber(row.phone));
    setValue("branch", row.branch?._id || "");
    setValue("clientType", "Oddiy");
    setValue("description", row.notes || "");
    setValue("password", "");
    setValue("birthday", row.birthday ? row.birthday.slice(0, 10) : "");
    replaceCars(
      Array.isArray(row.cars)
        ? row.cars.map((car) => ({
            model: car?.model?._id || "",
            plateNumber: car?.plateNumber || "",
            dailyKm: car?.dailyKm || "",
            monthlyKm: car?.monthlyKm || "",
          }))
        : []
    );
  };

  const handleDrawerClose = () => {
    setOpened(false);
    setEditing(null);
    reset();
    replaceCars([]);
  };

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const backendData = mapFormToBackend(values);
      if (editing) {
        await updateClient(editing._id, backendData);
        toast.success("Mijoz muvaffaqiyatli yangilandi");
      } else {
        await createClient(backendData);
        toast.success("Mijoz muvaffaqiyatli qo'shildi");
      }
      await fetchClients();
      reset();
      replaceCars([]);
      setEditing(null);
      setOpened(false);
    } catch (err) {
      toast.error(
        "Mijozni saqlashda xatolik: " +
          (err?.response?.data?.message || "Noma'lum xatolik yuz berdi")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    if (window.confirm("O'chirishni xohlaysizmi?")) {
      setLoading(true);
      try {
        await deleteClient(row._id);
        toast.success("Mijoz muvaffaqiyatli o'chirildi");
        await fetchClients();
      } catch (err) {
        toast.error(
          "Mijozni o'chirishda xatolik: " +
            (err?.response?.data?.message || "Noma'lum xatolik yuz berdi")
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Phone formatting helpers
  const formatPhoneNumber = (value) => {
    if (!value) return "+998 ";
    const cleaned = value.replace(/\D/g, "");
    const hasCountryCode = cleaned.startsWith("998");
    const digits = hasCountryCode ? cleaned.substring(3) : cleaned;
    const match = digits.match(/^(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})$/);
    if (!match) return "+998 ";
    let formatted = "+998";
    if (match[1]) formatted += ` ${match[1]}`;
    if (match[2]) formatted += ` ${match[2]}`;
    if (match[3]) formatted += ` ${match[3]}`;
    if (match[4]) formatted += ` ${match[4]}`;
    return formatted;
  };

  const handlePhoneChange = (e) => {
    const input = e.target.value;
    const numericValue = input.replace(/\D/g, "");
    const phoneValue = numericValue.startsWith("998")
      ? numericValue
      : "998" + numericValue;
    const formattedValue = formatPhoneNumber(phoneValue);
    setValue("phone", formattedValue, {
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  const columns = [
    {
      key: "fullName",
      title: "F.I.Sh",
      render: (v) => v?.toUpperCase() || "-",
    },
    {
      key: "phone",
      title: "Telefon raqam",
      render: (_, row) => formatPhoneNumber(row.phone) || "-",
    },
    {
      key: "birthday",
      title: "Tug'ilgan kuni",
      render: (v) => (v ? new Date(v).toLocaleDateString() : "-"),
    },

    {
      key: "debt",
      title: "Umumiy qarzi",
      render: (debt) =>
        debt?.uzs || debt?.usd ? (
          <>
            {debt?.uzs ? <span>{debt?.uzs?.toLocaleString()} so'm</span> : null}
            {debt?.usd ? (
              <span style={{ marginLeft: "8px" }}>
                {debt?.usd?.toLocaleString()} $
              </span>
            ) : null}
          </>
        ) : (
          <span>Qarz yo'q</span>
        ),
    },
    { key: "notes", title: "Izoh" },
    {
      key: "cars",
      title: "Avtomobillari",
      render: (_, row) =>
        row.cars && row.cars.length > 0
          ? row.cars
              .map((car) => {
                return `${car.model?.name ? car.model?.name : ""} [${
                  car.plateNumber
                }]`;
              })
              .join(", ")
          : "-",
    },
    {
      title: "Amallar",
      render: (_, row) => (
        <div className="actions-row">
          <button
            type="button"
            onClick={() => handleEdit(row)}
            disabled={loading}
          >
            <Pen />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row)}
            disabled={loading}
          >
            <Trash />
          </button>
          <button
            type="buttun"
            onClick={() => {
              setOpenClient(true);
              setClient(clients.find((i) => i._id === row._id));
            }}
          >
            <EyeIcon />
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (opened) setFocus("fullName");
  }, [opened, setFocus]);

  const filteredClients = clients.filter((client) => {
    const branchFilter = clientFilter.branch?.trim().toLowerCase();
    const nameFilter = clientFilter.name?.trim().toLowerCase();
    const phoneFilter = clientFilter.phone?.replace(/\D/g, "");
    const carModelFilter = clientFilter.carModel?.trim().toLowerCase();
    const carPlateFilter = clientFilter.carPlate?.trim().toLowerCase();
    const birthdayFilter = clientFilter.birthday;

    const matchesBranch =
      !branchFilter || client.branch?.name?.toLowerCase() === branchFilter;

    const matchesName =
      !nameFilter || client.fullName?.toLowerCase().includes(nameFilter);

    const matchesPhone =
      !phoneFilter || client.phone?.replace(/\D/g, "").includes(phoneFilter);

    const matchesCarModel =
      !carModelFilter ||
      client.cars?.some((car) => {
        const modelName = car.model?.name?.toLowerCase() || "";
        return modelName.includes(carModelFilter);
      });

    const matchesCarPlate =
      !carPlateFilter ||
      client.cars?.some((car) => {
        const plate = car.plateNumber?.toLowerCase() || "";
        return plate.includes(carPlateFilter);
      });

    const matchesBirthday =
      !birthdayFilter ||
      (client.birthday && client.birthday.slice(0, 10) === birthdayFilter);

    return (
      matchesBranch &&
      matchesName &&
      matchesPhone &&
      matchesCarModel &&
      matchesCarPlate &&
      matchesBirthday
    );
  });

  return (
    <div className="page row-warehouse">
      <div className="page-details">
        <div className="page-header">
          <UserGroup />
          <span>Mijozlar</span>
          <button
            onClick={() => {
              setOpened(true);
              setEditing(null);
              reset();
              replaceCars([]);
            }}
            disabled={loading}
          >
            <X size={24} color="#3F8CFF" as="+" />
            <span>Qo'shish</span>
          </button>
        </div>
        <div className="filters-container">
          <div className="row-form">
            <Input
              label="F.I.SH"
              value={clientFilter.name}
              onChange={(v) =>
                setClientFilter((f) => ({ ...f, name: v.target.value }))
              }
            />
            <Input
              label="Mashina modeli"
              placeholder="Masalan: Nexia"
              value={clientFilter.carModel}
              onChange={(v) =>
                setClientFilter((f) => ({ ...f, carModel: v.target.value }))
              }
            />
            <Input
              label="Mashina raqami"
              placeholder="Masalan: 001"
              value={clientFilter.carPlate}
              onChange={(v) =>
                setClientFilter((f) => ({ ...f, carPlate: v.target.value }))
              }
            />
            <Input
              label="Tug'ilgan kuni"
              type="date"
              value={clientFilter.birthday}
              onChange={(v) =>
                setClientFilter((f) => ({ ...f, birthday: v.target.value }))
              }
              style={{ minWidth: 160 }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              <button
                className="btn secondary"
                onClick={() => {
                  setClientFilter({
                    branch: "",
                    name: "",
                    carModel: "",
                    carPlate: "",
                    phone: "998",
                    birthday: "",
                  });
                }}
                disabled={loading}
              >
                <span>Tozalash</span>
              </button>
            </div>
          </div>
        </div>
        <div
          className="client-tabs"
          style={{ marginBottom: "20px", borderBottom: "1px solid #eee" }}
        >
          <button
            onClick={() => setActiveTab("all")}
            style={{
              padding: "8px 16px",
              marginRight: "8px",
              border: "none",
              background: "none",
              borderBottom: activeTab === "all" ? "2px solid #3F8CFF" : "none",
              color: activeTab === "all" ? "#3F8CFF" : "#666",
              fontWeight: activeTab === "all" ? "bold" : "normal",
              cursor: "pointer",
            }}
          >
            Barcha mijozlar
          </button>
        </div>

        <Table
          columns={columns}
          data={filteredClients}
          onRowClick={(row) => console.log(row)}
          sortable={true}
          pagination={true}
          pageSize={10}
          tableLoading={tableLoading}
        />
        {openClient ? (
          <Modal
            onClose={() => setOpenClient(false)}
            modalStyle={{ width: 800 }}
            opened={openClient}
          >
            <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "bold",
                  marginBottom: "15px",
                }}
              >
                Mijoz ma'lumotlari
              </h2>

              <div style={{ marginBottom: "15px" }}>
                <p>
                  <strong>Ismi:</strong> {client.fullName}
                </p>
                <p>
                  <strong>Telefon:</strong> {client.phone}
                </p>
                <p>
                  <strong>Tug‘ilgan kuni:</strong>{" "}
                  {new Date(client.birthday).toLocaleDateString()}
                </p>
                <p>
                  <strong>Izoh:</strong> {client.notes || "Yo‘q"}
                </p>
                <p>
                  <strong>VIP:</strong> {client.isVip ? "Ha" : "Yo‘q"}
                </p>
                <p>
                  <strong>Qarz:</strong> {client.debt?.uzs?.toLocaleString()}{" "}
                  so‘m ({client.debt?.usd?.toLocaleString()} $)
                </p>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <h3 style={{ fontWeight: "bold", marginBottom: "8px" }}>
                  Avtomobillar:
                </h3>
                {client.cars.map((car, index) => (
                  <div
                    key={car._id}
                    style={{
                      paddingLeft: "15px",
                      borderLeft: "2px solid #ccc",
                      marginBottom: "10px",
                    }}
                  >
                    <p>
                      <strong>Avto #{index + 1}</strong>
                    </p>
                    <p>Davlat raqami: {car.plateNumber}</p>
                    <p>Kundalik km: {car.dailyKm}</p>
                    <p>Oylik km: {car.monthlyKm}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 style={{ fontWeight: "bold", marginBottom: "8px" }}>
                  Filial:
                </h3>
                <p>Nomi: {client.branch?.name}</p>
                <p>Manzil: {client.branch?.address}</p>
              </div>
            </div>
          </Modal>
        ) : null}

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
            <span>{editing ? "Mijozni tahrirlash" : "Yangi mijoz"}</span>
            <button
              type="button"
              onClick={handleDrawerClose}
              disabled={loading}
            >
              <X size={24} color="#3F8CFF" />
              <span>Yopish</span>
            </button>
          </div>
          <div className="row-form">
            <Input
              label="F.I.Sh"
              error={errors.fullName?.message}
              placeholder="F.I.Sh"
              {...register("fullName", { required: "Ism-familya majburiy" })}
              disabled={loading}
            />

            <Input
              {...register("phone", {
                pattern: {
                  value: /^\+998 \d{2} \d{3} \d{2} \d{2}$/,
                  message:
                    "Telefon raqami +998 bilan boshlanishi\nva 9 ta raqamdan iborat bo‘lishi kerak",
                },
                required: true,
              })}
              label="Telefon raqamingiz"
              placeholder="+998 90 123 45 67"
              error={errors.phone?.message}
              value={watch("phone")}
              onChange={handlePhoneChange}
              disabled={loading}
            />
            <Input
              label="Tug'ilgan kuni"
              type="date"
              {...register("birthday", { required: false })}
              value={watch("birthday") || ""}
              onChange={(e) => setValue("birthday", e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="row-form">
            <Input label="Mijoz turi" value="Oddiy" disabled={true} />
          </div>
          <div className="row-form">
            <Input
              label="Izoh"
              error={errors.description?.message}
              placeholder="Izoh"
              {...register("description")}
              disabled={loading}
            />
            <div style={{ width: "100%" }}>
              <Switch
                label="Yangi parol"
                checked={watch("isPasswordVisible")}
                onChange={() =>
                  setValue("isPasswordVisible", !watch("isPasswordVisible"))
                }
              />
              <Input
                type="password"
                placeholder="Yangi parol"
                {...register("password", {
                  minLength: {
                    value: 6,
                    message: "Parol kamida 6 ta belgidan iborat bo‘lishi kerak",
                  },
                })}
                readonly={!watch("isPasswordVisible")}
                error={errors.password?.message}
                disabled={loading || !watch("isPasswordVisible")}
              />
            </div>
          </div>

          <div className="row-form">
            <button
              type="reset"
              className="btn secondary"
              onClick={handleDrawerClose}
              disabled={loading}
            >
              <span>Tozalash</span>
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? (
                <Loader size={24} />
              ) : (
                <span>{editing ? "Saqlash" : "Saqlash"}</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Clients;
