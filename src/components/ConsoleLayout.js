import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LexRuntimeV2Client,
  RecognizeTextCommand,
} from "@aws-sdk/client-lex-runtime-v2";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import {
  CognitoIdentityClient,
  GetIdCommand,
} from "@aws-sdk/client-cognito-identity";

import Sidebar from "./Sidebar";
import ChatFeed from "./ChatFeed";
import CommandInput from "./CommandInput";
import CostDrawer from "./CostDrawer";

/* ---------------- CONFIG & CLIENTS ---------------- */

const REGION = process.env.REACT_APP_AWS_REGION;
const BOT_ID = process.env.REACT_APP_LEX_BOT_ID;
const ALIAS_ID = process.env.REACT_APP_LEX_BOT_ALIAS_ID;
const POOL_ID = process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID;
const BACKEND_BASE_URL = "https://unmicrobial-suzie-unapprehendably.ngrok-free.dev";

const lexClient = new LexRuntimeV2Client({
  region: REGION,
  credentials: fromCognitoIdentityPool({
    identityPoolId: POOL_ID,
    clientConfig: { region: REGION },
  }),
});


const ConsoleLayout = () => {
  /* 🔥 PROTOCOL STATE */
  const sessionAttributesRef = useRef({});

  /* ---------------- UI STATE ---------------- */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [userId, setUserId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [botStatus, setBotStatus] = useState("");
  
  const [conversationName, setConversationName] = useState("New Conversation");
  const [showCostDrawer, setShowCostDrawer] = useState(false);
  const [costData, setCostData] = useState(null);

  /* ---------------- POLLING REFS ---------------- */
  const planTimeoutRef = useRef(null);
  const applyIntervalRef = useRef(null);

  const triggerApply = async (planJobId) => {
    if (!planJobId) return;

    const blueprint = sessionAttributesRef.current.infra_blueprint
      ? JSON.parse(sessionAttributesRef.current.infra_blueprint)
      : null;

    if (!blueprint) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ Blueprint missing. Cannot apply." },
      ]);
      return;
    }

    try {
      setBotStatus("Starting deployment...");

      const res = await fetch(`${BACKEND_BASE_URL}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({
          job_id: planJobId,
          infra_blueprint: blueprint
        }),
      });

      const data = await res.json();

      if (!data.apply_job_id) {
        throw new Error("No apply_job_id returned");
      }

      pollStatus(data.apply_job_id, "apply");

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ Failed to start deployment." },
      ]);
      setBotStatus("");
    }
  };

  // Initialize Identity
  useEffect(() => {
    const identityClient = new CognitoIdentityClient({ region: REGION });
    const getId = async () => {
      try {
        const res = await identityClient.send(new GetIdCommand({ IdentityPoolId: POOL_ID }));
        setUserId(res.IdentityId);
      } catch (err) {
        console.error("Identity Error:", err);
        setUserId("anon-" + Math.random().toString(36).substring(7));
      }
    };
    getId();
  }, []);

  // Sync Theme with HTML class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const stopPolling = useCallback(() => {
    if (planTimeoutRef.current) clearTimeout(planTimeoutRef.current);
    if (applyIntervalRef.current) clearInterval(applyIntervalRef.current);
    planTimeoutRef.current = null;
    applyIntervalRef.current = null;
  }, []);

  /* ========================================================= */
  /* 🔥 CORE LEX HANDLER */
  /* ========================================================= */

  const talkToLex = async (text, isSystemEvent = false) => {
    if (!userId) return;

    if (!isSystemEvent) {
      setMessages((prev) => [...prev, { role: "user", text }]);
      setIsTyping(true);
      setBotStatus("CloudCrafter is thinking...");
      
      if (!chatStarted) {
        setChatStarted(true);
        setConversationName(text.length > 30 ? text.substring(0, 30) + "..." : text);
      }
    }

    try {
      const command = new RecognizeTextCommand({
        botId: BOT_ID,
        botAliasId: ALIAS_ID,
        localeId: "en_US",
        sessionId: userId,
        text: text,
        sessionState: { sessionAttributes: sessionAttributesRef.current },
      });

      const response = await lexClient.send(command);
      const updatedAttrs = response.sessionState?.sessionAttributes || {};
      sessionAttributesRef.current = updatedAttrs;

      let payload = {};
      try {
        payload = JSON.parse(updatedAttrs.ui_payload || "{}");
      } catch (e) {
        console.warn("Payload parse error", e);
      }

      // Cost handling if present in payload
      if (payload.cost) {
        setCostData(payload.cost);
        setShowCostDrawer(true);
      }

      const botMessage = payload.message || response.messages?.[0]?.content || "";

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: botMessage,
          type: payload.type,
          ui_payload: updatedAttrs.ui_payload, // 🔥 ADD THIS
        },
      ]);

      /* --- Check for Async Jobs --- */
      if (payload.type === "PLAN_STARTED") {
        pollStatus(payload.job_id || payload.plan_job_id, "plan");
      } else if (payload.type === "APPLY_STARTED") {
        pollStatus(payload.job_id || payload.apply_job_id, "apply");
      }

    } catch (err) {
      console.error("Lex Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Connection to cloud controller lost." },
      ]);
    } finally {
      if (!isSystemEvent) {
        setIsTyping(false);
        setBotStatus("");
      }
    }
  };

  /* ========================================================= */
  /* 🔥 UNIVERSAL POLLER */
  /* ========================================================= */

  const pollStatus = (jobId, mode) => {
    if (!jobId) return;
    stopPolling();
    
    setBotStatus(mode === "plan" ? "Terraform is planning..." : "Provisioning AWS Resources...");

    const checkStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/status/${jobId}`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        const data = await res.json();

        if (data.status === "COMPLETED") {
          setBotStatus("");
          stopPolling();

          // 🔥 HANDLE PLAN RESULTS DIRECTLY
          // if (mode === "plan") {
          //   setMessages((prev) => [
          //     ...prev,
          //     {
          //       role: "bot",
          //       text: "Terraform plan complete. Review the resources below.",
          //       type: "PLAN_DISPLAY",
          //       resources: data.resources,
          //       structured_plan: data.structured_plan,
          //     },
          //   ]);
          // }
          if (mode === "plan") {
            const planJobId = jobId;

            setMessages((prev) => [
              ...prev,
              {
                role: "bot",
                text: "Terraform plan complete. Review the resources below.",
                type: "PLAN_DISPLAY",
                resources: data.resources,
                structured_plan: data.structured_plan,
                onConfirm: () => triggerApply(planJobId),
              },
            ]);
          }

          if (mode === "apply") {
            setMessages((prev) => [
              ...prev,
              { role: "bot", text: "✅ Deployment completed successfully!" },
            ]);
          }
        }else if (data.status === "FAILED") {
          setBotStatus("");
          stopPolling();
          setMessages((prev) => [
            ...prev,
            { role: "bot", text: `❌ ${mode.toUpperCase()} FAILED\n${data.result}` },
          ]);
        } else {
          // Continue polling
          if (mode === "plan") {
            planTimeoutRef.current = setTimeout(checkStatus, 3000);
          } else {
            applyIntervalRef.current = setTimeout(checkStatus, 4000);
          }
        }

      } catch (err) {
        console.error("Poll Error:", err);
        setBotStatus("Reconnecting to backend...");
      }
    };

    checkStatus();
  };

  /* ========================================================= */
  /* RENDER */
  /* ========================================================= */

  const containerClass = theme === "dark" ? "bg-[#050505] text-white" : "bg-zinc-50 text-zinc-900";

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${containerClass}`}>
      {/* HEADER */}
      <header className="h-[60px] flex justify-between items-center px-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            ☰
          </button>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight uppercase opacity-50">CloudCrafter v1.0</span>
            <span className="font-medium text-xs truncate max-w-[200px]">{conversationName}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {costData && (
            <button 
              onClick={() => setShowCostDrawer(true)}
              className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              Est. ${costData.total || "0"}
            </button>
          )}
          <div className={`h-2 w-2 rounded-full ${userId ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-600'}`} />
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* SIDEBAR */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggleTheme={() => setTheme((p) => (p === "dark" ? "light" : "dark"))}
          currentTheme={theme}
        />

        {/* MAIN CONSOLE */}
        <main className="flex-1 flex flex-col relative min-w-0">
          <ChatFeed
            messages={messages}
            isTyping={isTyping}
            botStatus={botStatus}
            chatStarted={chatStarted}
            onOptionClick={(val) => talkToLex(val)}
            theme={theme}
          />

          <CommandInput
            onSend={(val) => talkToLex(val)}
            isTyping={isTyping}
            chatStarted={chatStarted}
            disabled={botStatus !== "" && botStatus !== "CloudCrafter is thinking..."}
            theme={theme}
          />
        </main>

        {/* COST DRAWER */}
        <CostDrawer
          isOpen={showCostDrawer}
          data={costData}
          theme={theme}
          onClose={() => setShowCostDrawer(false)}
        />
      </div>
    </div>
  );
};

export default ConsoleLayout;