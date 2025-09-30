import { IconZap, IconClock, IconSun, IconMoon } from "./Icons";

const Header = ({
  currentTime,
  theme,
  toggleTheme,
  view,
  setView,
  kitchenLoad,
  formatTime
}) => {
  const stations = ["All", "Grill", "Fryer", "Assembly"];

  const loadColor =
    kitchenLoad === "Heavy"
      ? "text-red-500"
      : kitchenLoad === "Moderate"
      ? "text-yellow-400"
      : "text-green-400";

  return (
    <header className="p-6 rounded-lg bg-[#0f1729] border border-gray-700/40 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      {/* Left */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Kitchen Display System
        </h1>
        <div className={`mt-2 flex items-center gap-2 font-semibold text-sm uppercase ${loadColor}`}>
          <IconZap />
          <span>{kitchenLoad} Load</span>
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
        <div className="flex items-center gap-2 font-semibold text-gray-200 text-sm">
          <IconClock />
          <span className="tabular-nums">{formatTime(currentTime)}</span>
        </div>
        <div className="flex gap-2">
          {stations.map(s => {
            const active = view === s;
            return (
              <button
                key={s}
                onClick={() => setView(s)}
                className={[
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400",
                  active
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-700/60 text-gray-200 hover:bg-gray-600"
                ].join(" ")}
              >
                {s}
              </button>
            );
          })}
        </div>
        <button
          onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-md bg-gray-700/60 text-gray-200 hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          {theme === "light" ? <IconMoon /> : <IconSun />}
        </button>
      </div>
    </header>
  );
};

export default Header;