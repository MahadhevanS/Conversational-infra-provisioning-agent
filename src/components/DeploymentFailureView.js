import React, { useState } from "react";

const stripAnsi = (str = "") => {
  if (typeof str !== "string") return JSON.stringify(str, null, 2);
  return str.replace(/\x1B\[[0-9;]*[mGK]/g, "");
};

const DeploymentFailureView = ({ failureData, theme }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!failureData) return null;

  // 🔥 BULLETPROOF EXTRACTION: Handle both Strings and Objects
  let errorMessage = "An unknown error occurred.";
  let failedRes = null;
  let createdRes = [];

  if (typeof failureData === "string") {
    errorMessage = failureData;
  } else if (typeof failureData === "object") {
    errorMessage = failureData.error || failureData.error_message || JSON.stringify(failureData, null, 2);
    failedRes = failureData.failed_resource;
    createdRes = Array.isArray(failureData.created_resources) ? failureData.created_resources : [];
  }

  return (
    <div className="mt-4 space-y-4 animate-in fade-in zoom-in-95 duration-300">

      {/* FAILURE HEADER */}
      <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-widest">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Deployment Failed
        </div>

        {failedRes && (
          <div className="mt-2 text-sm font-mono text-rose-300 break-all">
            🔴 {failedRes}
          </div>
        )}
      </div>

      {/* SUCCESSFULLY CREATED */}
      {createdRes.length > 0 && (
        <div className={`p-3 rounded-xl border ${
          theme === "dark"
            ? "border-white/10 bg-black/40"
            : "border-black/10 bg-white"
        }`}>
          <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">
            Successfully Created
          </div>

          <div className="space-y-1 font-mono text-xs">
            {createdRes.map((res, i) => (
              <div key={i} className="text-emerald-300 truncate">
                ✓ {res}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERROR DETAILS (Terminal Window) */}
      <div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          {showDetails ? "Hide Error Logs" : "View Error Logs"}
        </button>

        {showDetails && (
          <div className="mt-3 p-4 bg-[#0a0a0a] rounded-xl border border-rose-500/20 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 shadow-inner">
            <pre className="text-[10px] font-mono text-rose-300/80 whitespace-pre-wrap break-words">
              {stripAnsi(errorMessage)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeploymentFailureView;