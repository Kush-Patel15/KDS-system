import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, useLayoutEffect } from "react";
import CustomerMenu from "./CustomerMenu";
import TrackOrder from "./TrackOrder";
import LoginSignup from "./components/LoginSignup";
import KitchenLayout from "./components/KitchenLayout";
import AdminMenuManager from "./components/AdminMenuManager";
import { KITCHEN_ROLES, ADMIN_ROLE } from "./constants/roles";

function AppInner() {
  // THEME
  const initialTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const [theme, setTheme] = useState(initialTheme);
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  useEffect(() => { localStorage.setItem("theme", theme); }, [theme]);
  const toggleTheme = () => setTheme(t => (t === "light" ? "dark" : "light"));

  // USER
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const location = useLocation();
  const publicKitchen = new URLSearchParams(location.search).get("publicKitchen") === "1";

  return (
    <Routes>
      <Route
        path="/"
        element={
          <CustomerMenu
            theme={theme}
            toggleTheme={toggleTheme}
            user={user}
            setUser={setUser}
          />
        }
      />
      <Route
        path="/track-order"
        element={
          <TrackOrder
            theme={theme}
            toggleTheme={toggleTheme}
            user={user}
            setUser={setUser}
          />
        }
      />
      <Route
        path="/login"
        element={
          <LoginSignup
            onLogin={(u) => {
              setUser(u);
              /* navigation handled inside LoginSignup */
            }}
          />
        }
      />
      <Route
        path="/admin/menu"
        element={
          user && user.role === "admin"
            ? <AdminMenuManager />
            : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/kitchen"
        element={
          (user && (KITCHEN_ROLES.includes(user.role) || user.role===ADMIN_ROLE))
            ? <KitchenLayout user={user} />
            : <Navigate to="/login" replace />
        }
      />
      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}