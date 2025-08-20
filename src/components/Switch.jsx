import "../styles/switch.css";

const Switch = ({ checked, onChange, label, ...props }) => {
  return (
    <label className="switch-root">
      <input
        type="checkbox"
        className="switch-input"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        {...props}
      />
      <span className="switch-slider" />
      {label && <span className="switch-label">{label}</span>}
    </label>
  );
};

export default Switch;
