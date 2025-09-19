import { useState, useEffect } from "react";
import { IconClock, IconCheckCircle } from "./Icons";

const OrderTimer = ({ receivedAt, status }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status === "ready") return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((new Date() - receivedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [receivedAt, status]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const timeColor =
    minutes >= 10
      ? "text-red-400"
      : minutes >= 5
      ? "text-yellow-400"
      : "text-green-400";

  if (status === "ready") {
    return (
      <div className="flex items-center font-bold text-green-400">
        <IconCheckCircle />
        <span className="ml-2">Completed</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center font-bold ${timeColor}`}>
      <IconClock />
      <span className="ml-2 tabular-nums">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
};

export default OrderTimer;
