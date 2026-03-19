// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { apiFetch } from "../utils/api";

// // ── ANSI escape code stripper ────────────────────────────────────────────────
// const stripAnsi = (str = "") =>
//   str.replace(/\x1B\[[0-9;]*[mGKHF]/g, "").replace(/\x1B\][^\x07]*\x07/g, "");

// // ── Stage display config ─────────────────────────────────────────────────────
// const STAGE_META = {
//   init:    { label: "Init",    color: "text-indigo-400",  dot: "bg-indigo-400" },
//   plan:    { label: "Plan",    color: "text-amber-400",   dot: "bg-amber-400"  },
//   show:    { label: "Show",    color: "text-zinc-400",    dot: "bg-zinc-400"   },
//   apply:   { label: "Apply",   color: "text-emerald-400", dot: "bg-emerald-400"},
//   destroy: { label: "Destroy", color: "text-rose-400",    dot: "bg-rose-400"   },
//   cost:    { label: "Cost",    color: "text-teal-400",    dot: "bg-teal-400"   },
// };

// const POLL_INTERVAL_ACTIVE = 2000;   // 2s while job is running
// const POLL_INTERVAL_DONE   = 0;      // stop when job is terminal

// // ── Component ────────────────────────────────────────────────────────────────
// const LogPanel = ({ isOpen, onClose, jobId, jobMode, jobStatus, theme }) => {
//   const [logs, setLogs]         = useState({});   // { stage: [{stream, log_text, logged_at}] }
//   const [stages, setStages]     = useState([]);
//   const [activeStage, setActiveStage] = useState(null);
//   const [loading, setLoading]   = useState(false);
//   const [error, setError]       = useState(null);
//   const bottomRef               = useRef(null);
//   const pollRef                 = useRef(null);
//   const prevJobId               = useRef(null);

//   const isTerminal = ["COMPLETED", "FAILED", "DISCARDED"].includes(jobStatus);

//   // ── Fetch logs ─────────────────────────────────────────────────────────────
//   const fetchLogs = useCallback(async (id) => {
//     if (!id) return;
//     try {
//       const data = await apiFetch(`/logs/${id}`);
//       if (data.stages?.length) {
//         setStages(data.stages);
//         setLogs(data.logs);
//         // Auto-select last stage (most recent activity)
//         setActiveStage((prev) => prev && data.stages.includes(prev) ? prev : data.stages[data.stages.length - 1]);
//       }
//       setError(null);
//     } catch (e) {
//       setError("Failed to load logs.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // ── Start / stop polling ───────────────────────────────────────────────────
//   useEffect(() => {
//     if (!isOpen || !jobId) {
//       clearInterval(pollRef.current);
//       return;
//     }

//     // Reset state when job changes
//     if (jobId !== prevJobId.current) {
//       setLogs({});
//       setStages([]);
//       setActiveStage(null);
//       setLoading(true);
//       prevJobId.current = jobId;
//     }

//     fetchLogs(jobId);

//     if (!isTerminal) {
//       pollRef.current = setInterval(() => fetchLogs(jobId), POLL_INTERVAL_ACTIVE);
//     }

//     return () => clearInterval(pollRef.current);
//   }, [isOpen, jobId, isTerminal, fetchLogs]);

//   // ── Auto-scroll to bottom when new logs arrive ─────────────────────────────
//   useEffect(() => {
//     if (isOpen) {
//       bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [logs, activeStage, isOpen]);

//   // ── Helpers ────────────────────────────────────────────────────────────────
//   const activeEntries = (logs[activeStage] || []);

//   const stageMeta = (s) => STAGE_META[s] || { label: s, color: "text-zinc-400", dot: "bg-zinc-400" };

//   const panelTitle = () => {
//     if (!jobId) return "Logs";
//     if (jobMode === "plan")    return "Terraform Plan Logs";
//     if (jobMode === "apply")   return "Deployment Logs";
//     if (jobMode === "destroy") return "Destruction Logs";
//     return "Terraform Logs";
//   };

//   const statusPill = () => {
//     if (!jobStatus) return null;
//     const map = {
//       RUNNING:   "text-amber-400 bg-amber-400/10 border-amber-400/20",
//       COMPLETED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
//       FAILED:    "text-rose-400 bg-rose-400/10 border-rose-400/20",
//     };
//     const cls = map[jobStatus] || "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
//     return (
//       <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${cls}`}>
//         {jobStatus === "RUNNING" && (
//           <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1.5 mb-0.5" />
//         )}
//         {jobStatus}
//       </span>
//     );
//   };

//   // ── Render ─────────────────────────────────────────────────────────────────
//   return (
//     <>
//       {/* Backdrop — only on mobile */}
//       {isOpen && (
//         <div
//           className="fixed inset-0 bg-black/40 z-30 sm:hidden"
//           onClick={onClose}
//         />
//       )}

//       {/* Panel */}
//       <div
//         className={`
//           fixed top-0 right-0 h-full z-40
//           flex flex-col
//           w-full sm:w-[480px] lg:w-[540px]
//           transition-transform duration-300 ease-in-out
//           ${isOpen ? "translate-x-0" : "translate-x-full"}
//           ${theme === "dark"
//             ? "bg-[#0d0d0d] border-l border-white/10 text-white"
//             : "bg-white border-l border-zinc-200 text-zinc-900"}
//         `}
//       >
//         {/* ── Header ── */}
//         <div className={`
//           h-[60px] flex items-center justify-between px-5 shrink-0
//           border-b ${theme === "dark" ? "border-white/10" : "border-zinc-200"}
//         `}>
//           <div className="flex items-center gap-3">
//             {/* Terminal icon */}
//             <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
//               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
//               className="text-zinc-400 shrink-0">
//               <polyline points="4 17 10 11 4 5" />
//               <line x1="12" y1="19" x2="20" y2="19" />
//             </svg>
//             <span className="font-semibold text-sm">{panelTitle()}</span>
//             {statusPill()}
//           </div>

//           <button
//             onClick={onClose}
//             className={`p-1.5 rounded-lg transition-colors
//               ${theme === "dark"
//                 ? "text-zinc-400 hover:text-white hover:bg-white/10"
//                 : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"}`}
//           >
//             <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
//               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <line x1="18" y1="6" x2="6" y2="18" />
//               <line x1="6" y1="6" x2="18" y2="18" />
//             </svg>
//           </button>
//         </div>

//         {/* ── Stage tabs ── */}
//         {stages.length > 0 && (
//           <div className={`
//             flex gap-1 px-4 pt-3 pb-0 shrink-0 overflow-x-auto
//             border-b ${theme === "dark" ? "border-white/5" : "border-zinc-100"}
//           `}>
//             {stages.map((s) => {
//               const meta = stageMeta(s);
//               const isActive = s === activeStage;
//               return (
//                 <button
//                   key={s}
//                   onClick={() => setActiveStage(s)}
//                   className={`
//                     flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase
//                     tracking-widest whitespace-nowrap border-b-2 transition-colors
//                     ${isActive
//                       ? `${meta.color} border-current`
//                       : `text-zinc-500 border-transparent hover:text-zinc-300`}
//                   `}
//                 >
//                   <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? meta.dot : "bg-zinc-600"}`} />
//                   {meta.label}
//                   <span className={`ml-1 text-[10px] opacity-60`}>
//                     {(logs[s] || []).length}
//                   </span>
//                 </button>
//               );
//             })}
//           </div>
//         )}

//         {/* ── Log body ── */}
//         <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-700">

//           {/* Empty / loading states */}
//           {loading && (
//             <div className="flex items-center gap-2 text-zinc-500 text-xs mt-8 justify-center">
//               <span className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
//               Waiting for logs...
//             </div>
//           )}

//           {!loading && !jobId && (
//             <div className="text-center mt-12 text-zinc-600 text-sm">
//               No active job. Trigger a plan, deploy, or destroy to see logs here.
//             </div>
//           )}

//           {!loading && jobId && stages.length === 0 && (
//             <div className="flex items-center gap-2 text-zinc-500 text-xs mt-8 justify-center">
//               <span className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
//               {isTerminal ? "No logs recorded for this job." : "Waiting for Terraform to start..."}
//             </div>
//           )}

//           {error && (
//             <div className="text-rose-400 text-xs mt-4 px-2">{error}</div>
//           )}

//           {/* Log entries */}
//           {activeEntries.length > 0 && (
//             <div className={`
//               font-mono text-[11px] leading-relaxed rounded-xl p-4
//               ${theme === "dark" ? "bg-black/60 text-zinc-300" : "bg-zinc-50 text-zinc-700"}
//             `}>
//               {activeEntries.map((entry, i) => {
//                 const isStderr = entry.stream === "stderr";
//                 const lines = stripAnsi(entry.log_text).split("\n");
//                 return (
//                   <div key={i} className="mb-3 last:mb-0">
//                     {/* Stream badge */}
//                     {isStderr && (
//                       <div className="text-[9px] uppercase tracking-widest text-rose-400/70 mb-1">
//                         stderr
//                       </div>
//                     )}
//                     {lines.map((line, j) => {
//                       if (!line.trim()) return <div key={j} className="h-2" />;

//                       // Colour-code meaningful lines
//                       let lineClass = isStderr ? "text-rose-300/90" : "text-zinc-300";

//                       if (/^\s*\+/.test(line) || /will be created/i.test(line))
//                         lineClass = "text-emerald-400";
//                       else if (/^\s*-/.test(line) || /will be destroyed/i.test(line))
//                         lineClass = "text-rose-400";
//                       else if (/^\s*~/.test(line) || /will be updated/i.test(line))
//                         lineClass = "text-amber-400";
//                       else if (/^(Error|error)/i.test(line.trim()))
//                         lineClass = "text-rose-300 font-semibold";
//                       else if (/^(Apply complete|Plan:|Destroy complete)/i.test(line.trim()))
//                         lineClass = "text-emerald-300 font-semibold";
//                       else if (/^Terraform will perform/i.test(line.trim()))
//                         lineClass = "text-indigo-300";

//                       return (
//                         <div key={j} className={`${lineClass} break-all`}>
//                           {line}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 );
//               })}
//               <div ref={bottomRef} />
//             </div>
//           )}
//         </div>

//         {/* ── Footer — copy button ── */}
//         {activeEntries.length > 0 && (
//           <div className={`
//             px-4 py-3 shrink-0 flex justify-between items-center
//             border-t ${theme === "dark" ? "border-white/10" : "border-zinc-200"}
//           `}>
//             <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
//               {activeStage && stageMeta(activeStage).label} · {activeEntries.length} entr{activeEntries.length === 1 ? "y" : "ies"}
//             </span>
//             <button
//               onClick={() => {
//                 const text = activeEntries
//                   .map((e) => `[${e.stream}]\n${stripAnsi(e.log_text)}`)
//                   .join("\n\n");
//                 navigator.clipboard.writeText(text);
//               }}
//               className="text-[10px] font-bold uppercase tracking-widest text-zinc-500
//                 hover:text-zinc-200 transition-colors flex items-center gap-1.5"
//             >
//               <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
//                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
//                 <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
//               </svg>
//               Copy logs
//             </button>
//           </div>
//         )}
//       </div>
//     </>
//   );
// };

// export default LogPanel;


import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../utils/api";

// ── ANSI escape code stripper ────────────────────────────────────────────────
const stripAnsi = (str = "") =>
  str.replace(/\x1B\[[0-9;]*[mGKHF]/g, "").replace(/\x1B\][^\x07]*\x07/g, "");

// ── Stage display config ─────────────────────────────────────────────────────
const STAGE_META = {
  init:    { label: "Init",    color: "text-indigo-400",  dot: "bg-indigo-400" },
  plan:    { label: "Plan",    color: "text-amber-400",   dot: "bg-amber-400"  },
  show:    { label: "Show",    color: "text-zinc-400",    dot: "bg-zinc-400"   },
  apply:   { label: "Apply",   color: "text-emerald-400", dot: "bg-emerald-400"},
  destroy: { label: "Destroy", color: "text-rose-400",    dot: "bg-rose-400"   },
};

// Stages hidden from the tab bar — cost is fast and not useful to display
const HIDDEN_STAGES = new Set(["cost", "show", "error"]);

const POLL_INTERVAL_ACTIVE = 2000;   // 2s while job is running
const POLL_INTERVAL_DONE   = 0;      // stop when job is terminal

// ── Component ────────────────────────────────────────────────────────────────
const LogPanel = ({ isOpen, onClose, jobId, jobMode, jobStatus, theme }) => {
  const [logs, setLogs]         = useState({});   // { stage: [{stream, log_text, logged_at}] }
  const [stages, setStages]     = useState([]);
  const [activeStage, setActiveStage] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const bottomRef               = useRef(null);
  const pollRef                 = useRef(null);
  const prevJobId               = useRef(null);
  const userPickedStageRef      = useRef(false);  // true once user clicks a tab manually

  const isTerminal = ["COMPLETED", "FAILED", "DISCARDED"].includes(jobStatus);

  // ── Fetch logs ─────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (id) => {
    if (!id) return;
    try {
      const data = await apiFetch(`/logs/${id}`);
      if (data.stages?.length) {
        // Filter out hidden stages (cost, show, error) from tab display
        const visibleStages = data.stages.filter(s => !HIDDEN_STAGES.has(s));
        setStages(visibleStages);
        setLogs(data.logs);
        // Auto-switch to latest stage while running UNLESS the user manually picked one.
        // Once terminal the user can freely browse without it jumping away.
        setActiveStage((prev) => {
          const latestVisible = visibleStages[visibleStages.length - 1];
          if (!prev || !visibleStages.includes(prev)) return latestVisible;
          if (!userPickedStageRef.current) return latestVisible;   // follow latest
          return prev;   // respect manual pick
        });
      }
      setError(null);
    } catch (e) {
      setError("Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Start / stop polling ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !jobId) {
      clearInterval(pollRef.current);
      return;
    }

    // Reset state when job changes
    if (jobId !== prevJobId.current) {
      setLogs({});
      setStages([]);
      setActiveStage(null);
      setLoading(true);
      userPickedStageRef.current = false;   // reset manual pick on new job
      prevJobId.current = jobId;
    }

    fetchLogs(jobId);

    if (!isTerminal) {
      pollRef.current = setInterval(() => fetchLogs(jobId), POLL_INTERVAL_ACTIVE);
    }

    return () => clearInterval(pollRef.current);
  }, [isOpen, jobId, isTerminal, fetchLogs]);

  // ── Auto-scroll to bottom when new logs arrive ─────────────────────────────
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, activeStage, isOpen]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const activeEntries = (logs[activeStage] || []);

  const stageMeta = (s) => STAGE_META[s] || { label: s, color: "text-zinc-400", dot: "bg-zinc-400" };

  const panelTitle = () => {
    if (!jobId) return "Logs";
    if (jobMode === "plan")    return "Terraform Plan Logs";
    if (jobMode === "apply")   return "Deployment Logs";
    if (jobMode === "destroy") return "Destruction Logs";
    return "Terraform Logs";
  };

  const statusPill = () => {
    if (!jobStatus) return null;
    const map = {
      RUNNING:   "text-amber-400 bg-amber-400/10 border-amber-400/20",
      COMPLETED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      FAILED:    "text-rose-400 bg-rose-400/10 border-rose-400/20",
    };
    const cls = map[jobStatus] || "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
    return (
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${cls}`}>
        {jobStatus === "RUNNING" && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1.5 mb-0.5" />
        )}
        {jobStatus}
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop — only on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full z-40
          flex flex-col
          w-full sm:w-[480px] lg:w-[540px]
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          ${theme === "dark"
            ? "bg-[#0d0d0d] border-l border-white/10 text-white"
            : "bg-white border-l border-zinc-200 text-zinc-900"}
        `}
      >
        {/* ── Header ── */}
        <div className={`
          h-[60px] flex items-center justify-between px-5 shrink-0
          border-b ${theme === "dark" ? "border-white/10" : "border-zinc-200"}
        `}>
          <div className="flex items-center gap-3">
            {/* Terminal icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-zinc-400 shrink-0">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <span className="font-semibold text-sm">{panelTitle()}</span>
            {statusPill()}
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors
              ${theme === "dark"
                ? "text-zinc-400 hover:text-white hover:bg-white/10"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Stage tabs ── */}
        {stages.length > 0 && (
          <div className={`
            flex gap-1 px-4 pt-3 pb-0 shrink-0 overflow-x-auto
            border-b ${theme === "dark" ? "border-white/5" : "border-zinc-100"}
          `}>
            {stages.filter(s => !HIDDEN_STAGES.has(s)).map((s) => {
              const meta = stageMeta(s);
              const isActive = s === activeStage;
              return (
                <button
                  key={s}
                  onClick={() => {
                    userPickedStageRef.current = true;
                    setActiveStage(s);
                  }}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase
                    tracking-widest whitespace-nowrap border-b-2 transition-colors
                    ${isActive
                      ? `${meta.color} border-current`
                      : `text-zinc-500 border-transparent hover:text-zinc-300`}
                  `}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? meta.dot : "bg-zinc-600"}`} />
                  {meta.label}
                  <span className={`ml-1 text-[10px] opacity-60`}>
                    {(logs[s] || []).length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Log body ── */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-700">

          {/* Empty / loading states */}
          {loading && (
            <div className="flex items-center gap-2 text-zinc-500 text-xs mt-8 justify-center">
              <span className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
              Waiting for logs...
            </div>
          )}

          {!loading && !jobId && (
            <div className="text-center mt-12 text-zinc-600 text-sm">
              No active job. Trigger a plan, deploy, or destroy to see logs here.
            </div>
          )}

          {!loading && jobId && stages.length === 0 && (
            <div className="flex items-center gap-2 text-zinc-500 text-xs mt-8 justify-center">
              <span className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
              {isTerminal ? "No logs recorded for this job." : "Waiting for Terraform to start..."}
            </div>
          )}

          {error && (
            <div className="text-rose-400 text-xs mt-4 px-2">{error}</div>
          )}

          {/* Log entries */}
          {activeEntries.length > 0 && (
            <div className={`
              font-mono text-[11px] leading-relaxed rounded-xl p-4
              ${theme === "dark" ? "bg-black/60 text-zinc-300" : "bg-zinc-50 text-zinc-700"}
            `}>
              {activeEntries.map((entry, i) => {
                const isStderr = entry.stream === "stderr";
                const lines = stripAnsi(entry.log_text).split("\n");
                return (
                  <div key={i} className="mb-3 last:mb-0">
                    {/* Stream badge */}
                    {isStderr && (
                      <div className="text-[9px] uppercase tracking-widest text-rose-400/70 mb-1">
                        stderr
                      </div>
                    )}
                    {lines.map((line, j) => {
                      if (!line.trim()) return <div key={j} className="h-2" />;

                      // Colour-code meaningful lines
                      let lineClass = isStderr ? "text-rose-300/90" : "text-zinc-300";

                      if (/^\s*\+/.test(line) || /will be created/i.test(line))
                        lineClass = "text-emerald-400";
                      else if (/^\s*-/.test(line) || /will be destroyed/i.test(line))
                        lineClass = "text-rose-400";
                      else if (/^\s*~/.test(line) || /will be updated/i.test(line))
                        lineClass = "text-amber-400";
                      else if (/^(Error|error)/i.test(line.trim()))
                        lineClass = "text-rose-300 font-semibold";
                      else if (/^(Apply complete|Plan:|Destroy complete)/i.test(line.trim()))
                        lineClass = "text-emerald-300 font-semibold";
                      else if (/^Terraform will perform/i.test(line.trim()))
                        lineClass = "text-indigo-300";

                      return (
                        <div key={j} className={`${lineClass} break-all`}>
                          {line}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── Footer — copy button ── */}
        {activeEntries.length > 0 && (
          <div className={`
            px-4 py-3 shrink-0 flex justify-between items-center
            border-t ${theme === "dark" ? "border-white/10" : "border-zinc-200"}
          `}>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              {activeStage && stageMeta(activeStage).label} · {activeEntries.length} entr{activeEntries.length === 1 ? "y" : "ies"}
            </span>
            <button
              onClick={() => {
                const text = activeEntries
                  .map((e) => `[${e.stream}]\n${stripAnsi(e.log_text)}`)
                  .join("\n\n");
                navigator.clipboard.writeText(text);
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-500
                hover:text-zinc-200 transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy logs
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default LogPanel;
