import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signup } from "../api/client";
import { KITCHEN_ROLES } from "../constants/roles";

const LoginSignup = ({ onLogin }) => {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "", email: "", password: "", confirmPassword: "",
    role: "CUSTOMER_SERVICE"
  });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoginMode && form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      let user;
      if (isLoginMode) {
        user = await login(form.email, form.password);
      } else {
        user = await signup({
          username: form.username,
          email: form.email,
            password: form.password,
            role: form.role
        });
      }
      const normalized = {
        id: user.id,
        name: user.username,
        role: user.role.toLowerCase()
      };
      onLogin(normalized);
      if (KITCHEN_ROLES.includes(normalized.role)) {
        navigate("/kitchen", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-[#0d1117]">
      <div className="w-[430px] bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-semibold text-center mb-6 dark:text-white">
          {isLoginMode ? "Login" : "Sign Up"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="Username"
              className="w-full p-3 border-b-2 bg-transparent border-gray-300 dark:border-gray-600 outline-none focus:border-cyan-500 text-gray-800 dark:text-gray-200"
            />
          )}
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="Email"
            className="w-full p-3 border-b-2 bg-transparent border-gray-300 dark:border-gray-600 outline-none focus:border-cyan-500 text-gray-800 dark:text-gray-200"
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Password"
            className="w-full p-3 border-b-2 bg-transparent border-gray-300 dark:border-gray-600 outline-none focus:border-cyan-500 text-gray-800 dark:text-gray-200"
          />
          {!isLoginMode && (
            <>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm Password"
                className="w-full p-3 border-b-2 bg-transparent border-gray-300 dark:border-gray-600 outline-none focus:border-cyan-500 text-gray-800 dark:text-gray-200"
              />
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full p-3 border-b-2 bg-transparent border-gray-300 dark:border-gray-600 outline-none focus:border-cyan-500 text-gray-800 dark:text-gray-200"
              >
                <option value="CUSTOMER_SERVICE">Customer Service</option>
                <option value="CHEF">Chef</option>
                <option value="LINE_COOK">Line Cook</option>
                <option value="EXPEDITER">Expediter</option>
                <option value="KITCHEN_MANAGER">Kitchen Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </>
          )}
          <button
            disabled={loading}
            className="w-full p-3 bg-gradient-to-r from-blue-700 via-cyan-600 to-cyan-300 text-white rounded-full text-lg font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Please wait..." : (isLoginMode ? "Login" : "Create Account")}
          </button>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            {isLoginMode ? "No account?" : "Have an account?"}{" "}
            <span
              onClick={() => setIsLoginMode(m => !m)}
              className="text-cyan-600 cursor-pointer hover:underline"
            >
              {isLoginMode ? "Sign up" : "Login"}
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginSignup;