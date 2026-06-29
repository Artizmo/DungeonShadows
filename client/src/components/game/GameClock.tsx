import { useState, useEffect } from "react";

export function GameClock() {
  const now = new Date();
  const [time, setTime] = useState(now);
  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  useEffect(() => {
    let lastMinute = new Date().getMinutes();

    const timer = setInterval(() => {
      const now = new Date();
      const currentMinute = now.getMinutes();

      if (currentMinute !== lastMinute) {
        lastMinute = currentMinute;
        setTime(now);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <div>{formattedTime}</div>;
}
