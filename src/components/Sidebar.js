import React from "react";

const Sidebar = ({ isOpen, onClose, onToggleTheme, currentTheme }) => {
  const isDark = currentTheme === "dark";

  const bgClass = isDark
    ? "bg-[#141417]/95 border-white/10"
    : "bg-zinc-100/95 border-black/10";

  const textMain = isDark ? "text-white" : "text-zinc-900";
  const textMuted = isDark ? "text-zinc-500" : "text-zinc-500";

  const hoverItem = isDark
    ? "hover:bg-white/5 hover:text-white"
    : "hover:bg-black/5 hover:text-black";

  const borderClass = isDark ? "border-white/10" : "border-black/10";

  return (
    <>
      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-[60px] left-0
          w-[280px] h-[calc(100vh-60px)]
          backdrop-blur-xl border-r z-50
          transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          flex flex-col px-5 py-6
          ${bgClass}
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className={`text-xs font-bold tracking-[0.18em] ${textMuted}`}>
              SESSION HISTORY
            </h3>
            <p className={`text-[11px] mt-1 ${textMuted}`}>
              Recent infrastructure actions
            </p>
          </div>

          <button
            onClick={onClose}
            className={`text-xl leading-none ${textMuted} hover:${textMain} transition-colors`}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        {/* HISTORY LIST */}
        <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-1">
          {[
            "Create EC2 Infrastructure",
            "Modify Instance Type",
            "Terminate Resources",
          ].map((item, i) => (
            <div
              key={i}
              className={`
                group flex items-center gap-3
                p-3 rounded-lg text-sm font-medium
                cursor-pointer transition-all
                ${textMuted} ${hoverItem}
              `}
            >
              {/* Accent Bar */}
              <div
                className={`
                  w-1 h-6 rounded-full
                  bg-indigo-500/0
                  group-hover:bg-indigo-500
                  transition-colors
                `}
              />

              {/* Icon */}
              <span className="text-xs opacity-70">⎈</span>

              {/* Label */}
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className={`mt-auto pt-6 border-t ${borderClass}`}>
          <p className={`text-[11px] mb-3 ${textMuted} tracking-wide`}>
            PREFERENCES
          </p>

          <button
            onClick={onToggleTheme}
            className={`
              w-full flex items-center justify-center gap-3
              p-3 rounded-xl border
              transition-all
              ${
                isDark
                  ? "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                  : "bg-black/5 border-black/10 text-zinc-600 hover:text-black hover:bg-black/10"
              }
            `}
          >
            <span className="text-lg">{isDark ? "☀" : "☾"}</span>
            <span className="text-sm font-semibold">
              {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </span>
          </button>
        </div>
      </aside>

      {/* BACKDROP */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;
