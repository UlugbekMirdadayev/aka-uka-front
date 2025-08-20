import React from "react";
import "../styles/input.css";

const Input = ({
  as = "input", // or textarea
  type = "text",
  value,
  onChange,
  placeholder = "",
  label = "",
  className = "",
  disabled = false,
  required,
  error,
  leftSection,
  rightSection,
  style = {},
  readonly= false,
  ...props
}) => {
  const Element = as === "textarea" ? "textarea" : "input";

  return (
    <label
      className={`custom-input ${className} ${disabled ? "disabled" : ""}`}
      style={style}
    >
      {label && (
        <div className="custom-input-label">
          {label}
          {required && <span>*</span>}
        </div>
      )}
      <div className="input-wrapper">
        {leftSection && <div className="input-section left">{leftSection}</div>}
        <Element
          {...(Element === "input" ? { type } : {})}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`input ${error ? "error" : ""} ${
            leftSection ? "with-left" : ""
          } ${rightSection ? "with-right" : ""}`}
          readOnly={readonly}
          {...props}
        />
        {rightSection && (
          <div className="input-section right">{rightSection}</div>
        )}
      </div>
      {error && <div className="error-message">{error}</div>}
    </label>
  );
};

export default Input;
