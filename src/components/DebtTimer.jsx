import { useEffect, useState } from "react";
import moment from "moment/min/moment-with-locales";
import TimeUnit from "./TimeUnit";

const DebtTimer = ({ targetDate }) => {
  const [years, setYears] = useState(0);
  const [months, setMonths] = useState(0);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = moment();
      const due = moment(targetDate);
      const isPast = now.isAfter(due);

      const from = isPast ? due.clone() : now.clone();
      const to = isPast ? now.clone() : due.clone();

      const diffYears = to.diff(from, "years");
      from.add(diffYears, "years");

      const diffMonths = to.diff(from, "months");
      from.add(diffMonths, "months");

      const diffDays = to.diff(from, "days");
      from.add(diffDays, "days");

      const diffHours = to.diff(from, "hours");
      from.add(diffHours, "hours");

      const diffMinutes = to.diff(from, "minutes");
      from.add(diffMinutes, "minutes");

      const diffSeconds = to.diff(from, "seconds");

      setYears((prev) => (prev !== diffYears ? diffYears : prev));
      setMonths((prev) => (prev !== diffMonths ? diffMonths : prev));
      setDays((prev) => (prev !== diffDays ? diffDays : prev));
      setHours((prev) => (prev !== diffHours ? diffHours : prev));
      setMinutes((prev) => (prev !== diffMinutes ? diffMinutes : prev));
      setSeconds((prev) => (prev !== diffSeconds ? diffSeconds : prev));
      setIsPast(isPast);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const isZero =
    years === 0 &&
    months === 0 &&
    days === 0 &&
    hours === 0 &&
    minutes === 0 &&
    seconds === 0;

  if (isZero) return <span>Hozir</span>;

  return (
    <span style={{ color: isPast ? "red" : "green" }}>
      {years > 0 && <TimeUnit value={years} unit="yil" />}
      {months > 0 && <TimeUnit value={months} unit="oy" />}
      {days > 0 && <TimeUnit value={days} unit="kun" />}
      {hours > 0 && <TimeUnit value={hours} unit="soat" />}
      {minutes > 0 && <TimeUnit value={minutes} unit="minut" />}
      <TimeUnit value={seconds} unit="soniya" />
      {seconds ? (isPast ? " o‘tgan" : " bor hali") : ""}
    </span>
  );
};

export default DebtTimer;
