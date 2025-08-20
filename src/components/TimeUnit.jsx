import React from "react";

const TimeUnit = React.memo(({ value, unit }) => {
  if (!value) return null;
  return (
    <>
      {value} {unit}{" "}
    </>
  );
});

export default TimeUnit;
