import { useCallback, useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import Input from "./Input";
import SearchSelect from "./SearchSelect";
import { X, Trash, Loader } from "../assets/icons";
import api from "../services/api";
import { toast } from "react-toastify";

const ClientForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [cars, setCars] = useState([]);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      phone: "",
      clientType: "Oddiy",
      description: "",
      password: "",
      branch: branches?.[0]?._id || "",
      birthday: "",
      cars: [],
    },
  });

  const {
    fields: carFields,
    append: appendCar,
    remove: removeCar,
    replace: replaceCars,
  } = useFieldArray({
    control,
    name: "cars",
  });

  const fetchBranches = useCallback(async () => {
    try {
      const res = await api.get("branches");
      setBranches(res.data || []);
      setValue("branch", res.data?.[0]?._id || "");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Filiallarni yuklashda xatolik";
      toast.error(errorMessage);
    }
  }, [setValue]);
  const fetchCars = useCallback(async () => {
    try {
      const res = await api.get("cars");
      setCars(res.data || []);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Mashinalarni yuklashda xatolik";
      toast.error(errorMessage);
    }
  }, [setCars]);

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

  const onSubmit = async (values) => {
    // VIP mijoz uchun mashinalarni tozalaymiz
    if (watch("clientType") === "VIP") {
      replaceCars([]);
      values.cars = [];
    } else {
      const invalidCars = values.cars.some(
        (car) => !car.model || !car.plateNumber
      );
      if (invalidCars) {
        toast.error(
          "Barcha avtomobillar uchun model va davlat raqami to'ldirilishi kerak"
        );
        return;
      }
    }

    setLoading(true);
    try {
      const backendData = {
        fullName: values.fullName,
        phone: values.phone ? values.phone.replace(/\D/g, "") : "",
        isVip: values.clientType === "VIP",
        notes: values.description,
        debt: Number(values.debt) || 0,
        branch: values.branch,
        password: values.password || "123456",
        birthday: values.birthday || null,
        cars: (values.cars || []).map((car) => {
          // Автоматический расчет monthlyKm из dailyKm если monthlyKm не указан
          let calculatedMonthlyKm = undefined;
          if (
            car.monthlyKm === undefined ||
            car.monthlyKm === null ||
            car.monthlyKm === "" ||
            isNaN(Number(car.monthlyKm))
          ) {
            // Если monthlyKm не указан, но есть dailyKm - рассчитываем
            if (
              car.dailyKm !== undefined &&
              car.dailyKm !== null &&
              car.dailyKm !== "" &&
              !isNaN(Number(car.dailyKm))
            ) {
              calculatedMonthlyKm = Number(car.dailyKm) * 30; // 30 дней в месяце
            }
          } else {
            calculatedMonthlyKm = Number(car.monthlyKm);
          }

          return {
            model: car.model,
            plateNumber: car.plateNumber
              ? car.plateNumber.toUpperCase().trim()
              : "",
            dailyKm:
              car.dailyKm !== undefined &&
              car.dailyKm !== null &&
              car.dailyKm !== "" &&
              !isNaN(Number(car.dailyKm))
                ? Number(car.dailyKm)
                : undefined,
            monthlyKm: calculatedMonthlyKm,
          };
        }),
      };

      const res = await api.post("clients", backendData);
      toast.success("Mijoz muvaffaqiyatli qo'shildi!");
      onSuccess(res.data);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Mijoz qo'shishda xatolik";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchCars();
  }, [fetchBranches, fetchCars]);

  return (
    <div className="form-body" style={{ margin: 0, maxHeight: "unset" }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row-form">
          <Input
            label="F.I.Sh"
            error={errors.fullName?.message}
            placeholder="F.I.Sh kiriting"
            {...register("fullName", { required: "Ism-familya majburiy" })}
            disabled={loading}
          />

          <Input
            {...register("phone", {
              pattern: {
                value: /^\+998 \d{2} \d{3} \d{2} \d{2}$/,
                message: "Telefon raqami to'g'ri formatda bo'lishi kerak",
              },
              required: "Telefon raqami majburiy",
            })}
            label="Telefon raqamingiz"
            placeholder="+998 90 123 45 67"
            error={errors.phone?.message}
            value={watch("phone")}
            onChange={handlePhoneChange}
            disabled={loading}
          />
        </div>

        <div className="row-form">
          <SearchSelect
            label="Mijoz turi"
            options={[
              {
                label: "VIP",
                value: "VIP",
                style: {
                  backgroundColor: "#4CAF50",
                  color: "white",
                  fontWeight: "bold",
                },
              },
              {
                label: "Oddiy",
                value: "Oddiy",
                style: {
                  backgroundColor: "#2196F3",
                  color: "white",
                  fontWeight: "bold",
                },
              },
            ]}
            onChange={(v) => {
              setValue("clientType", v);
              if (v === "VIP") {
                // VIP bo'lganda mashinalarni tozalaymiz
                replaceCars([]);
                toast.info(
                  "VIP mijozlar uchun avtomobil ma'lumotlari saqlanmaydi"
                );
              } else if (v === "Oddiy" && carFields.length === 0) {
                // Oddiy bo'lganda bitta bo'sh mashina qo'shamiz
                appendCar({
                  model: "",
                  plateNumber: "",
                  dailyKm: "",
                  monthlyKm: "",
                });
              }
            }}
            value={watch("clientType")}
            disabled={loading}
          />
          <SearchSelect
            label="Filial"
            options={branches.map((b) => ({ label: b.name, value: b._id }))}
            onChange={(v) => setValue("branch", v)}
            value={watch("branch")}
            disabled={loading}
          />
          <Input
            label="Tug'ilgan sana"
            type="date"
            {...register("birthday")}
            error={errors.birthday?.message}
            disabled={loading}
          />
        </div>

        {watch("clientType") === "VIP" ? null : (
          <>
            <div
              style={{
                marginTop: 20,
                marginBottom: 12,
                padding: "16px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "#374151",
                  }}
                >
                  Avtomobillari
                </label>
                <button
                  type="button"
                  className="btn primary"
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  onClick={() =>
                    appendCar({
                      model: "",
                      plateNumber: "",
                      dailyKm: "",
                      monthlyKm: "",
                    })
                  }
                  disabled={loading || cars.length === 0}
                  title={
                    cars.length === 0
                      ? "Avval car modellarini yuklash kerak"
                      : "Yangi avtomobil qo'shish"
                  }
                >
                  <X as="+" size={16} />
                  <span>Avto qo'shish</span>
                </button>
              </div>

              {carFields.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "24px",
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  {cars.length === 0
                    ? "Avval car modellari yuklanishi kerak. Iltimos, kuting..."
                    : "Hozircha avtomobil qo'shilmagan. Yuqoridagi tugma orqali qo'shing."}
                </div>
              )}

              {carFields.map((car, idx) => (
                <div
                  key={car.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-end",
                    marginBottom: idx === carFields.length - 1 ? 0 : 12,
                    padding: "12px",
                    backgroundColor: "white",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      width: "100%",
                    }}
                  >
                    <Controller
                      control={control}
                      name={`cars.${idx}.model`}
                      rules={{ required: "Model majburiy" }}
                      render={({ field, fieldState }) => (
                        <SearchSelect
                          label="Modeli"
                          options={cars.map((b) => ({
                            label: b.name,
                            value: b._id,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          error={fieldState.error?.message}
                          disabled={loading}
                          style={{ minWidth: 120, marginTop: 0 }}
                          placeholder="Model tanlang..."
                        />
                      )}
                    />
                    <Input
                      label="Davlat raqami"
                      placeholder="Davlat raqami (AA123BBB)"
                      {...register(`cars.${idx}.plateNumber`, {
                        required: "Davlat raqami majburiy",
                        pattern: {
                          value: /^[A-Z0-9]{6,8}$/,
                          message: "Davlat raqami noto'g'ri formatda",
                        },
                      })}
                      error={errors.cars?.[idx]?.plateNumber?.message}
                      disabled={loading}
                      style={{ minWidth: 140, textTransform: "uppercase" }}
                      onChange={(e) => {
                        setValue(
                          `cars.${idx}.plateNumber`,
                          e.target.value.toUpperCase()
                        );
                      }}
                      value={watch(`cars.${idx}.plateNumber`)}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        width: "100%",
                      }}
                    >
                      <Input
                        label="Oylik km"
                        placeholder="Oylik km"
                        type="number"
                        min="0"
                        {...register(`cars.${idx}.monthlyKm`, {
                          min: {
                            value: 0,
                            message: "Manfiy qiymat bo'lishi mumkin emas",
                          },
                          valueAsNumber: true,
                        })}
                        error={errors.cars?.[idx]?.monthlyKm?.message}
                        value={watch(`cars.${idx}.monthlyKm`) || ""}
                        onChange={(e) =>
                          setValue(`cars.${idx}.monthlyKm`, e.target.value)
                        }
                        disabled={loading}
                      />
                      <Input
                        label="Kundalik km"
                        placeholder="Kunlik km"
                        type="number"
                        min="0"
                        {...register(`cars.${idx}.dailyKm`, {
                          min: {
                            value: 0,
                            message: "Manfiy qiymat bo'lishi mumkin emas",
                          },
                          valueAsNumber: true,
                        })}
                        error={errors.cars?.[idx]?.dailyKm?.message}
                        value={watch(`cars.${idx}.dailyKm`) || ""}
                        onChange={(e) =>
                          setValue(`cars.${idx}.dailyKm`, e.target.value)
                        }
                        style={{ minWidth: 100 }}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => removeCar(idx)}
                    disabled={loading}
                    style={{ height: 56 }}
                    title="Bu avtomobilni o'chirish"
                  >
                    <Trash size={16} color="#fff" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 24,
            justifyContent: "flex-end",
            paddingTop: 16,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            type="button"
            className="btn secondary"
            onClick={onCancel}
            disabled={loading}
            style={{ minWidth: 100 }}
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className="btn primary"
            disabled={loading}
            style={{ minWidth: 120 }}
          >
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Loader size={18} />
                <span>Saqlanmoqda...</span>
              </div>
            ) : (
              <span>Saqlash</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
