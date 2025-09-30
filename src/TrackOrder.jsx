import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { fetchOrderByOrderCode } from "./api/client"; // adjust if different

const TrackOrder = ({ theme, toggleTheme, user, setUser }) => {
  const [orderId, setOrderId] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinkClasses = ({ isActive }) =>
    [
      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
      isActive
        ? "bg-yellow-400 text-gray-900 shadow"
        : "text-gray-700 dark:text-gray-300 hover:bg-yellow-300 hover:text-gray-900 dark:hover:bg-yellow-500/80 dark:hover:text-gray-900"
    ].join(" ");

  const handleTrack = async () => {
    if (!orderId.trim()) return;
    try {
      const data = await fetchOrderByOrderCode(orderId.replace(/^#/, ""));
      setResult(data);
    } catch (e) {
      setResult(null);
      alert("Order not found");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-[#0d1117] dark:via-[#0c1219] dark:to-[#0a0f15] transition-colors">
      {/* Compact navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-200/60 dark:border-gray-800/70 backdrop-blur-xl bg-white/78 dark:bg-[#0d1117cc]">
        <div className="max-w-7xl mx-auto px-3 md:px-5">
          <div className="h-14 flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="text-lg md:text-xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent"
            >
              KDS
            </button>
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" end className={navLinkClasses}>Menu</NavLink>
              <NavLink to="/track-order" className={navLinkClasses}>Track</NavLink>
              {user?.role === "owner" && (
                <button
                  onClick={() => navigate("/kitchen")}
                  className="px-3 py-1.5 rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-yellow-300 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-yellow-500/80 dark:hover:text-gray-900"
                >
                  Kitchen
                </button>
              )}
            </nav>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {theme === "light" ? "🌙" : "🌞"}
              </button>
              {user ? (
                <button
                  onClick={() => { setUser(null); navigate("/", { replace: true }); }}
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login", { state: { from: location.pathname } })}
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-sm font-medium bg-yellow-400 text-gray-900 hover:bg-yellow-300 shadow"
                >
                  Login
                </button>
              )}
              <button
                onClick={() => setMobileOpen(o => !o)}
                className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {mobileOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
          {mobileOpen && (
            <div className="md:hidden pb-3">
              <div className="flex flex-col gap-2 pt-1">
                <NavLink to="/" end className={navLinkClasses}>Menu</NavLink>
                <NavLink to="/track-order" className={navLinkClasses}>Track Order</NavLink>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="px-6 py-12 flex items-start justify-center">
        <div className="w-full max-w-md bg-white/90 dark:bg-gray-800/70 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Track Your Order
          </h1>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter order ID (e.g. ORD-15)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
            />
            <button
              onClick={handleTrack}
              className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-400 transition"
            >
              Track
            </button>
          </div>

          {result && (
            <div className="mt-6 text-sm text-gray-800 dark:text-gray-200 space-y-2">
              <div><span className="font-semibold">Order:</span> #{result.orderId || result.id}</div>
              <div><span className="font-semibold">Status:</span> {result.status}</div>
              <div><span className="font-semibold">Items:</span></div>
              <ul className="list-disc ml-5">
                {result.items?.map(it => (
                  <li key={it.id}>
                    {(it.menuItem?.name || it.name)} x {it.quantity}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TrackOrder;

