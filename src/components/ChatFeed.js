import React, { useEffect, useRef, useCallback } from "react";
import TerraformPlanView from "./TerraformPlanView";
import DeploymentFailureView from "./DeploymentFailureView";
import DeploymentSuccessView from "./DeploymentSuccessView";
import { useRealtimeInsert } from "../hooks/useSupabaseRealtime";

// ── Sender badge ─────────────────────────────────────────────────────────────
function SenderBadge({ name, role }) {
  const isAdmin = role === "admin";
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
      isAdmin
        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
    }`}>
      {name || (isAdmin ? "Admin" : "Architect")}
    </span>
  );
}

const ChatFeed = ({
  messages,
  isTyping,
  botStatus,
  chatStarted,
  onOptionClick,
  theme,
  activeProjectId,      
  onNewRealtimeMessage,  
}) => {
  const bottomRef = useRef(null);

  // Read current user's info for "is this my message" check
  const session = (() => {
    try { return JSON.parse(localStorage.getItem("cloudcrafter_session") || "{}"); }
    catch { return {}; }
  })();
  const currentUserName = session?.full_name || session?.email || "";

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, botStatus]);

  // ── Realtime: new chat messages from OTHER users ──────────────────────────
  const handleRealtimeMessage = useCallback((row) => {
    if (row.sender_name === currentUserName) return;
    if (onNewRealtimeMessage) onNewRealtimeMessage(row);
  }, [currentUserName, onNewRealtimeMessage]);

  useRealtimeInsert(
    "chat_messages",
    handleRealtimeMessage,
    activeProjectId ? `project_id=eq.${activeProjectId}` : null,
    [activeProjectId]
  );

  if (!chatStarted) return null;

  return (
    <div className="flex-1 w-full overflow-y-auto px-4 pb-36 scrollbar-thin scrollbar-thumb-zinc-700">
      <div className="flex flex-col gap-5 pt-8">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          const isBot  = msg.role === "bot";
          const isMyMessage = isUser && (msg.senderName === currentUserName || !msg.senderName);

          let terraformPlan = null;
          if (msg.type === "PLAN_DISPLAY") {
            terraformPlan = msg.structured_plan || null;
          }

          let successData = null;
          if (msg.type === "DEPLOYMENT_SUCCESS") {
            successData = { outputs: msg.outputs, access: msg.access };
          }

          const showTextContent =
            msg.text &&
            msg.type !== "DEPLOYMENT_SUCCESS" &&
            msg.type !== "DEPLOYMENT_FAILED" &&
            msg.type !== "ACTION_CANCELLED" &&
            msg.type !== "PLAN_DISPLAY" &&
            msg.type !== "PLAN_STARTED" &&
            msg.type !== "DESTROY_STARTED";

          const hasBubbleContent =
            showTextContent ||
            msg.type === "DEPLOYMENT_SUCCESS" ||
            msg.type === "DEPLOYMENT_FAILED" ||
            msg.type === "ACTION_CANCELLED" ||
            msg.type === "COST_RESULT" ||
            msg.type === "PLAN_DISPLAY" ||
            msg.type === "PLAN_STARTED" ||
            msg.type === "DESTROY_STARTED";

          if (!hasBubbleContent && !msg.buttons) return null;

          return (
            <div
              key={idx}
              className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className={`w-full max-w-[760px] px-4 flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>

                {/* BOT AVATAR */}
                {isBot && (
                  <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md text-[10px] font-bold bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-white/5 shadow-sm">
                    CC
                  </div>
                )}

                {/* USER AVATAR */}
                {isUser && (
                  <div className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-[11px] font-bold border uppercase
                    ${isMyMessage
                      ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    }`}>
                    {(msg.senderName || "U").charAt(0)}
                  </div>
                )}

                {/* MESSAGE COLUMN */}
                <div className={`flex flex-col w-full ${isUser ? "items-end" : "items-start"}`}>

                  {isUser && (
                    <div className="mb-1 flex items-center gap-2">
                      <SenderBadge name={msg.senderName} role={msg.senderRole} />
                    </div>
                  )}

                  {hasBubbleContent && (
                    <div className={`
                      px-5 py-3 text-sm leading-relaxed
                      w-fit max-w-[85%] sm:max-w-[70%]
                      whitespace-pre-wrap break-words
                      transition-all duration-200
                      ${isUser
                        ? isMyMessage
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10 rounded-2xl rounded-br-none"
                          : "bg-amber-600/80 text-white shadow-lg shadow-amber-500/10 rounded-2xl rounded-br-none"
                        : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 shadow-sm rounded-2xl rounded-tl-none"
                      }
                    `}>
                      {showTextContent && msg.text}

                      {(msg.type === "PLAN_STARTED" || msg.type === "DESTROY_STARTED") && msg.text && (
                        <span className="text-zinc-400 italic text-sm">{msg.text}</span>
                      )}

                      {msg.type === "ACTION_CANCELLED" && (
                        <div className="p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-sm font-medium">
                          {msg.text || "⚠️ Action cancelled. No changes were made."}
                        </div>
                      )}

                      {msg.type === "DEPLOYMENT_SUCCESS" && successData && (
                        <div className="mt-4 w-full">
                          <DeploymentSuccessView data={successData} theme={theme} mode={msg.mode || "deploy"} />
                        </div>
                      )}

                      {msg.type === "DEPLOYMENT_FAILED" && msg.errorData && (
                        <div className="mt-4 w-full">
                          <DeploymentFailureView
                            failureData={msg.errorData}
                            aiAnalysis={
                              // Live polling sets msg.aiAnalysis directly;
                              // history load surfaces it via job_details (from get_chat_history)
                              msg.aiAnalysis || msg.job_details?.ai_analysis || null
                            }
                            isAiLoading={msg.isAiLoading}
                            theme={theme}
                          />
                        </div>
                      )}

                      {msg.type === "COST_RESULT" && msg.cost && (
                        <div className="mt-4 w-full">
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                            <h3 className="text-sm font-semibold mb-2 text-emerald-400">Estimated Monthly Cost</h3>
                            <div className="text-2xl font-bold">${msg.cost.monthly_cost?.toFixed(2) || "0.00"}</div>
                            <div className="text-xs opacity-60 mt-1">Currency: {msg.cost.currency || "USD"}</div>
                          </div>
                        </div>
                      )}

                      {msg.type === "PLAN_DISPLAY" && terraformPlan && (
                        <div className="mt-4 w-full">
                          <TerraformPlanView
                            planData={terraformPlan} theme={theme}
                            onApprove={msg.onApprove} onCalculateCost={msg.onCalculateCost}
                            onDiscard={msg.onDiscard} costData={msg.costData}
                            planStatus={msg.planStatus} destroyMode={msg.destroyMode || false}
                          />
                        </div>
                      )}

                      {msg.role === "bot" && showTextContent && msg.text?.includes("?") && (
                        <div className="flex gap-2 mt-3 justify-start">
                          <button onClick={() => onOptionClick("Yes")} className="px-4 py-1.5 text-xs font-semibold rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10 transition-all">Yes</button>
                          <button onClick={() => onOptionClick("No")} className="px-4 py-1.5 text-xs font-semibold rounded-full border border-rose-500/30 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 transition-all">Cancel</button>
                        </div>
                      )}
                    </div>
                  )}

                  {msg.buttons && (
                    <div className={`flex flex-wrap gap-2 mt-3 ${isUser ? "justify-end" : "justify-start"}`}>
                      {msg.buttons.map((btn, i) => (
                        <button key={i} onClick={() => onOptionClick(btn.value)}
                          className="px-4 py-2 text-xs font-medium rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/60 active:scale-95 transition-all">
                          {btn.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[760px] px-4 flex gap-3">
              <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md text-[10px] bg-zinc-200 dark:bg-white/10 text-zinc-500 animate-pulse">CC</div>
              <div className="px-5 py-3 text-xs font-medium italic bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 rounded-2xl rounded-tl-none flex items-center gap-2">
                {botStatus || "CloudCrafter is thinking"}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
};

export default ChatFeed;