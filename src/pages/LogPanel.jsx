import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../utils/api";

const stripAnsi = (str = "") =>
  str.replace(/\x1B\[[0-9;]*[mGKHF]/g, "").replace(/\x1B\][^\x07]*\x07/g, "");

const STAGE_ORDER = ["init", "plan", "apply", "destroy"];

const STAGE_META = {
  init: { label: "Init", color: "text-indigo-400", dot: "bg-indigo-400" },
  plan: { label: "Plan", color: "text-amber-400", dot: "bg-amber-400" },
  apply: { label: "Apply", color: "text-emerald-400", dot: "bg-emerald-400" },
  destroy: { label: "Destroy", color: "text-rose-400", dot: "bg-rose-400" },
};

const LogPanel = ({ isOpen, onClose, projectId, theme }) => {
  const [chunks, setChunks] = useState([]);
  const [activeStage, setActiveStage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const pollRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const bottomRef = useRef(null);

  const fetchProjectLogs = useCallback(async (id) => {
    if (!id) return;
    try {
      const data = await apiFetch(`/logs/project/${id}`);
      if (data?.chunks) {
        setChunks(data.chunks);
        const latestAvailable = [...STAGE_ORDER]
          .reverse()
          .find((s) => data.chunks.some((c) => c.stage === s));
        setActiveStage((prev) => prev || latestAvailable || "init");
      }
    } catch (err) {
      console.error("Failed to fetch timeline logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Detect manual scroll to toggle auto-scroll state
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Check if the user is within 50px of the bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    setIsAutoScrollEnabled(isAtBottom);
  };

  useEffect(() => {
    if (!isOpen || !projectId) return;

    setLoading(true);
    fetchProjectLogs(projectId);
    pollRef.current = setInterval(() => fetchProjectLogs(projectId), 3000);

    return () => clearInterval(pollRef.current);
  }, [isOpen, projectId, fetchProjectLogs]);

  // 2. Controlled auto-scroll
  useEffect(() => {
    if (isAutoScrollEnabled && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chunks, activeStage, isAutoScrollEnabled]);

  const visibleStages = STAGE_ORDER.filter((s) => chunks.some((c) => c.stage === s));
  const activeChunks = chunks.filter((c) => c.stage === activeStage);

  return (
    <div
      className={`fixed right-0 top-0 h-full w-[520px] z-[70] shadow-2xl border-l transition-transform duration-300 ease-in-out
      ${theme === "dark" ? "bg-[#09090b] border-white/10 text-white" : "bg-white border-zinc-200 text-black"}
      ${isOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
        <div className="flex flex-col">
          <span className="font-bold text-[10px] uppercase tracking-widest text-zinc-500">Project Timeline Logs</span>
          <span className="text-xs font-mono text-indigo-400 mt-0.5 truncate max-w-[350px]">
            {projectId}
          </span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">✕</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 bg-black/40 border-b border-white/5 overflow-x-auto no-scrollbar">
        {visibleStages.map((stage) => (
          <button
            key={stage}
            onClick={() => {
              setActiveStage(stage);
              setIsAutoScrollEnabled(true); // Re-enable auto-scroll when changing stages
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-bold uppercase transition-all
            ${activeStage === stage ? `${STAGE_META[stage].color} bg-white/5 border border-white/10 shadow-sm` : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <div className={`w-1 h-1 rounded-full ${STAGE_META[stage].dot} ${activeStage === stage ? "animate-pulse" : "opacity-50"}`} />
            {STAGE_META[stage].label}
          </button>
        ))}
      </div>

      {/* Terminal Area with Scroll Listener */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="p-4 overflow-y-auto h-[calc(100%-115px)] font-mono text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {loading && <div className="text-indigo-400 animate-pulse mb-4 text-[10px]">Syncing infrastructure state...</div>}

        {activeChunks.map((chunk, i) => {
          const lines = stripAnsi(chunk.text || "").split("\n");
          return (
            <div key={i} className="mb-2">
              {lines.map((line, j) => (
                <div key={j} className={`${chunk.stream === "stderr" ? "text-rose-400" : "text-zinc-300"} min-h-[1.2rem] break-all`}>
                  {line}
                </div>
              ))}
            </div>
          );
        })}
        <div ref={bottomRef} className="h-10" />

        {/* 3. Helper UI: Show a floating button if auto-scroll is disabled and new logs arrive */}
        {!isAutoScrollEnabled && chunks.length > 0 && (
          <button 
            onClick={() => setIsAutoScrollEnabled(true)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-xl animate-bounce border border-indigo-400"
          >
            ↓ New Updates
          </button>
        )}
      </div>
    </div>
  );
};

export default LogPanel;