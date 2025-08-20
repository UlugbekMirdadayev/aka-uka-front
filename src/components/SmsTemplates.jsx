import React, { useState } from "react";
import { MessageSquare, Plus, Edit3, Trash2 } from "lucide-react";
import Modal from "./Modal";
import Input from "./Input";
import { useForm } from "react-hook-form";

const SmsTemplates = ({ onSelectTemplate }) => {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "Buyurtma tayyor",
      message:
        "Hurmatli mijoz! Sizning buyurtmangiz tayyor. Iltimos, {time} gacha olib keting. Tel: {phone}",
      variables: ["time", "phone"],
    },
    {
      id: 2,
      name: "To'lov eslatmasi",
      message:
        "Hurmatli {name}! Sizda {amount} so'm qarz bor. Iltimos, to'lovni amalga oshiring.",
      variables: ["name", "amount"],
    },
    {
      id: 3,
      name: "Tasdiqlash kodi",
      message:
        "Sizning tasdiqlash kodingiz: {code}. Bu kodni hech kimga bermang!",
      variables: ["code"],
    },
    {
      id: 4,
      name: "Xush kelibsiz",
      message:
        "Xush kelibsiz! Bizning xizmatlarimizdan foydalanganingiz uchun rahmat.",
      variables: [],
    },
  ]);

  const [templateOpened, setTemplateOpened] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      name: "",
      message: "",
    },
  });

  const message = watch("message");

  // Extract variables from message
  const extractVariables = (text) => {
    const matches = text.match(/\{([^}]+)\}/g);
    return matches ? matches.map((match) => match.slice(1, -1)) : [];
  };

  const currentVariables = extractVariables(message || "");

  const handleSaveTemplate = (data) => {
    const newTemplate = {
      id: editingTemplate ? editingTemplate.id : Date.now(),
      name: data.name,
      message: data.message,
      variables: currentVariables,
    };

    if (editingTemplate) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === editingTemplate.id ? newTemplate : t))
      );
    } else {
      setTemplates((prev) => [...prev, newTemplate]);
    }

    reset();
    setTemplateOpened(false);
    setEditingTemplate(null);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    reset({
      name: template.name,
      message: template.message,
    });
    setTemplateOpened(true);
  };

  const handleDeleteTemplate = (id) => {
    if (window.confirm("Shablonni o'chirshni xohlaysizmi?")) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleSelectTemplate = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  return (
    <div className="sms-templates">
      <div className="templates-header">
        <h3>SMS Shablonlari</h3>
        <button
          onClick={() => {
            setEditingTemplate(null);
            reset({ name: "", message: "" });
            setTemplateOpened(true);
          }}
          className="add-template-btn"
        >
          <Plus size={16} />
          Shablon qo'shish
        </button>
      </div>

      <div className="templates-grid">
        {templates.map((template) => (
          <div key={template.id} className="template-card">
            <div className="template-header">
              <MessageSquare size={16} color="#667eea" />
              <h4>{template.name}</h4>
            </div>

            <div className="template-message">{template.message}</div>

            {template.variables.length > 0 && (
              <div className="template-variables">
                <span>O'zgaruvchilar:</span>
                <div className="variables-list">
                  {template.variables.map((variable) => (
                    <span key={variable} className="variable-tag">
                      {`{${variable}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="template-actions">
              <button
                onClick={() => handleSelectTemplate(template)}
                className="use-template-btn"
              >
                Ishlatish
              </button>

              <button
                onClick={() => handleEditTemplate(template)}
                className="edit-template-btn"
              >
                <Edit3 size={14} />
              </button>

              <button
                onClick={() => handleDeleteTemplate(template.id)}
                className="delete-template-btn"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Template Modal */}
      <Modal
        opened={templateOpened}
        onClose={() => {
          setTemplateOpened(false);
          setEditingTemplate(null);
          reset();
        }}
        title={editingTemplate ? "Shablonni tahrirlash" : "Yangi shablon"}
      >
        <form
          onSubmit={handleSubmit(handleSaveTemplate)}
          className="template-form"
        >
          <Input
            label="Shablon nomi"
            placeholder="Masalan: Buyurtma tayyor"
            {...register("name", {
              required: "Shablon nomi majburiy",
            })}
            error={errors.name?.message}
          />

          <div className="textarea-wrapper">
            <label>Xabar matni</label>
            <textarea
              {...register("message", {
                required: "Xabar matni majburiy",
                maxLength: {
                  value: 918,
                  message: "Xabar 918 belgidan oshmasligi kerak",
                },
              })}
              placeholder="Xabar matnini kiriting. O'zgaruvchilar uchun {variable} formatidan foydalaning"
              rows={5}
              className={errors.message ? "error" : ""}
            />
            {errors.message && (
              <span className="error-message">{errors.message.message}</span>
            )}
          </div>

          {currentVariables.length > 0 && (
            <div className="detected-variables">
              <label>Aniqlangan o'zgaruvchilar:</label>
              <div className="variables-preview">
                {currentVariables.map((variable) => (
                  <span key={variable} className="variable-preview">
                    {`{${variable}}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="template-help">
            <h5>Yordam:</h5>
            <ul>
              <li>
                O'zgaruvchilar uchun {`{variable_name}`} formatidan foydalaning
              </li>
              <li>Masalan: {`{name}, {phone}, {amount}, {time}, {code}`}</li>
              <li>O'zgaruvchilar avtomatik aniqlanadi</li>
            </ul>
          </div>

          <button type="submit" className="save-template-btn">
            {editingTemplate ? "Yangilash" : "Saqlash"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default SmsTemplates;
