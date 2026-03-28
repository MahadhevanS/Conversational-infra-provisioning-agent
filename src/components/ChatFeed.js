// import React, { useEffect, useRef } from "react";
// import TerraformPlanView from "./TerraformPlanView";
// import DeploymentFailureView from "./DeploymentFailureView";
// import DeploymentSuccessView from "./DeploymentSuccessView";

// const ChatFeed = ({
//   messages,
//   isTyping,
//   botStatus,
//   chatStarted,
//   onOptionClick,
//   theme,
//   onViewLogs,
// }) => {
//   const bottomRef = useRef(null);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, isTyping, botStatus]);

//   if (!chatStarted) return null;

//   return (
//     <div className="flex-1 w-full overflow-y-auto px-4 pb-36 scrollbar-thin scrollbar-thumb-zinc-700">
//       <div className="flex flex-col gap-5 pt-8">
//         {messages.map((msg, idx) => {
//           const isTerminalState =
//             msg.type === "DEPLOYMENT_SUCCESS" ||
//             msg.type === "DEPLOYMENT_FAILED";

//           // PLAN_DISPLAY handles both normal and destroy mode — always extract plan data for it
//           let terraformPlan = null;
//           if (msg.type === "PLAN_DISPLAY") {
//             terraformPlan = msg.structured_plan || null;
//           } else if (
//             !isTerminalState &&
//             msg.type !== "DESTROY_STARTED" &&
//             msg.ui_payload
//           ) {
//             try {
//               const parsed =
//                 typeof msg.ui_payload === "string"
//                   ? JSON.parse(msg.ui_payload)
//                   : msg.ui_payload;
//               if (parsed?.type === "PLAN_DISPLAY") {
//                 terraformPlan = parsed.terraformPlan || null;
//               }
//             } catch (e) {
//               console.error("Failed to parse ui_payload:", e);
//             }
//           }

//           let successData = null;
//           if (msg.type === "DEPLOYMENT_SUCCESS") {
//             successData = { outputs: msg.outputs, access: msg.access };
//           }

//           // Decide whether to show the plain text bubble content.
//           // Types with dedicated full renderers don't also show raw text.
//           const showTextContent =
//             msg.text &&
//             msg.type !== "DEPLOYMENT_SUCCESS" &&
//             msg.type !== "DEPLOYMENT_FAILED" &&
//             msg.type !== "ACTION_CANCELLED" &&
//             msg.type !== "PLAN_DISPLAY" &&
//             msg.type !== "PLAN_STARTED" &&
//             msg.type !== "DESTROY_STARTED";

//           // Only show the bubble wrapper if there's something to render inside it
//           const hasBubbleContent =
//             showTextContent ||
//             msg.type === "DEPLOYMENT_SUCCESS" ||
//             msg.type === "DEPLOYMENT_FAILED" ||
//             msg.type === "ACTION_CANCELLED" ||
//             msg.type === "COST_RESULT" ||
//             msg.type === "PLAN_DISPLAY" ||
//             msg.type === "PLAN_STARTED" ||
//             msg.type === "DESTROY_STARTED";

//           if (!hasBubbleContent && !msg.buttons) return null;

//           return (
//             <div
//               key={idx}
//               className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300"
//             >
//               <div
//                 className={`w-full max-w-[760px] px-4 flex gap-3 ${
//                   msg.role === "user" ? "flex-row-reverse" : ""
//                 }`}
//               >
//                 {/* BOT AVATAR */}
//                 {msg.role === "bot" && (
//                   <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md text-[10px] font-bold bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-white/5 shadow-sm">
//                     CC
//                   </div>
//                 )}

//                 {/* MESSAGE COLUMN */}
//                 <div
//                   className={`flex flex-col w-full ${
//                     msg.role === "user" ? "items-end" : "items-start"
//                   }`}
//                 >
//                   {/* MESSAGE BUBBLE */}
//                   {hasBubbleContent && (
//                     <div
//                       className={`
//                         px-5 py-3 text-sm leading-relaxed
//                         w-fit max-w-[85%] sm:max-w-[70%]
//                         whitespace-pre-wrap break-words
//                         transition-all duration-200
//                         ${
//                           msg.role === "user"
//                             ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10 rounded-2xl rounded-br-none"
//                             : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 shadow-sm rounded-2xl rounded-tl-none"
//                         }
//                       `}
//                     >
//                       {/* PLAIN TEXT — only for messages without a dedicated renderer */}
//                       {showTextContent && msg.text}

//                       {/* STATUS MESSAGES — shown with muted styling, no card */}
//                       {(msg.type === "PLAN_STARTED" ||
//                         msg.type === "DESTROY_STARTED") &&
//                         msg.text && (
//                           <span className="text-zinc-400 italic text-sm">
//                             {msg.text}
//                           </span>
//                         )}

//                       {/* ACTION CANCELLED */}
//                       {msg.type === "ACTION_CANCELLED" && (
//                         <div className="p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-sm font-medium">
//                           {msg.text || "⚠️ Action cancelled. No changes were made."}
//                         </div>
//                       )}

//                       {/* DEPLOYMENT SUCCESS */}
//                       {msg.type === "DEPLOYMENT_SUCCESS" && successData && (
//                         <div className="mt-4 w-full">
//                           <DeploymentSuccessView
//                             data={successData}
//                             theme={theme}
//                             mode={msg.mode || "deploy"}
//                           />
//                           {onViewLogs && (
//                             <button
//                               onClick={() => onViewLogs(null, "apply", "COMPLETED")}
//                               className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase
//                                 tracking-widest text-zinc-500 hover:text-indigo-400 transition-colors"
//                             >
//                               <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
//                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                                 <polyline points="4 17 10 11 4 5" />
//                                 <line x1="12" y1="19" x2="20" y2="19" />
//                               </svg>
//                               View logs
//                             </button>
//                           )}
//                         </div>
//                       )}

//                       {/* DEPLOYMENT FAILURE */}
//                       {msg.type === "DEPLOYMENT_FAILED" && msg.errorData && (
//                         <div className="mt-4 w-full">
//                           <DeploymentFailureView
//                             failureData={msg.errorData}
//                             aiAnalysis={msg.aiAnalysis || null}
//                             isAiLoading={msg.isAiLoading || false}
//                             theme={theme}
//                           />
//                           {onViewLogs && msg.jobId && (
//                             <button
//                               onClick={() => onViewLogs(msg.jobId)}
//                               className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors"
//                             >
//                               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                                 <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
//                                 <polyline points="14 2 14 8 20 8"/>
//                                 <line x1="16" y1="13" x2="8" y2="13"/>
//                                 <line x1="16" y1="17" x2="8" y2="17"/>
//                                 <polyline points="10 9 9 9 8 9"/>
//                               </svg>
//                               View Error Logs
//                             </button>
//                           )}
//                         </div>
//                       )}

//                       {/* COST RESULT */}
//                       {msg.type === "COST_RESULT" && msg.cost && (
//                         <div className="mt-4 w-full">
//                           <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
//                             <h3 className="text-sm font-semibold mb-2 text-emerald-400">
//                               Estimated Monthly Cost
//                             </h3>
//                             <div className="text-2xl font-bold">
//                               ${msg.cost.monthly_cost?.toFixed(2) || "0.00"}
//                             </div>
//                             <div className="text-xs opacity-60 mt-1">
//                               Currency: {msg.cost.currency || "USD"}
//                             </div>
//                           </div>
//                         </div>
//                       )}

//                       {/* TERRAFORM PLAN VIEW — handles both deploy and destroy mode */}
//                       {msg.type === "PLAN_DISPLAY" && terraformPlan && (
//                         <div className="mt-4 w-full">
//                           <TerraformPlanView
//                             planData={terraformPlan}
//                             theme={theme}
//                             onApprove={msg.onApprove}
//                             onCalculateCost={msg.onCalculateCost}
//                             onDiscard={msg.onDiscard}
//                             costData={msg.costData}
//                             planStatus={msg.planStatus}
//                             destroyMode={msg.destroyMode || false}
//                           />
//                           {/* View Logs button — shown when a jobId is available */}
//                           {msg.planJobId && onViewLogs && (
//                             <button
//                               onClick={() => onViewLogs(
//                                 msg.planJobId,
//                                 msg.destroyMode ? "destroy" : "plan",
//                                 msg.planStatus === "DEPLOYED" || msg.planStatus === "DISCARDED" || msg.planStatus === "DEPLOYMENT_FAILED"
//                                   ? "COMPLETED"
//                                   : "RUNNING"
//                               )}
//                               className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase
//                                 tracking-widest text-zinc-500 hover:text-indigo-400 transition-colors"
//                             >
//                               <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
//                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                                 <polyline points="4 17 10 11 4 5" />
//                                 <line x1="12" y1="19" x2="20" y2="19" />
//                               </svg>
//                               View logs
//                             </button>
//                           )}
//                         </div>
//                       )}

//                       {/* QUICK REPLY BUTTONS — only for plain bot messages with a question */}
//                       {msg.role === "bot" &&
//                         showTextContent &&
//                         msg.text?.includes("?") && (
//                           <div className="flex gap-2 mt-3 justify-start">
//                             <button
//                               onClick={() => onOptionClick("Yes")}
//                               className="px-4 py-1.5 text-xs font-semibold rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10 transition-all"
//                             >
//                               Yes
//                             </button>
//                             <button
//                               onClick={() => onOptionClick("No")}
//                               className="px-4 py-1.5 text-xs font-semibold rounded-full border border-rose-500/30 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 transition-all"
//                             >
//                               Cancel
//                             </button>
//                           </div>
//                         )}
//                     </div>
//                   )}

//                   {/* CUSTOM BUTTONS */}
//                   {msg.buttons && (
//                     <div
//                       className={`flex flex-wrap gap-2 mt-3 ${
//                         msg.role === "user" ? "justify-end" : "justify-start"
//                       }`}
//                     >
//                       {msg.buttons.map((btn, i) => (
//                         <button
//                           key={i}
//                           onClick={() => onOptionClick(btn.value)}
//                           className="px-4 py-2 text-xs font-medium rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/60 active:scale-95 transition-all"
//                         >
//                           {btn.text}
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           );
//         })}

//         {/* TYPING INDICATOR */}
//         {isTyping && (
//           <div className="w-full flex justify-center">
//             <div className="w-full max-w-[760px] px-4 flex gap-3">
//               <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md text-[10px] bg-zinc-200 dark:bg-white/10 text-zinc-500 animate-pulse">
//                 CC
//               </div>
//               <div className="px-5 py-3 text-xs font-medium italic bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 rounded-2xl rounded-tl-none flex items-center gap-2">
//                 {botStatus || "CloudCrafter is thinking"}
//               </div>
//             </div>
//           </div>
//         )}

//         <div ref={bottomRef} className="h-4" />
//       </div>
//     </div>
//   );
// };

// export default ChatFeed;


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
  onViewLogs,
  activeProjectId,       // NEW — needed for realtime filter
  onNewRealtimeMessage,  // NEW — callback so ConsoleLayout can append the message
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
    // Skip messages sent by current user — ConsoleLayout already added them optimistically
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

          const isTerminalState = msg.type === "DEPLOYMENT_SUCCESS" || msg.type === "DEPLOYMENT_FAILED";

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

                {/* USER AVATAR — initials */}
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

                  {/* Sender label — only for user messages in group context */}
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
                          {onViewLogs && (
                            <button onClick={() => onViewLogs(null, "apply", "COMPLETED")}
                              className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-indigo-400 transition-colors">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                              View logs
                            </button>
                          )}
                        </div>
                      )}

                      {msg.type === "DEPLOYMENT_FAILED" && msg.errorData && (
                        <div className="mt-4 w-full">
                          <DeploymentFailureView failureData={msg.errorData} aiAnalysis={msg.aiAnalysis || null} isAiLoading={msg.isAiLoading || false} theme={theme} />
                          {onViewLogs && msg.jobId && (
                            <button onClick={() => onViewLogs(msg.jobId)}
                              className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors">
                              View Error Logs
                            </button>
                          )}
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
                          {msg.planJobId && onViewLogs && (
                            <button onClick={() => onViewLogs(
                              msg.planJobId,
                              msg.destroyMode ? "destroy" : "plan",
                              ["DEPLOYED","DISCARDED","DEPLOYMENT_FAILED"].includes(msg.planStatus) ? "COMPLETED" : "RUNNING"
                            )} className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-indigo-400 transition-colors">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                              View logs
                            </button>
                          )}
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