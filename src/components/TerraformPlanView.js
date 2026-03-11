import React, { useState } from "react";

const TerraformPlanView = ({
  planData,
  theme,
  onApprove,
  onCalculateCost,
  onDiscard,
  costData,
  planStatus
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false); // 🔥 Added loading state for cost

  let structured = { resource_changes: [] };

  try {
    structured =
      typeof planData === "string"
        ? JSON.parse(planData)
        : planData || { resource_changes: [] };
  } catch (e) {
    console.error("Plan parsing error:", e);
  }

  const changes = Array.isArray(structured.resource_changes)
    ? structured.resource_changes
    : [];

  const summary = changes.reduce(
    (acc, curr) => {
      const action = curr.change?.actions?.[0];
      if (action === "create") acc.create++;
      if (action === "update" || action === "no-op") acc.update++;
      if (action === "delete") acc.delete++;
      return acc;
    },
    { create: 0, update: 0, delete: 0 }
  );

  const handleConfirm = () => {
    setIsSubmitting(true);
    if (onApprove) onApprove();
  };

  const handleCalculateCost = (e) => {
    e.preventDefault();
    setIsCalculating(true); // 🔥 Trigger loading spinner
    if (onCalculateCost) onCalculateCost();
    
    // Safety fallback: turn off spinner after 15 seconds just in case of network drop
    setTimeout(() => setIsCalculating(false), 15000); 
  };

  const handleDiscard = (e) => {
    e.preventDefault(); 
    if (onDiscard) {
      onDiscard(); 
    }
  };

  const isInteractive = onCalculateCost || onApprove;

  const renderStatusBadge = () => {
    let text = "Status: Plan Generated (Not Deployed)";
    let colors = "text-zinc-500 bg-zinc-500/5 border-zinc-500/20"; 

    if (planStatus === "DEPLOYED") {
      text = "Status: Successfully Deployed";
      colors = "text-emerald-500 bg-emerald-500/5 border-emerald-500/20"; 
    } else if (planStatus === "DEPLOYMENT_FAILED") {
      text = "Status: Deployment Failed";
      colors = "text-rose-500 bg-rose-500/5 border-rose-500/20"; 
    } else if (planStatus === "DISCARDED") {
      text = "Status: Plan Discarded";
      colors = "text-amber-500 bg-amber-500/5 border-amber-500/20"; 
    }

    return (
      <div className={`w-full py-2.5 text-center text-[10px] font-bold uppercase tracking-widest border rounded-xl ${colors}`}>
        {text}
      </div>
    );
  };

  return (
    <div className="mt-4 space-y-4 w-full animate-in fade-in zoom-in-95 duration-300">
      {/* SUMMARY */}
      <div className="flex gap-4 text-[10px] font-bold font-mono uppercase tracking-widest border-b border-white/5 pb-2">
        <span className="text-emerald-500">{summary.create} to add</span>
        <span className="text-amber-500">{summary.update} to change</span>
        <span className="text-rose-500">{summary.delete} to destroy</span>
      </div>

      {/* RESOURCE LIST */}
      <div
        className={`p-3 rounded-xl border font-mono text-[11px] max-h-64 overflow-y-auto ${
          theme === "dark"
            ? "bg-black/40 border-white/10 text-zinc-300"
            : "bg-white border-black/10 text-zinc-700"
        }`}
      >
        {changes.length === 0 ? (
          <div className="py-4 text-center opacity-50 italic">
            No resources found in plan.
          </div>
        ) : (
          changes.map((res, i) => {
            const action = res.change?.actions?.[0] || "update";
            let icon = "(=)";
            let colorClass = "text-zinc-400";

            if (action === "create") {
              icon = "(+)";
              colorClass = "text-emerald-400";
            } else if (action === "delete") {
              icon = "(-)";
              colorClass = "text-rose-400";
            } else if (action === "update") {
              icon = "(~)";
              colorClass = "text-amber-400";
            }

            return (
              <div key={i} className="mb-1.5 flex items-start gap-2">
                <span className={`${colorClass} font-bold shrink-0`}>
                  {icon}
                </span>
                <span className="truncate opacity-80">
                  {res.address || `${res.type}.${res.name}`}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* ACTION SECTION */}
      <div className="space-y-3">
        {costData && (
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center">
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
              Estimated Monthly Cost
            </div>
            <div className="text-xl font-bold mt-1 text-emerald-300">
              ${costData.monthly_cost?.toFixed(2) || "0.00"}
            </div>
            <div className="text-[9px] opacity-60 mt-1">
              Currency: {costData.currency || "USD"}
            </div>
          </div>
        )}

        {isInteractive ? (
          <>
            {!costData ? (
              <button
                type="button"
                disabled={isSubmitting || isCalculating}
                onClick={handleCalculateCost} // 🔥 Updated handler
                className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex justify-center items-center shadow-lg ${
                  isCalculating
                    ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-[0.98]"
                }`}
              >
                {isCalculating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Calculating...
                  </span>
                ) : (
                  "Calculate Cost Estimate"
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirm}
                className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex justify-center items-center shadow-lg ${
                  isSubmitting
                    ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 active:scale-[0.98]"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Initiating Deployment...
                  </span>
                ) : (
                  "Approve & Deploy"
                )}
              </button>
            )}

            {!isSubmitting && !isCalculating && (
              <button
                type="button"
                onClick={handleDiscard}
                className="w-full py-2 text-zinc-500 hover:text-amber-500 text-[10px] font-bold uppercase tracking-tighter transition-colors"
              >
                Discard Infrastructure Plan
              </button>
            )}
          </>
        ) : (
          renderStatusBadge()
        )}
      </div>
    </div>
  );
};

export default TerraformPlanView;