import React, { useState, useRef, useEffect } from "react";

const SearchSelect = ({
  options = [],
  value,
  onChange,
  label,
  placeholder = "Qidirish...",
  disabled,
  error,
  style,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef();
  const containerRef = useRef();

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Закрытие при клике вне
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Фокус на инпут при открытии
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleSelect = (val) => {
    onChange?.(val);
    setOpen(false);
    setSearch("");
  };

  const selectedLabel = options.find((opt) => opt.value === value)?.label || "";

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        position: "relative",
        ...style,
        fontFamily: "inherit",
      }}
    >
      {label && (
        <label
          style={{
            fontWeight: 500,
            marginBottom: 6,
            display: "block",
            color: error ? "#f44336" : "#999",
            fontSize: 15,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          borderRadius: 8,
          background: disabled ? "#f5f5f5" : "#f2f2f6",
          minHeight: 52,
          display: "flex",
          alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
          transition: "border 0.2s",
          boxSizing: "border-box",
          width: "100%",
        }}
        onClick={() => !disabled && setOpen(true)}
        tabIndex={0}
      >
        {!open ? (
          <span
            style={{
              padding: "10px 14px",
              color: value ? "#222" : "#BABABA",
              flex: 1,
              fontSize: 16,
              userSelect: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selectedLabel || placeholder}
          </span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "10px 14px",
              border: "none",
              outline: "none",
              fontSize: 16,
              flex: 1,
              background: "transparent",
              width: "100%", // <--- добавлено, чтобы ширина не менялась
              boxSizing: "border-box", // <--- добавлено
            }}
            disabled={disabled}
            placeholder={placeholder}
            onBlur={() => {
              setTimeout(() => {
                setOpen(false);
                setSearch("");
              }, 120);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                setSearch("");
              }
            }}
          />
        )}
        {/* Треугольник убран */}
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            background: "#fff",
            border: "1px solid #ccc",
            borderTop: "none",
            zIndex: 10,
            maxHeight: 180,
            overflowY: "auto",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            borderRadius: "0 0 8px 8px",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "10px 14px",
                color: "#888",
                fontSize: 16,
                cursor: "default",
              }}
            >
              Topilmadi
            </div>
          ) : (
            filtered.map((opt) => (
              <div
                key={opt.value}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontSize: 16,
                  background: opt.value === value ? "#f0f7ff" : "transparent",
                  color: "#222",
                  borderBottom: "1px solid #f5f5f5",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                onMouseDown={() => handleSelect(opt.value)}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
      {error && (
        <div style={{ color: "#f44336", fontSize: 13, marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchSelect;
