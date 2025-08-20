import React, { useState, useRef, useEffect } from "react";
import "../styles/select.css";
import { ArrowTop } from "../assets/icons";

const Select = ({
  options = [],
  value,
  onChange,
  placeholder = "Tanlang...",
  className = "",
  label = "",
  disabled = false,
  required,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div
      ref={selectRef}
      className={`custom-select ${className} ${disabled ? "disabled" : ""} ${
        error ? "error" : ""
      }`}
    >
      <div
        className="custom-select-label"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {label}
        {required && <span>*</span>}
      </div>
      <div
        className="select-header"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span
          className={`selected-value ${
            selectedOption ? "" : "placeholder-style"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ArrowTop className={`arrow ${isOpen ? "open" : ""}`} />
      </div>

      {isOpen && (
        <div className="select-options">
          {(options?.length ? options : []).map((option,index) => (
            <div
              key={index}
              className={`option ${value === option.value ? "selected" : ""} 
              ${option.disabled ? "disabled" : ""}`}
              onClick={() => {
                if (disabled || option.disabled) return;
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Select;
