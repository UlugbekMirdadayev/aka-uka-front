import React from "react";
import { useForm } from "react-hook-form";
import Input from "../components/Input";
import { X, Loader } from "../assets/icons";
import api from "../services/api";
import { toast } from "react-toastify";

const CarForm = ({ onSuccess, onCancel }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      const res = await api.post("cars", { name: values.name });
      toast.success("Model muvaffaqiyatli qo'shildi!");
      setValue("name", ""); // Очищаем форму модели после успешного создания
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      toast.error(
        "Model qo'shishda xatolik: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <div>
      <div className="page-header">
        <span>Yangi model qo'shish</span>
        <button
          type="button"
          onClick={onCancel}
          //   style={{ marginLeft: "auto" }}
        >
          <X size={24} color="#3F8CFF" />
        </button>
      </div>
      <div className="row-form">
        <Input
          label="Model nomi"
          placeholder="Masalan, Nexia 3"
          {...register("name", { required: "Model nomi majburiy" })}
          onChange={(e) => setValue("name", e.target.value?.toUpperCase())}
          error={errors.name?.message}
          disabled={isSubmitting}
        />
      </div>
      <div className="row-form">
        <button
          type="button"
          className="btn primary"
          disabled={isSubmitting}
          style={{ width: "100%", marginTop: 20 }}
          onClick={handleSubmit(onSubmit)}
        >
          {isSubmitting ? <Loader size={24} /> : "Saqlash"}
        </button>
      </div>
    </div>
  );
};

export default CarForm;
