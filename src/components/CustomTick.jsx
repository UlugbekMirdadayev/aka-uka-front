const CustomTick = ({ x, y, payload, index, activeIndex }) => {
  const isActive = index === activeIndex;

  return (
    <text
      x={x}
      y={y + 10}
      textAnchor="middle"
      fill="#4F4F4F"
      fontSize={isActive ? 16 : 14}
      fontStyle="normal"
      fontWeight={isActive ? 700 : 500}
    >
      {payload.value}
    </text>
  );
};

export default CustomTick;
