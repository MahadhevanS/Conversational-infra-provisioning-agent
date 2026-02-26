import React, { useEffect, useRef } from "react";
import TerraformPlanView from "./TerraformPlanView";
import DeploymentFailureView from "./DeploymentFailureView";
import DeploymentSuccessView from "./DeploymentSuccessView";

const ChatFeed = ({
  messages,
  isTyping,
  botStatus,
  chatStarted,
  onOptionClick,
  theme,
}) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, botStatus]);

  if (!chatStarted) return null;

  return (
    <div className="flex-1 w-full overflow-y-auto px-4 pb-36 scrollbar-thin scrollbar-thumb-zinc-700">
      <div className="flex flex-col gap-5 pt-8">
        {messages.map((msg, idx) => {
          /* ============================= */
          /* 🔥 PLAN DETECTION */
          /* ============================= */

          let terraformPlan = null;

          if (msg.type === "PLAN_DISPLAY" && msg.structured_plan) {
            terraformPlan = msg.structured_plan;
          }

          if (!terraformPlan && msg.ui_payload) {
            try {
              const parsed =
                typeof msg.ui_payload === "string"
                  ? JSON.parse(msg.ui_payload)
                  : msg.ui_payload;

              if (parsed?.type === "PLAN_DISPLAY") {
                terraformPlan = parsed.terraformPlan;
              }
            } catch (e) {
              console.error("Failed to parse ui_payload:", e);
            }
          }

          /* ============================= */
          /* 🔥 DEPLOYMENT SUCCESS DETECTION */
          /* ============================= */

          let successData = null;

          if (msg.type === "DEPLOYMENT_SUCCESS") {
             successData = {
              outputs: msg.outputs,
              access: msg.access
            };
          }

          
          return (
            <div
              key={idx}
              className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div
                className={`w-full max-w-[760px] px-4 flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* BOT AVATAR */}
                {msg.role === "bot" && (
                  <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md text-[10px] font-bold bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-white/5 shadow-sm">
                    CC
                  </div>
                )}

                {/* MESSAGE COLUMN */}
                <div
                  className={`flex flex-col w-full ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {/* MESSAGE BUBBLE */}
                  <div
                    className={`
                      px-5 py-3 text-sm leading-relaxed
                      w-fit max-w-[85%] sm:max-w-[70%]
                      whitespace-pre-wrap break-words
                      transition-all duration-200
                      ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10 rounded-2xl rounded-br-none"
                          : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-white/10 shadow-sm rounded-2xl rounded-tl-none"
                      }
                    `}
                  >
                    {msg.type !== "DEPLOYMENT_SUCCESS" && msg.type !== "DEPLOYMENT_FAILED" && msg.text}

                    {/* 🔥 DEPLOYMENT SUCCESS VIEW */}
                    {msg.type === "DEPLOYMENT_SUCCESS" && successData && (
                      <div className="mt-4 w-full">
                        <DeploymentSuccessView
                          data={successData}
                          theme={theme}
                        />
                      </div>
                    )}
                    
                    {/* 🔥 DEPLOYMENT FAILURE VIEW */}
                    {msg.type === "DEPLOYMENT_FAILED" && msg.errorData && (
                      <div className="mt-4 w-full">
                        <DeploymentFailureView
                          failureData={msg.errorData}
                          theme={theme}
                        />
                      </div>
                    )}

                    {/* 🔥 COST RESULT VIEW */}
                    {msg.type === "COST_RESULT" && msg.cost && (
                      <div className="mt-4 w-full">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                          <h3 className="text-sm font-semibold mb-2 text-emerald-400">
                            Estimated Monthly Cost
                          </h3>

                          <div className="text-2xl font-bold">
                            ${msg.cost.monthly_cost?.toFixed(2) || "0.00"}
                          </div>

                          <div className="text-xs opacity-60 mt-1">
                            Currency: {msg.cost.currency || "USD"}
                          </div>
                        </div>
                      </div>
                    )}                  
                    
                    {terraformPlan && (
                    <div className="mt-4 w-full">
                      <TerraformPlanView
                        planData={terraformPlan}
                        theme={theme}
                        onApprove={msg.onApprove}
                        onCalculateCost={msg.onCalculateCost}
                        costData={msg.costData}
                      />
                    </div>)}
                  </div> 

                  {/* QUICK REPLY BUTTONS */}
                  {msg.buttons && (
                    <div
                      className={`flex flex-wrap gap-2 mt-3 ${
                        msg.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {msg.buttons.map((btn, i) => (
                        <button
                          key={i}
                          onClick={() => onOptionClick(btn.value)}
                          className="px-4 py-2 text-xs font-medium rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/60 active:scale-95 transition-all"
                        >
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

        {/* TYPING INDICATOR */}
        {isTyping && (
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[760px] px-4 flex gap-3">
              <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md text-[10px] bg-zinc-200 dark:bg-white/10 text-zinc-500 animate-pulse">
                CC
              </div>

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