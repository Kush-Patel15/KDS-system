import { useState, useEffect, useCallback, useMemo } from "react";
import Header from "./components/Header";
import LoginSignup from "./components/LoginSignup";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import OrderLane from "./components/OrderLane";


// Utility: format time
const formatTime = (date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Utility: random order generator
const stations = ["Grill", "Fryer", "Assembly"];
const sampleItems = ["Burger", "Fries", "Wrap", "Pizza", "Tacos", "Nuggets"];
let nextId = 1;

const specialInstructions = [
  "Allergy: Peanuts",
  "Allergy: Gluten",
  "No Onions",
  "Extra Spicy",
  "Less Salt",
  "Well Done",
];

const generateOrder = () => ({
  id: nextId++,
  customer: `Customer ${Math.floor(Math.random() * 100)}`,
  items: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => {
    const item = sampleItems[Math.floor(Math.random() * sampleItems.length)];
    const station = stations[Math.floor(Math.random() * stations.length)];
    return { name: item, station };
  }),
  receivedAt: new Date(),
  status: "new",
  specialInstruction:
    Math.random() < 0.3  // Adding special instruction in approx 30% of orders
      ? specialInstructions[
          Math.floor(Math.random() * specialInstructions.length)
        ]
      : null,
  isUrgent: Math.random() < 0.15, // Adding Urgent feature in approx 15% of orders
});
  

// Main App
const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [theme, setTheme] = useState("dark");
  const [view, setView] = useState("All");
  
  const [orders, setOrders] = useState([]);
  const [completedToday, setCompletedToday] = useState(0);
  
  
  // updating clock timing
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  },[]);
  
  // Theme toggle
  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  
  // Filter orders by view
  const filteredOrders = useMemo(() => {
    if (view === "All") return orders;
    return orders.filter((order) =>
      order.items.some((item) => item.station === view)
    );
  }, [orders, view]);

  // Kitchen load status
  const kitchenLoad = useMemo(() => {
    if (orders.length > 10) return "Heavy";
    if (orders.length > 5) return "Moderate";
    return "Light";
  }, [orders.length]);


  // Random order generator every 10s
  // Random order generator every 10s, but pause if > 15 pending
    useEffect(() => {
    const pendingCount = orders.filter(o => o.status !== "ready").length;

    if (pendingCount >= 15) {
        return; // If too many, stop generating
    }

    const interval = setInterval(() => {
        setOrders((prev) => [...prev, generateOrder()]);
    }, 10000);

    return () => clearInterval(interval);
    }, [orders]);


  // Update status handler
  const updateOrderStatus = useCallback((id, newStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: newStatus } : order
      )
    );
    if (newStatus === "ready") {
      setCompletedToday((prev) => prev + 1);
    }
  }, []);

  // Drag and drop handlers
  const handleDragStart = (e, id, status) => {
    e.dataTransfer.setData("orderId", id);
    e.dataTransfer.setData("currentStatus", status);
  };

  const handleDrop = (e, newStatus) => {
    const id = parseInt(e.dataTransfer.getData("orderId"), 10);
    const currentStatus = e.dataTransfer.getData("currentStatus");
    if (id && currentStatus !== newStatus) {
      updateOrderStatus(id, newStatus);
    }
  };

  const handleDragOver = (e) => e.preventDefault();
  
  return (
    <div
      className={`min-h-screen p-6 transition-colors ${
        theme === "dark" ? "dark bg-gray-950" : "bg-slate-50"
      }`}
    >

      {/* ================================ Login Signup page ================================*/}
      <LoginSignup />

      {/* ================================ Header ================================ */}
      <Header
        currentTime={currentTime}
        theme={theme}
        toggleTheme={toggleTheme}
        view={view}
        setView={setView}
        kitchenLoad={kitchenLoad}
        formatTime={formatTime}
      />

      {/* Analytics */}
      <AnalyticsDashboard orders={orders} completedToday={completedToday} />

      {/* Order Lanes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {["new", "in-progress", "ready"].map((status) => (
          <OrderLane
            key={status}
            title={
              status === "new"
                ? "New Orders"
                : status === "in-progress"
                ? "In Progress"
                : "Ready"
            }
            orders={filteredOrders.filter((order) => order.status === status)}
            onUpdateStatus={updateOrderStatus}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>
      {/* Warning when too many orders */}
    </div>
  );
};

export default App;
