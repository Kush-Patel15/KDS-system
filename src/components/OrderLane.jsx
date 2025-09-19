import OrderTicket from "./OrderTicket";

const OrderLane = ({
  title,
  orders,
  onUpdateStatus,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  return (
    <div className="flex-1 p-4 rounded-lg dark:bg-gray-900/70 bg-gray-200/70 min-h-[80vh]">
      <h2 className="text-2xl font-bold mb-4 text-center dark:text-white text-black">
        {title} ({orders.length})
      </h2>
      <div className="h-[calc(100vh-180px)] overflow-y-auto pr-2">
        {orders.map((order, index) => (
          <OrderTicket
            key={order.id}
            order={order}
            onUpdateStatus={onUpdateStatus}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default OrderLane;
