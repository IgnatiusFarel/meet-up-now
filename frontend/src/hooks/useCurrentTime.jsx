import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/en";

const useCurrentTime = () => {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    dayjs.locale("en");

    const updateTime = () => {
      const now = dayjs();
      setTime(now.format("HH:mm"));
      setDate(now.format("ddd, DD MMM"));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  return { time, date };
};

export default useCurrentTime;
