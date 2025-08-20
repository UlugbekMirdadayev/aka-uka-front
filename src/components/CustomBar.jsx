const CustomBar = (props) => {
  const { fill, x, y, width, height, isActive, shadow } = props;

  return (
    <g>
      <rect
        x={x}
        y={0}
        rx={10}
        ry={10}
        width={width}
        height={200}
        fill="#fff"
        onClick={() => console.log("clicked bar")}
        style={{
          cursor: "pointer",
        }}
      />
      <rect
        x={x}
        y={y}
        rx={10}
        ry={10}
        width={width}
        height={height}
        style={{
          filter: isActive ? shadow : "none",
          transition: "0.1s ease",
          cursor: "pointer",
        }}
        fill={fill}
        onClick={() => console.log("clicked bar")}
      />
    </g>
  );
};

export default CustomBar;
