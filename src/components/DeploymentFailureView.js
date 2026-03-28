import React from "react";

// ── Category badge config ────────────────────────────────────────────────────
const CATEGORY_META = {
  permissions:       { label: "IAM / Permissions",   color: "text-amber-400  bg-amber-400/10  border-amber-400/25"  },
  resource_conflict: { label: "Resource Conflict",    color: "text-orange-400 bg-orange-400/10 border-orange-400/25" },
  config_error:      { label: "Config Error",         color: "text-rose-400   bg-rose-400/10   border-rose-400/25"   },
  state_error:       { label: "State Error",          color: "text-purple-400 bg-purple-400/10 border-purple-400/25" },
  unknown:           { label: "Unknown",              color: "text-zinc-400   bg-zinc-400/10   border-zinc-400/25"   },
};

const CategoryBadge = ({ category }) => {
  const meta = CATEGORY_META[category] || CATEGORY_META.unknown;
  return (
    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${meta.color}`}>
      {meta.label}
    </span>
  );
};

// ── Loading skeleton ─────────────────────────────────────────────────────────
const AiLoadingSkeleton = () => (
  <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
    <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">
      <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      AI is analysing the failure…
    </div>
    <div className="space-y-2">
      <div className="h-3 rounded bg-indigo-400/10 animate-pulse w-4/5" />
      <div className="h-3 rounded bg-indigo-400/10 animate-pulse w-3/5" />
      <div className="h-3 rounded bg-indigo-400/10 animate-pulse w-2/3" />
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const DeploymentFailureView = ({ failureData, aiAnalysis, isAiLoading = false }) => {
  if (!failureData) return null;

  // Extract failed resource / created resources if failureData is an object
  let failedRes = null;
  let createdRes = [];

  if (typeof failureData === "object" && failureData !== null) {
    failedRes = failureData.failed_resource || null;
    createdRes = Array.isArray(failureData.created_resources)
      ? failureData.created_resources
      : [];
  }

  return (
    <div className="mt-4 space-y-4 animate-in fade-in zoom-in-95 duration-300">

      {/* ── Failure header ── */}
      <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-widest">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Deployment Failed
        </div>
        {failedRes && (
          <div className="mt-2 text-sm font-mono text-rose-300 break-all">
            {failedRes}
          </div>
        )}
      </div>

      {/* ── Successfully created resources (partial deploy) ── */}
      {createdRes.length > 0 && (
        <div className="p-3 rounded-xl border border-white/10 bg-black/40">
          <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">
            Successfully Created
          </div>
          <div className="space-y-1 font-mono text-xs">
            {createdRes.map((res, i) => (
              <div key={i} className="text-emerald-300 truncate">✓ {res}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI analysis ── */}
      {/* Show skeleton while waiting, full result once available */}
      {isAiLoading && !aiAnalysis && <AiLoadingSkeleton />}

      {aiAnalysis && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-3">

          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              AI Analysis
            </div>
            {aiAnalysis.category && (
              <CategoryBadge category={aiAnalysis.category} />
            )}
          </div>

          {/* Root cause */}
          {aiAnalysis.root_cause && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">
                Root cause
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed">
                {aiAnalysis.root_cause}
              </p>
            </div>
          )}

          {/* Fix steps */}
          {Array.isArray(aiAnalysis.fix_steps) && aiAnalysis.fix_steps.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">
                Suggested fixes
              </div>
              <ol className="space-y-2">
                {aiAnalysis.fix_steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-300 leading-relaxed">
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full
                      bg-indigo-500/20 border border-indigo-500/30 text-indigo-400
                      text-[10px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default DeploymentFailureView;
