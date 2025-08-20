import { useEffect, useState } from "react";

const useCounter = ({ value = 0, duration = 2000 }) => {
  if (isNaN(value)) value = 0;
  const [count, setCount] = useState(value);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16); // Approx. 60 FPS

    const updateCounter = () => {
      start += increment;
      if (start >= value) {
        setCount(value);
      } else {
        setCount(Math.ceil(start));
        requestAnimationFrame(updateCounter);
      }
    };

    updateCounter();
  }, [value, duration]);

  return { number: count.toLocaleString() };
};

const NumberAnimation = ({ value = 0, duration = 2000 }) => {
  const { number } = useCounter({ duration, value });
  return number;
};

export default NumberAnimation;
