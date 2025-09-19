import { IconZap, IconClock, IconSun, IconMoon } from "./Icons";
import LoginSignup from "./LoginSignup";
const Header = ({ currentTime, theme, toggleTheme, view, setView, kitchenLoad, formatTime }) => {
  const stations = ["All", "Grill", "Fryer", "Assembly"];
  const loadColor =
    kitchenLoad === "Heavy"
      ? "text-red-500"
      : kitchenLoad === "Moderate"
      ? "text-yellow-500"
      : "text-green-500";

  return (
    <header className="p-4 flex justify-between items-center dark:bg-gray-900/50 bg-white/50 backdrop-blur-sm rounded-lg shadow-md mb-4">
      {/* Left Section */}
      <div>
        <h1 className="text-3xl font-black tracking-tighter dark:text-white text-black">
          Kitchen Display System
        </h1>
        <div className={`flex items-center gap-2 font-bold ${loadColor}`}>
          <IconZap />
          <span>{kitchenLoad} Load</span>
        </div>
      </div>

      {/* Middle Section */}
      <div className="flex items-center gap-6">
        {/* Current Time */}
        <div className="flex items-center gap-2 font-semibold dark:text-gray-200 text-gray-800">
          <IconClock />
          <span>{formatTime(currentTime)}</span>
        </div>

        {/* Station Filter */}
        <div className="flex gap-2">
          {stations.map((station) => (
            <button
              key={station}
              onClick={() => setView(station)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                view === station
                  ? "bg-yellow-400 text-black"
                  : "dark:bg-gray-700 bg-gray-200 dark:text-gray-300 text-gray-800 hover:bg-yellow-300 hover:text-black"
              }`}
            >
              {station}
            </button>
          ))}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full dark:bg-gray-700 bg-gray-200 dark:hover:bg-gray-600 hover:bg-gray-300 transition-colors"
        >
          {theme === "light" ? <IconMoon /> : <IconSun />}
        </button>

        <button className="p-2 text-white rounded-xl dark:bg-gray-700 bg-gray-200 dark:hover:bg-gray-600 hover:bg-gray-300 transition-colors" onClick={<LoginSignup/>}>Login/Signup</button>
      </div>
    </header>
  );
};

export default Header;



