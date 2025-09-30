import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import CartDropdown from "./components/CartDropdown";
import { fetchMenuItems, createOrder } from "./api/client";
import { useStomp } from "./ws/useStomp";

const CustomerMenu = ({ theme, toggleTheme, user, setUser }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Fetch menu items from the database
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        
        console.log('Fetching menu items from:', import.meta.env.VITE_API_BASE_URL);
        const items = await fetchMenuItems();
        console.log('Raw API response:', items);
        
        if (!alive) return;
        
        // Handle nested array structure - get the actual items array
        const actualItems = Array.isArray(items) && items.length > 0 && Array.isArray(items[0]) 
          ? items[0] 
          : Array.isArray(items) 
            ? items 
            : [];
        
        console.log('Actual items array:', actualItems[0][0]);
        
        // Filter only available items and format them
        const availableItems = actualItems
          .filter(item => {
            console.log('Checking item:', item, 'isAvailable:', item.isAvailable);
            // Include items where isAvailable is true OR null/undefined (default to available)
            return item.isAvailable !== false;
          })
          .map(item => {
            const formatted = {
              id: item.id,
              name: item.name,
              price: item.price,
              category: item.category || "Misc",
              description: item.description,
              image_url: item.imageUrl || "/placeholder.png",
              isPopular: item.isPopular
            };
            console.log('Formatted item:', formatted);
            return formatted;
          });
        
        console.log('Final availableItems:', availableItems);
        setMenuItems(availableItems);
      } catch (e) {
        console.error("Failed to load menu items:", e);
        setError(`Failed to load menu items: ${e.message}`);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Listen for real-time menu updates
  useStomp([
    {
      destination: "/topic/menu",
      callback: (msg) => {
        setMenuItems((items) => {
          if (msg.type === "created" && msg.item.isAvailable) {
            return [...items, msg.item];
          }
          if (msg.type === "updated") {
            if (msg.item.isAvailable) {
              return items.map((i) => (i.id === msg.item.id ? msg.item : i));
            } else {
              return items.filter((i) => i.id !== msg.item.id);
            }
          }
          if (msg.type === "deleted") {
            return items.filter((i) => i.id !== msg.id);
          }
          return items;
        });
      },
    },
  ]);

  const categories = ["All", ...new Set(menuItems.map((i) => i.category))];
  const filteredItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter((i) => i.category === selectedCategory);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, quantity: p.quantity - 1 } : p))
        .filter((p) => p.quantity > 0)
    );
  };

  const confirmOrder = async (customerInfo) => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    try {
      await createOrder({
        items: cart,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        orderType: customerInfo.orderType,
      });
      alert("Order placed successfully!");
      setCart([]);
      setShowCart(false);
    } catch (e) {
      console.error("Order failed:", e);
      alert("Order failed: " + e.message);
    }
  };

  // Close mobile panel on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinkClasses = ({ isActive }) =>
    [
      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 dark:focus:ring-yellow-500",
      isActive
        ? "bg-yellow-400 text-gray-900 shadow"
        : "text-gray-700 dark:text-gray-300 hover:bg-yellow-300 hover:text-gray-900 dark:hover:bg-yellow-500/80 dark:hover:text-gray-900",
    ].join(" ");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-[#0d1117] dark:via-[#0c1219] dark:to-[#0a0f15] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-[#0d1117] dark:via-[#0c1219] dark:to-[#0a0f15] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-[#0d1117] dark:via-[#0c1219] dark:to-[#0a0f15] transition-colors">
      {/* Compact Unified Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-200/60 dark:border-gray-800/70 backdrop-blur-xl bg-white/78 dark:bg-[#0d1117cc] supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#0d1117bf]">
        <div className="max-w-7xl mx-auto px-3 md:px-5">
          <div className="h-14 flex items-center gap-3">
            {/* Brand */}
            <button
              onClick={() => navigate("/")}
              className="flex-shrink-0 text-lg md:text-xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent"
              aria-label="Home"
            >
              🍽️ Cloud Kitchen
            </button>

            {/* Primary Links (hide on small) */}
            <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
              <NavLink to="/" end className={navLinkClasses}>
                Menu
              </NavLink>
              <NavLink to="/track-order" className={navLinkClasses}>
                Track
              </NavLink>
              {user?.role === "admin" && (
                <button
                  onClick={() => navigate("/admin/menu")}
                  className="px-3 py-1.5 rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-yellow-300 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-yellow-500/80 dark:hover:text-gray-900 transition-colors"
                >
                  Admin
                </button>
              )}
            </nav>

            {/* Categories center (scrollable) */}
            <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
              <div className="flex gap-2 w-max mx-auto pr-4">
                {categories.map((cat) => {
                  const active = cat === selectedCategory;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={[
                        "px-4 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2",
                        active
                          ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
                      ].join(" ")}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCart((s) => !s)}
                aria-label="Cart"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                🛒
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    {cart.reduce((a, i) => a + i.quantity, 0)}
                  </span>
                )}
              </button>

              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === "light" ? "🌙" : "🌞"}
              </button>

              {user ? (
                <div className="hidden lg:flex items-center gap-2 pl-1">
                  <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300 max-w-[90px] truncate">
                    {user.name}
                  </span>
                  <button
                    onClick={() => {
                      setUser(null);
                      navigate("/", { replace: true });
                    }}
                    className="px-3 py-1.5 text-xs md:text-sm rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() =>
                    navigate("/login", { state: { from: location.pathname } })
                  }
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-sm font-medium bg-yellow-400 text-gray-900 hover:bg-yellow-300 shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Login
                </button>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                aria-label="Menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>

          {/* Mobile panel */}
          {mobileOpen && (
            <div className="md:hidden pb-3 animate-fade-in">
              <div className="flex flex-col gap-2 pt-1">
                <NavLink to="/" end className={navLinkClasses}>
                  Menu
                </NavLink>
                <NavLink to="/track-order" className={navLinkClasses}>
                  Track Order
                </NavLink>
                {user?.role === "admin" && (
                  <button
                    onClick={() => {
                      navigate("/admin/menu");
                    }}
                    className="px-3 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-yellow-300 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-yellow-500/80 dark:hover:text-gray-900 transition-colors"
                  >
                    Admin
                  </button>
                )}
                {!user && (
                  <button
                    onClick={() => navigate("/login")}
                    className="px-3 py-2 rounded-md text-sm font-medium bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition-colors"
                  >
                    Login / Signup
                  </button>
                )}
                {user && (
                  <button
                    onClick={() => {
                      setUser(null);
                      navigate("/", { replace: true });
                    }}
                    className="px-3 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {showCart && (
        <CartDropdown
          cart={cart}
          setShowCart={setShowCart}
          confirmOrder={confirmOrder}
          removeFromCart={removeFromCart}
          addToCart={addToCart}
        />
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl overflow-hidden border border-gray-200/70 dark:border-gray-700/70 bg-white/95 dark:bg-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-44 relative overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = "/placeholder.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {item.isPopular && (
                  <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    ⭐ Popular
                  </span>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <p className="text-green-600 dark:text-green-400 font-bold mb-4">
                  ${item.price}
                </p>
                <button
                  onClick={() => addToCart(item)}
                  className="w-full rounded-xl py-2 font-semibold text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="col-span-full text-center text-gray-600 dark:text-gray-400 py-14">
              No items available in this category.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerMenu;

