import React, { useState } from "react";

const stripAnsi = (str = "") =>
  str.replace(/\x1B\[[0-9;]*[mGK]/g, "");

const DeploymentFailureView = ({ failureData, theme }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!failureData) return null;

  const { failed_resource, created_resources = [], error } = failureData;

  return (
    <div className="mt-4 space-y-4 animate-in fade-in zoom-in-95 duration-300">

      {/* FAILURE HEADER */}
      <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5">
        <div className="text-rose-400 font-bold text-xs uppercase tracking-widest">
          Deployment Failed
        </div>

        {failed_resource && (
          <div className="mt-2 text-sm font-mono text-rose-300 break-all">
            🔴 {failed_resource}
          </div>
        )}
      </div>

      {/* SUCCESSFULLY CREATED */}
      {created_resources.length > 0 && (
        <div className={`p-3 rounded-xl border ${
          theme === "dark"
            ? "border-white/10 bg-black/40"
            : "border-black/10 bg-white"
        }`}>
          <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">
            Successfully Created
          </div>

          <div className="space-y-1 font-mono text-xs">
            {created_resources.map((res, i) => (
              <div key={i} className="text-emerald-300 truncate">
                ✓ {res}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERROR DETAILS */}
      <div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white transition"
        >
          {showDetails ? "Hide Error Details" : "Show Error Details"}
        </button>

        {showDetails && (
          <div className={`mt-2 p-3 rounded-xl border font-mono text-[11px] max-h-48 overflow-y-auto ${
            theme === "dark"
              ? "bg-black/40 border-white/10 text-rose-300"
              : "bg-white border-black/10 text-rose-600"
          }`}>
            {stripAnsi(error)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeploymentFailureView;