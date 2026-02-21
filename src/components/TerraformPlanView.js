import React, { useState } from "react";

const TerraformPlanView = ({ planData, theme, onApprove }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rawStructured =
    planData?.resource_changes
      ? planData
      : planData?.terraformPlan || planData;

  let structured = { resource_changes: [] };

  try {
    structured =
      typeof rawStructured === "string"
        ? JSON.parse(rawStructured)
        : rawStructured || { resource_changes: [] };
  } catch (e) {
    console.error("Plan parsing error:", e);
  }

  const changes = Array.isArray(structured.resource_changes)
    ? structured.resource_changes
    : [];

  // 🔥 Extract ALL resources from planned_values
  const allResources = Array.isArray(structured.resource_changes)
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
    if (onApprove) {
      onApprove(); // directly call backend trigger
    }
  };

  const handleDiscard = () => {
    // Optional: you can notify Lex here if you want
    window.location.reload(); // simple reset for now
  };

  return (
    <div className="mt-4 space-y-4 w-full animate-in fade-in zoom-in-95 duration-300">
      {/* SUMMARY */}
      <div className="flex gap-4 text-[10px] font-bold font-mono uppercase tracking-widest border-b border-white/5 pb-2">
        <span className="text-emerald-500">{summary.create} to add</span>
        <span className="text-amber-500">{summary.update} to change</span>
        <span className="text-rose-500">{summary.delete} to destroy</span>
      </div>

      {/* RESOURCE LIST (ALWAYS SHOWN) */}
      <div
        className={`p-3 rounded-xl border font-mono text-[11px] max-h-64 overflow-y-auto ${
          theme === "dark"
            ? "bg-black/40 border-white/10 text-zinc-300"
            : "bg-white border-black/10 text-zinc-700"
        }`}
      >
        {allResources.length === 0 ? (
          <div className="py-4 text-center opacity-50 italic">
            No resources found in plan.
          </div>
        ) : (
          allResources.map((res, i) => {
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
              <div
                key={i}
                className="mb-1.5 flex items-start gap-2 group"
              >
                <span className={`${colorClass} font-bold shrink-0`}>
                  {icon}
                </span>
                <span className="truncate opacity-80 group-hover:opacity-100 transition-opacity">
                  {res.address || `${res.type}.${res.name}`}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col gap-2">
        <button
          disabled={isSubmitting}
          onClick={() => handleConfirm()}
          className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg ${
            isSubmitting
              ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-[0.98]"
          }`}
        >
          {isSubmitting
            ? "Initiating Deployment..."
            : "Confirm & Deploy"}
        </button>

        {!isSubmitting && (
          <button
            onClick={() => handleDiscard()}
            className="w-full py-2 text-zinc-500 hover:text-rose-400 text-[10px] font-bold uppercase tracking-tighter transition-colors"
          >
            Discard Infrastructure Plan
          </button>
        )}
      </div>
    </div>
  );
};

export default TerraformPlanView;