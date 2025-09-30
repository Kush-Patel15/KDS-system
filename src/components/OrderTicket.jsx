import {
  IconAlertTriangle,
  IconGrill,
  IconFryer,
  IconAssembly,
} from "./Icons";
import OrderTimer from "./OrderTimer";

const OrderTicket = ({
  order,
  onUpdateStatus,
}) => {
  const isAllergy =
    order.specialInstruction &&
    order.specialInstruction.toLowerCase().includes("allergy");

  // Before choosing color:
  const normalized = order.status.toLowerCase().replace("_","-");
  const statusBorderColor = {
    "new": "border-blue-500",
    "in-progress": "border-yellow-500",
    "ready": "border-green-500"
  };

  const stationIcons = {
    Grill: <IconGrill />,
    Fryer: <IconFryer />,
    Assembly: <IconAssembly />,
  };

  const handleNextStatus = () => {
    if (order.status === "new") onUpdateStatus(order.id, "in-progress");
    else if (order.status === "in-progress") onUpdateStatus(order.id, "ready");
  };

  return (
    <div
      className={`relative rounded-lg p-4 mb-4 shadow-lg transition-all duration-300 dark:text-gray-200 text-gray-800 dark:bg-gray-800 bg-white border-l-8 ${
        statusBorderColor[order.status]
      } ${order.isUrgent ? "animate-pulse-border" : ""}`}
      style={{ "--pulse-color": isAllergy ? "#ef4444" : "#f97316" }}
    >
      {order.isUrgent && (
        <div className="absolute -top-0 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
          URGENT
        </div>
      )}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-2xl font-extrabold dark:text-white text-black">
          Order #{order.id}
        </h3>
        <OrderTimer receivedAt={order.receivedAt} status={order.status} />
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center dark:bg-gray-700/50 bg-gray-100/50 p-2 rounded"
          >
            <span className="font-semibold">{item.name}</span>
            <span className="text-sm dark:text-gray-400 text-gray-500 flex items-center gap-2">
              {stationIcons[item.station]} {item.station}
            </span>
          </div>
        ))}
      </div>

      {order.specialInstruction && (
        <div
          className={`p-2 rounded mb-3 font-bold text-sm ${
            isAllergy
              ? "bg-red-500 text-black "
              : "bg-yellow-500/30 text-yellow-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <IconAlertTriangle />
            <span>{order.specialInstruction}</span>
          </div>
        </div>
      )}

      {order.status !== "ready" && (
        <button
          onClick={handleNextStatus}
          className="w-full py-2 px-4 rounded-lg font-bold text-white transition-colors duration-200 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {order.status === "new" ? "Start Cooking" : "Mark as Ready"}
        </button>
      )}
    </div>
  );
};

export default OrderTicket;
