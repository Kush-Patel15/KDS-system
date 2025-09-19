import React, { useMemo } from "react";
import { IconBarChart } from "./Icons";

const AnalyticsDashboard = ({ orders, completedToday }) => {
  const activeOrders = orders.filter((o) => o.status !== "ready").length;

  const avgCookTime = useMemo(() => {
    const readyOrders = orders.filter((o) => o.status === "ready");
    if (readyOrders.length === 0) return 0;
    const totalTime = readyOrders.reduce((acc, order) => {
      const timeTaken = (new Date() - order.receivedAt) / 1000 / 60;
      return acc + (timeTaken < 30 ? timeTaken : 15);
    }, 0);
    return (totalTime / readyOrders.length).toFixed(1);
  }, [orders]);

  const itemsOnDeck = useMemo(() => {
    const counts = {};
    orders
      .filter((o) => o.status !== "ready")
      .forEach((order) => {
        order.items.forEach((item) => {
          counts[item.name] = (counts[item.name] || 0) + 1;
        });
      });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  }, [orders]);

  return (
    <div className="p-4 rounded-lg dark:bg-gray-800 bg-white dark:text-gray-300 text-gray-700 shadow-lg">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white text-black">
        <IconBarChart /> Today's Analytics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="dark:bg-gray-700/50 bg-gray-100 p-3 rounded">
          <p className="text-2xl font-bold dark:text-white text-black">
            {activeOrders}
          </p>
          <p className="text-sm">Active</p>
        </div>
        <div className="dark:bg-gray-700/50 bg-gray-100 p-3 rounded">
          <p className="text-2xl font-bold dark:text-white text-black">
            {completedToday}
          </p>
          <p className="text-sm">Completed</p>
        </div>
        <div className="dark:bg-gray-700/50 bg-gray-100 p-3 rounded">
          <p className="text-2xl font-bold dark:text-white text-black">
            {avgCookTime}
            <span className="text-base">m</span>
          </p>
          <p className="text-sm">Avg. Time</p>
        </div>
        <div className="dark:bg-gray-700/50 bg-gray-100 p-3 rounded">
          <p className="text-2xl font-bold dark:text-white text-black">
            {orders.length}
          </p>
          <p className="text-sm">Total</p>
        </div>
      </div>
      <div className="mt-4">
        <h4 className="font-bold mb-2 dark:text-white text-black">
          Hot Items on Deck:
        </h4>
        <ul className="text-sm space-y-1">
          {itemsOnDeck.map(([name, count]) => (
            <li key={name} className="flex justify-between ">
              <span>{name}</span>
              <span className="font-bold">{count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
