import React from "react";

const CostModal = ({ open, onClose, total, resources, theme }) => {
  if (!open) return null;
  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`
          w-[420px] max-w-[90%] border rounded-2xl shadow-2xl overflow-hidden
          ${isDark ? "bg-[#09090b] text-white border-zinc-800" : "bg-white text-zinc-900 border-zinc-200"}
        `}
      >
        {/* HEADER */}
        <div className={`flex justify-between items-center px-6 py-4 border-b ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
          <h3 className={`text-sm font-semibold tracking-widest ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
            COST ESTIMATION
          </h3>
          <button
            onClick={onClose}
            className={isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-900"}
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5">
          {/* TOTAL */}
          <div
            className={`
              rounded-xl p-5 text-center border
              ${isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"}
            `}
          >
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Monthly Total
            </p>
            <p className={`mt-2 text-3xl font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
              ${total}
            </p>
          </div>

          {/* RESOURCES */}
          <div className="flex flex-col gap-3">
            {resources.map((res, idx) => (
              <div
                key={idx}
                className={`
                  flex justify-between items-center px-4 py-3 rounded-lg border
                  ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}
                `}
              >
                <span className="text-sm">{res.name}</span>
                <span className="font-medium">${res.cost}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className={`px-6 py-4 text-xs text-center text-zinc-500 border-t ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
          Pricing may vary depending on AWS region and usage.
        </div>
      </div>
    </div>
  );
};

export default CostModal;