import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../utils/api";

const stripAnsi = (str = "") =>
  str.replace(/\x1B\[[0-9;]*[mGKHF]/g, "").replace(/\x1B\][^\x07]*\x07/g, "");

const STAGE_META = {
  init:    { label: "Init",    color: "text-indigo-400",  dot: "bg-indigo-400" },
  plan:    { label: "Plan",    color: "text-amber-400",   dot: "bg-amber-400"  },
  apply:   { label: "Apply",   color: "text-emerald-400", dot: "bg-emerald-400"},
  destroy: { label: "Destroy", color: "text-rose-400",    dot: "bg-rose-400"   },
  show:    { label: "Show",    color: "text-zinc-400",    dot: "bg-zinc-400"   },
  cost:    { label: "Cost",    color: "text-sky-400",     dot: "bg-sky-400"    },
  error:   { label: "Error",   color: "text-rose-400",    dot: "bg-rose-400"   },
};

const VISIBLE_STAGES = new Set(["init", "plan", "apply", "destroy"]);
const POLL_INTERVAL = 2000;

function lineClass(line, isStderr) {
  if (isStderr) return "text-rose-300/90";
  if (/^\s*\+/.test(line) || /will be created/i.test(line))        return "text-emerald-400";
  if (/^\s*-/.test(line) || /will be destroyed/i.test(line))       return "text-rose-400";
  if (/^\s*~/.test(line) || /will be updated/i.test(line))         return "text-amber-400";
  if (/^(Error|error)/i.test(line.trim()))                         return "text-rose-300 font-semibold";
  if (/^(Apply complete|Plan:|Destroy complete)/i.test(line.trim())) return "text-emerald-300 font-semibold";
  if (/^Terraform will perform/i.test(line.trim()))                return "text-indigo-300";
  return "text-zinc-300";
}

const LogPanel = ({ isOpen, onClose, jobId, jobMode, jobStatus, theme }) => {
  const [chunks, setChunks]             = useState([]);
  const [status, setStatus]             = useState(null);
  const [jobType, setJobType]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [activeStage, setActiveStage]   = useState(null);
  const [userPicked, setUserPicked]     = useState(false);

  const bottomRef  = useRef(null);
  const pollRef    = useRef(null);
  const prevJobId  = useRef(null);

  const isTerminal = ["COMPLETED", "FAILED", "DISCARDED"].includes(jobStatus || status);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (id) => {
    if (!id) return;
    try {
      const data = await apiFetch(`/logs/${id}`);
      if (data.chunks) {
        setChunks(data.chunks);
        setStatus(data.status);
        setJobType(data.job_type);

        // Auto-advance to latest visible stage unless user manually picked one
        const latestVisible = [...new Set(data.chunks.map(c => c.stage))]
          .filter(s => VISIBLE_STAGES.has(s))
          .pop();

        setActiveStage(prev => {
          if (!userPicked || !prev) return latestVisible || prev;
          // If user picked a stage that no longer exists in new data, reset
          const exists = data.chunks.some(c => c.stage === prev);
          return exists ? prev : latestVisible || prev;
        });
      }
      setError(null);
    } catch {
      setError("Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }, [userPicked]);

  // ── Start / stop polling ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !jobId) {
      clearInterval(pollRef.current);
      return;
    }

    // Reset state when job changes
    if (jobId !== prevJobId.current) {
      setChunks([]);
      setStatus(null);
      setJobType(null);
      setActiveStage(null);
      setUserPicked(false);
      setLoading(true);
      prevJobId.current = jobId;
    }

    fetchLogs(jobId);

    if (!isTerminal) {
      pollRef.current = setInterval(() => fetchLogs(jobId), POLL_INTERVAL);
    } else {
      clearInterval(pollRef.current);
    }

    return () => clearInterval(pollRef.current);
  }, [isOpen, jobId, isTerminal, fetchLogs]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chunks, activeStage, isOpen]);

  // ── Derived values ────────────────────────────────────────────────────────
  const visibleStages = [...new Set(
    chunks.map(c => c.stage).filter(s => VISIBLE_STAGES.has(s))
  )];

  const activeChunks = activeStage
    ? chunks.filter(c => c.stage === activeStage)
    : [];

  const allText = chunks
    .filter(c => VISIBLE_STAGES.has(c.stage))
    .map(c => `[${c.stage}/${c.stream}]\n${stripAnsi(c.text)}`)
    .join("\n\n");

  const effectiveStatus = jobStatus || status;

  const panelTitle = () => {
    if (!jobId) return "Logs";
    const t = jobType || "";
    if (jobMode === "plan"    || t === "PLAN")    return "Terraform Plan Logs";
    if (jobMode === "apply"   || t === "APPLY")   return "Deployment Logs";
    if (jobMode === "destroy" || t === "DESTROY") return "Destruction Logs";
    return "Terraform Logs";
  };

  const statusPill = () => {
    const s = effectiveStatus;
    if (!s) return null;
    const map = {
      RUNNING:   "text-amber-400 bg-amber-400/10 border-amber-400/20",
      COMPLETED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      FAILED:    "text-rose-400 bg-rose-400/10 border-rose-400/20",
    };
    const cls = map[s] || "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
    return (
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${cls}`}>
        {s === "RUNNING" && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1.5 mb-0.5" />
        )}
        {s}
      </span>
    );
  };

  const stageMeta = (s) => STAGE_META[s] || { label: s, color: "text-zinc-400", dot: "bg-zinc-400" };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 sm:hidden" onClick={onClose} />
      )}

      <div className={`
        fixed top-0 right-0 h-full z-40 flex flex-col
        w-full sm:w-[480px] lg:w-[540px]
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
        ${theme === "dark"
          ? "bg-[#0d0d0d] border-l border-white/10 text-white"
          : "bg-white border-l border-zinc-200 text-zinc-900"}
      `}>

        {/* ── Header ── */}
        <div className={`h-[60px] flex items-center justify-between px-5 shrink-0 border-b
          ${theme === "dark" ? "border-white/10" : "border-zinc-200"}`}>
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-zinc-400 shrink-0">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <span className="font-semibold text-sm">{panelTitle()}</span>
            {statusPill()}
          </div>
          <button onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors
              ${theme === "dark"
                ? "text-zinc-400 hover:text-white hover:bg-white/10"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Stage tabs ── */}
        {visibleStages.length > 1 && (
          <div className={`flex gap-1 px-4 pt-3 pb-0 shrink-0 overflow-x-auto border-b
            ${theme === "dark" ? "border-white/5" : "border-zinc-100"}`}>
            {visibleStages.map((s) => {
              const meta = stageMeta(s);
              const isActive = s === activeStage;
              const lineCount = chunks
                .filter(c => c.stage === s)
                .reduce((acc, c) => acc + (c.text || "").split("\n").filter(Boolean).length, 0);
              return (
                <button key={s}
                  onClick={() => { setUserPicked(true); setActiveStage(s); }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase
                    tracking-widest whitespace-nowrap border-b-2 transition-colors
                    ${isActive
                      ? `${meta.color} border-current`
                      : "text-zinc-500 border-transparent hover:text-zinc-300"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? meta.dot : "bg-zinc-600"}`} />
                  {meta.label}
                  <span className="ml-1 text-[10px] opacity-60">{lineCount}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Log body ── */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-700">

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

          {!loading && jobId && chunks.length === 0 && (
            <div className="flex items-center gap-2 text-zinc-500 text-xs mt-8 justify-center">
              <span className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
              {isTerminal ? "No logs recorded for this job." : "Waiting for Terraform to start..."}
            </div>
          )}

          {error && <div className="text-rose-400 text-xs mt-4 px-2">{error}</div>}

          {activeChunks.length > 0 && (
            <div className={`font-mono text-[11px] leading-relaxed rounded-xl p-4
              ${theme === "dark" ? "bg-black/60 text-zinc-300" : "bg-zinc-50 text-zinc-700"}`}>
              {activeChunks.map((chunk, ci) => {
                const isStderr = chunk.stream === "stderr";
                const lines = stripAnsi(chunk.text || "").split("\n");
                return (
                  <div key={ci} className="mb-3 last:mb-0">
                    {isStderr && (
                      <div className="text-[9px] uppercase tracking-widest text-rose-400/70 mb-1">
                        stderr
                      </div>
                    )}
                    {lines.map((line, li) => {
                      if (!line.trim()) return <div key={li} className="h-2" />;
                      return (
                        <div key={li} className={`${lineClass(line, isStderr)} break-all`}>
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

        {/* ── Footer ── */}
        {allText.trim().length > 0 && (
          <div className={`px-4 py-3 shrink-0 flex justify-between items-center border-t
            ${theme === "dark" ? "border-white/10" : "border-zinc-200"}`}>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              {activeStage ? stageMeta(activeStage).label : "All"} · {
                activeChunks.reduce((n, c) =>
                  n + (c.text || "").split("\n").filter(Boolean).length, 0)
              } line{activeChunks.reduce((n, c) =>
                n + (c.text || "").split("\n").filter(Boolean).length, 0) === 1 ? "" : "s"}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(allText)}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-500
                hover:text-zinc-200 transition-colors flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
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
