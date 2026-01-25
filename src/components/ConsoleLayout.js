import React, { useState, useEffect } from "react";
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

/* ---------------- AWS CLIENTS ---------------- */

const lexClient = new LexRuntimeV2Client({
  region: process.env.REACT_APP_AWS_REGION,
  credentials: fromCognitoIdentityPool({
    identityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID,
    clientConfig: { region: process.env.REACT_APP_AWS_REGION },
  }),
});

const identityClient = new CognitoIdentityClient({
  region: process.env.REACT_APP_AWS_REGION,
});

const getIdentityId = async () => {
  const command = new GetIdCommand({
    IdentityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID,
  });
  const response = await identityClient.send(command);
  return response.IdentityId;
};
const SLOT_LABELS = {
  instance_type: "Collecting instance type",
  region: "Collecting region",
  environment: "Collecting environment",
  instance_id: "Collecting instance ID",
  new_instance_type: "Collecting new instance type",
};

const INTENT_TITLES = {
  CreateInfraIntent: "Create Infrastructure",
  ModifyInfraIntent: "Modify Infrastructure",
  TerminateInfraIntent: "Terminate Infrastructure",
  HelloIntent: "Welcome",
  FallbackIntent: "General Assistance",
};

/* ---------------- COMPONENT ---------------- */

const ConsoleLayout = () => {
  /* UI STATE */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  /* USER */
  const [userId, setUserId] = useState(null);

  /* CHAT */
  const [messages, setMessages] = useState([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [botStatus, setBotStatus] = useState("");
  const [inputDisabled, setInputDisabled] = useState(false);

  /* NAMING */
  const [conversationName, setConversationName] = useState("New Conversation");
  const [stepTopic, setStepTopic] = useState(null);

  /* COST */
  const [showCostDrawer, setShowCostDrawer] = useState(false);
  const [costData, setCostData] = useState(null);

  /* ---------------- EFFECTS ---------------- */

  useEffect(() => {
    getIdentityId().then(setUserId);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  /* ---------------- HELPERS ---------------- */

  const getUserDisplayName = () => {
    if (!userId) return "Guest";
    const short = userId.split(":")[1]?.slice(0, 4);
    return `User-${short?.toUpperCase()}`;
  };

  const toggleTheme = () => {
    setTheme((p) => (p === "dark" ? "light" : "dark"));
  };

  /* ---------------- SEND MESSAGE ---------------- */

  const sendMessage = async (rawText) => {
    if (sidebarOpen) setSidebarOpen(false);

    const text = rawText.replace(/\s+$/, "");
    if (!text) return;

    /* Start chat */
    if (!chatStarted) {
      setChatStarted(true);

      // frontend fallback ONLY
      setConversationName(
        text.length > 40 ? text.slice(0, 40) + "…" : text
      );
    }

    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsTyping(true);
    setBotStatus("Bot is typing...");
    setStepTopic(null);

    try {
      const command = new RecognizeTextCommand({
        botId: process.env.REACT_APP_LEX_BOT_ID,
        botAliasId: process.env.REACT_APP_LEX_BOT_ALIAS_ID,
        localeId: "en_US",
        sessionId: userId || "anonymous",
        text,
      });

      const response = await lexClient.send(command);

      /* Parse backend UI payload */
      let payload = {};
      try {
        payload = JSON.parse(
          response.sessionState?.sessionAttributes?.ui_payload || "{}"
        );
      } catch {}

      /* Backend-controlled naming */
      if (payload.ui?.conversationName) {
        setConversationName(payload.ui.conversationName);
      }

      if (payload.ui?.topic) {
        setStepTopic(payload.ui.topic);
      }
      const intentName = response.sessionState?.intent?.name;
      const slotToElicit = response.sessionState?.dialogAction?.slotToElicit;
      const derivedTopic = slotToElicit
        ? SLOT_LABELS[slotToElicit] || "Collecting details"
        : null;

      if (intentName && INTENT_TITLES[intentName]) {
        setConversationName(INTENT_TITLES[intentName]);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            payload.message ||
            response.messages?.map((m) => m.content).join("\n") ||
            "No response",
          buttons: payload.buttons || null,
          topic: derivedTopic,
        },
      ]);


      setInputDisabled(Boolean(payload.ui?.disableInput));

      if (payload.cost) {
        setCostData(payload.cost);
        setShowCostDrawer(true);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "CloudCrafter is temporarily unavailable." },
      ]);
    } finally {
      setIsTyping(false);
      setBotStatus("");
    }
  };

  /* ---------------- THEME CLASSES ---------------- */

  const bgClass =
    theme === "dark" ? "bg-[#050505] text-white" : "bg-white text-zinc-900";

  const panelClass =
    theme === "dark"
      ? "bg-[#141417]/95 border-white/10"
      : "bg-zinc-100/90 border-black/10";

  const mutedText =
    theme === "dark" ? "text-zinc-400" : "text-zinc-500";

  /* ---------------- RENDER ---------------- */

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${bgClass}`}>
      {/* HEADER */}
      <header
        className={`h-[60px] flex justify-between items-center px-6 border-b backdrop-blur-xl z-50 ${panelClass}`}
      >
        <div className="flex items-center gap-4">
          <button
            className={`w-9 h-9 flex items-center justify-center rounded-lg border ${
              theme === "dark" ? "border-white/10" : "border-black/10"
            }`}
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <span className="font-bold text-lg">CloudCrafter</span>
        </div>

        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold">
          {getUserDisplayName().slice(-2)}
        </div>
      </header>

      <div className="flex-1 flex relative overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggleTheme={toggleTheme}
          currentTheme={theme}
        />

        <main className="flex-1 flex flex-col relative">
          {/* CONVERSATION NAME */}
          <div className="h-[50px] flex justify-center items-center relative">
            <span
              className={`text-sm px-4 py-1.5 rounded-full border ${
                theme === "dark"
                  ? "bg-white/5 border-white/10 text-zinc-400"
                  : "bg-black/5 border-black/10 text-zinc-600"
              }`}
            >
              {conversationName}
            </span>
          </div>

          {!chatStarted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <h1 className="text-4xl font-bold mb-2">
                Welcome, {getUserDisplayName()}
              </h1>
              <p className={mutedText}>
                Ready to provision infrastructure.
              </p>
            </div>
          )}

          <ChatFeed
            messages={messages}
            isTyping={isTyping}
            botStatus={botStatus}
            chatStarted={chatStarted}
            onOptionClick={sendMessage}
          />

          <CommandInput
            onSend={sendMessage}
            isTyping={isTyping}
            chatStarted={chatStarted}
            disabled={inputDisabled}
            theme={theme}
            closeSidebar={() => setSidebarOpen(false)}
          />
        </main>

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
