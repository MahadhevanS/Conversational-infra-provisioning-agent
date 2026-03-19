// import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   LexRuntimeV2Client,
//   RecognizeTextCommand,
// } from "@aws-sdk/client-lex-runtime-v2";
// import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
// import {
//   CognitoIdentityClient,
//   GetIdCommand,
// } from "@aws-sdk/client-cognito-identity";
// import Sidebar from "./Sidebar";
// import ChatFeed from "./ChatFeed";
// import CommandInput from "./CommandInput";
// import { apiFetch } from "../utils/api";

// /* ---------------- CONFIG & CLIENTS ---------------- */

// const REGION = process.env.REACT_APP_AWS_REGION;
// const BOT_ID = process.env.REACT_APP_LEX_BOT_ID;
// const ALIAS_ID = process.env.REACT_APP_LEX_BOT_ALIAS_ID;
// const POOL_ID = process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID;

// const lexClient = new LexRuntimeV2Client({
//   region: REGION,
//   credentials: fromCognitoIdentityPool({
//     identityPoolId: POOL_ID,
//     clientConfig: { region: REGION },
//   }),
// });

// const getSessionId = () => sessionStorage.getItem("cc_project_id");
// const setSessionId = (id) =>
//   id
//     ? sessionStorage.setItem("cc_project_id", id)
//     : sessionStorage.removeItem("cc_project_id");

// const ConsoleLayout = () => {
//   const navigate = useNavigate();

//   const sessionAttributesRef = useRef({});
//   const chatCache = useRef({});
//   const activeProjectIdRef = useRef(getSessionId());

//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [theme, setTheme] = useState("dark");
//   const [userId, setUserId] = useState(null);

//   const [activeProjectId, setActiveProjectId] = useState(getSessionId());
//   const [conversationName, setConversationName] = useState("New Conversation");

//   const [messages, setMessages] = useState([]);
//   const [chatStarted, setChatStarted] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [botStatus, setBotStatus] = useState("");

//   const [costData, setCostData] = useState(null);

//   const planTimeoutRef = useRef(null);
//   const applyIntervalRef = useRef(null);

//   const session = useMemo(() => {
//     try {
//       return JSON.parse(localStorage.getItem("cloudcrafter_session") || "null");
//     } catch {
//       return null;
//     }
//   }, []);

//   const displayName = session?.full_name || session?.email || "User";

//   useEffect(() => {
//     activeProjectIdRef.current = activeProjectId;
//   }, [activeProjectId]);

//   const updateMessages = useCallback((updater) => {
//     setMessages((prev) => {
//       const newMsgs = typeof updater === "function" ? updater(prev) : updater;
//       if (activeProjectIdRef.current) {
//         chatCache.current[activeProjectIdRef.current] = newMsgs;
//       }
//       return newMsgs;
//     });
//   }, []);

//   useEffect(() => {
//     const identityClient = new CognitoIdentityClient({ region: REGION });
//     const getId = async () => {
//       try {
//         const res = await identityClient.send(new GetIdCommand({ IdentityPoolId: POOL_ID }));
//         setUserId(res.IdentityId);
//       } catch {
//         setUserId("anon-" + Math.random().toString(36).substring(7));
//       }
//     };
//     getId();
//   }, []);

//   useEffect(() => {
//     document.documentElement.classList.toggle("dark", theme === "dark");
//   }, [theme]);

//   /* ---------------- HISTORY LOADING ---------------- */

//   useEffect(() => {
//     if (activeProjectId) {
//       setSessionId(activeProjectId);
//       loadChatHistory(activeProjectId);
//     } else {
//       setSessionId(null);
//       setMessages([]);
//       setChatStarted(false);
//       setConversationName("New Conversation");
//       sessionAttributesRef.current = {};
//     }
//   }, [activeProjectId]);

//   const loadChatHistory = async (projId) => {
//     if (chatCache.current[projId]) {
//       setMessages(chatCache.current[projId]);
//       setChatStarted(chatCache.current[projId].length > 0);
//       return;
//     }

//     try {
//       const data = await apiFetch(`/chats/${projId}`);
//       if (data.messages) {
//         const sortedMessages = data.messages.sort(
//           (a, b) =>
//             new Date(a.created_at || a.timestamp) -
//             new Date(b.created_at || b.timestamp)
//         );

//         const applyStatusMap = {};
//         sortedMessages.forEach((m) => {
//           if (
//             m.job_details &&
//             m.job_details.job_type === "APPLY" &&
//             m.job_details.plan_ref
//           ) {
//             applyStatusMap[m.job_details.plan_ref] = m.job_details.status;
//           }
//         });

//         const lastBotMessageWithBlueprint = [...data.messages]
//           .reverse()
//           .find((m) => m.sender.toUpperCase() === "BOT" && m.job_details?.blueprint);

//         if (lastBotMessageWithBlueprint) {
//           sessionAttributesRef.current.infra_blueprint = JSON.stringify(
//             lastBotMessageWithBlueprint.job_details.blueprint
//           );
//         }

//         const historyMsgs = [];

//         sortedMessages.forEach((m) => {
//           const baseMsg = {
//             role: m.sender.toUpperCase() === "USER" ? "user" : "bot",
//             text: m.message_text,
//           };

//           if (m.job_details) {
//             const job = m.job_details;

//             if (
//               job.job_type === "PLAN" &&
//               (job.status === "COMPLETED" || job.status === "DISCARDED")
//             ) {
//               if (baseMsg.text) {
//                 historyMsgs.push({ role: "bot", text: baseMsg.text });
//               }

//               const planMsg = {
//                 role: "bot",
//                 text: "Terraform plan complete. Review the resources below.",
//                 type: "PLAN_DISPLAY",
//                 structured_plan: job.result || { resource_changes: [] },
//                 planJobId: job.job_id,
//               };

//               if (job.status === "DISCARDED") {
//                 planMsg.planStatus = "DISCARDED";
//               } else if (applyStatusMap[job.job_id] === "COMPLETED") {
//                 planMsg.planStatus = "DEPLOYED";
//               } else if (applyStatusMap[job.job_id] === "FAILED") {
//                 planMsg.planStatus = "DEPLOYMENT_FAILED";
//               } else {
//                 planMsg.planStatus = "NOT_DEPLOYED";
//               }

//               if (job.cost_summary) {
//                 planMsg.costData = job.cost_summary;
//               }

//               historyMsgs.push(planMsg);
//               return;
//             } else if (job.job_type === "APPLY" && job.status === "COMPLETED") {
//               baseMsg.type = "DEPLOYMENT_SUCCESS";
//               baseMsg.outputs = job.result?.outputs || {};
//               baseMsg.access = job.result?.access || [];
//             } else if (job.job_type === "DESTROY" && job.status === "COMPLETED") {
//               // Reconstruct destroy success as a terminal destroyMode PLAN_DISPLAY
//               historyMsgs.push({ role: "bot", text: baseMsg.text });
//               historyMsgs.push({
//                 role: "bot",
//                 text: "Destruction complete. All resources have been removed.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYED",
//                 structured_plan: { resource_changes: [] },
//               });
//               return;
//             } else if (job.job_type === "DESTROY" && job.status === "FAILED") {
//               historyMsgs.push({ role: "bot", text: baseMsg.text });
//               historyMsgs.push({
//                 role: "bot",
//                 text: "Destruction failed. Some resources may still exist.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYMENT_FAILED",
//                 structured_plan: { resource_changes: [] },
//               });
//               historyMsgs.push({
//                 role: "bot",
//                 type: "DEPLOYMENT_FAILED",
//                 text: "Destruction failed.",
//                 errorData: job.error_message || "Manual intervention may be required in the AWS Console.",
//               });
//               return;
//             } else if (job.status === "FAILED") {
//               baseMsg.type = "DEPLOYMENT_FAILED";
//               baseMsg.errorData =
//                 job.error_message || job.error || "An unknown error occurred.";
//             }
//           }

//           historyMsgs.push(baseMsg);
//         });

//         const lastCostMsg = historyMsgs
//           .slice()
//           .reverse()
//           .find((m) => m.costData);
//         if (lastCostMsg) {
//           setCostData(lastCostMsg.costData);
//         } else {
//           setCostData(null);
//         }

//         chatCache.current[projId] = historyMsgs;
//         setMessages(historyMsgs);
//         setChatStarted(historyMsgs.length > 0);
//       }
//     } catch (e) {
//       console.error("Failed to load history:", e);
//     }
//   };

//   const handleProjectSelect = (projId, projName, silentSync = false) => {
//     setActiveProjectId(projId);
//     activeProjectIdRef.current = projId;
//     setConversationName(projName || "New Conversation");

//     if (!projId) {
//       setSessionId(null);
//       setMessages([]);
//       setChatStarted(false);
//       sessionAttributesRef.current = {};
//     } else {
//       setSessionId(projId);
//     }

//     if (!silentSync) {
//       setSidebarOpen(false);
//     }
//   };

//   const stopPolling = useCallback(() => {
//     if (planTimeoutRef.current) clearTimeout(planTimeoutRef.current);
//     if (applyIntervalRef.current) clearInterval(applyIntervalRef.current);
//     planTimeoutRef.current = null;
//     applyIntervalRef.current = null;
//   }, []);

//   /* ========================================================= */
//   /* UNIVERSAL POLLER                                           */
//   /* ========================================================= */

//   const pollStatus = (jobId, mode, relatedPlanJobId = null) => {
//     if (!jobId) return;
//     stopPolling();

//     setBotStatus(
//       mode === "plan"
//         ? "Terraform is planning..."
//         : mode === "destroy"
//         ? "Destroying infrastructure..."
//         : "Provisioning AWS Resources..."
//     );

//     const checkStatus = async () => {
//       try {
//         const data = await apiFetch(`/status/${jobId}`, { method: "GET" });

//         if (data.status === "COMPLETED") {
//           setBotStatus("");
//           stopPolling();

//           if (mode === "plan") {
//             updateMessages((prev) => [
//               ...prev,
//               {
//                 role: "bot",
//                 text: "Terraform plan complete. Review the resources below.",
//                 type: "PLAN_DISPLAY",
//                 structured_plan: data.structured_plan,
//                 planJobId: jobId,
//                 onCalculateCost: () => triggerCost(jobId),
//                 onApprove: () => triggerApply(jobId),
//                 onDiscard: () => discardPlan(jobId),
//               },
//             ]);
//           }

//           if (mode === "cost") {
//             const costSummary = data.cost_summary;
//             updateMessages((prev) =>
//               prev.map((msg) =>
//                 msg.planJobId === relatedPlanJobId
//                   ? { ...msg, costData: costSummary }
//                   : msg
//               )
//             );
//             setCostData(costSummary);
//           }

//           if (mode === "destroy") {
//             setCostData(null);

//             // Build destroy-mode PLAN_DISPLAY from the blueprint so the user
//             // sees exactly which resources were removed, using the unified view.
//             const blueprint = sessionAttributesRef.current.infra_blueprint
//               ? (() => {
//                   try {
//                     return JSON.parse(sessionAttributesRef.current.infra_blueprint);
//                   } catch {
//                     return null;
//                   }
//                 })()
//               : null;

//             const destroyChanges =
//               blueprint?.components?.map((c) => ({
//                 address: `module.${c.service}[0].aws_${c.service}_resource.this`,
//                 change: { actions: ["delete"] },
//               })) || [];

//             updateMessages((prev) => [
//               ...prev,
//               {
//                 role: "bot",
//                 text: "Destruction complete. All resources have been removed.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYED",
//                 structured_plan: { resource_changes: destroyChanges },
//                 // No callbacks — it's a terminal state
//               },
//             ]);

//             sessionAttributesRef.current.infra_blueprint = null;

//             // Save destroy completion to chat history
//             apiFetch("/chats", {
//               method: "POST",
//               body: JSON.stringify({
//                 project_id: activeProjectIdRef.current,
//                 sender: "BOT",
//                 message_text: "Destruction complete. All resources have been removed.",
//                 job_id: jobId,
//               }),
//             }).catch(() => {});
//           }

//           if (mode === "apply") {
//             updateMessages((prev) => {
//               const updatedPrev = prev.map((msg) =>
//                 msg.planJobId === relatedPlanJobId
//                   ? {
//                       ...msg,
//                       planStatus: "DEPLOYED",
//                       onApprove: undefined,
//                       onCalculateCost: undefined,
//                       onDiscard: undefined,
//                     }
//                   : msg
//               );

//               return [
//                 ...updatedPrev,
//                 {
//                   role: "bot",
//                   type: "DEPLOYMENT_SUCCESS",
//                   text: "Deployment completed successfully.",
//                   outputs: data.outputs || {},
//                   access: data.access || [],
//                 },
//               ];
//             });

//             // Save apply completion to chat history
//             apiFetch("/chats", {
//               method: "POST",
//               body: JSON.stringify({
//                 project_id: activeProjectIdRef.current,
//                 sender: "BOT",
//                 message_text: "Deployment completed successfully.",
//                 job_id: jobId,
//               }),
//             }).catch(() => {});
//           }
//         } else if (data.status === "FAILED") {
//           setBotStatus("");
//           stopPolling();

//           if (mode === "destroy") {
//             // Show destroy failure using destroyMode plan card
//             const blueprint = sessionAttributesRef.current.infra_blueprint
//               ? (() => {
//                   try {
//                     return JSON.parse(sessionAttributesRef.current.infra_blueprint);
//                   } catch {
//                     return null;
//                   }
//                 })()
//               : null;

//             const destroyChanges =
//               blueprint?.components?.map((c) => ({
//                 address: `module.${c.service}[0].aws_${c.service}_resource.this`,
//                 change: { actions: ["delete"] },
//               })) || [];

//             updateMessages((prev) => [
//               ...prev,
//               {
//                 role: "bot",
//                 text: "Destruction failed. Some resources may still exist.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYMENT_FAILED",
//                 structured_plan: { resource_changes: destroyChanges },
//               },
//               {
//                 role: "bot",
//                 type: "DEPLOYMENT_FAILED",
//                 text: "Destruction failed.",
//                 errorData:
//                   data.error ||
//                   "Manual intervention may be required in the AWS Console.",
//               },
//             ]);

//             // Save destroy failure to chat history
//             apiFetch("/chats", {
//               method: "POST",
//               body: JSON.stringify({
//                 project_id: activeProjectIdRef.current,
//                 sender: "BOT",
//                 message_text: "Destruction failed. Manual intervention may be required.",
//                 job_id: jobId,
//               }),
//             }).catch(() => {});
//             return;
//           }

//           updateMessages((prev) => {
//             const updatedPrev =
//               mode === "apply"
//                 ? prev.map((msg) =>
//                     msg.planJobId === relatedPlanJobId
//                       ? {
//                           ...msg,
//                           planStatus: "DEPLOYMENT_FAILED",
//                           onApprove: undefined,
//                           onCalculateCost: undefined,
//                           onDiscard: undefined,
//                         }
//                       : msg
//                   )
//                 : prev;

//             return [
//               ...updatedPrev,
//               {
//                 role: "bot",
//                 type: "DEPLOYMENT_FAILED",
//                 text: "Process failed.",
//                 errorData:
//                   data.error ||
//                   data.error_message ||
//                   "An unknown deployment error occurred.",
//               },
//             ];
//           });
//         } else {
//           const delay =
//             mode === "apply" || mode === "destroy" ? 4000 : 3000;
//           planTimeoutRef.current = setTimeout(checkStatus, delay);
//         }
//       } catch {
//         setBotStatus("Reconnecting...");
//         planTimeoutRef.current = setTimeout(checkStatus, 5000);
//       }
//     };

//     checkStatus();
//   };

//   /* ========================================================= */
//   /* ACTION TRIGGERS                                            */
//   /* ========================================================= */

//   const discardPlan = async (planJobId) => {
//     setCostData(null);

//     updateMessages((prev) =>
//       prev.map((msg) =>
//         msg.planJobId === planJobId
//           ? {
//               ...msg,
//               planStatus: "DISCARDED",
//               onApprove: undefined,
//               onCalculateCost: undefined,
//               onDiscard: undefined,
//             }
//           : msg
//       )
//     );

//     try {
//       await apiFetch(`/jobs/${planJobId}/discard`, { method: "POST" });
//     } catch (e) {
//       console.error("Failed to discard job in DB", e);
//     }
//   };

//   const triggerCost = async (planJobId) => {
//     try {
//       setBotStatus("Calculating infrastructure cost...");
//       const data = await apiFetch(`/cost`, {
//         method: "POST",
//         body: JSON.stringify({
//           run_id: planJobId,
//           project_id: activeProjectIdRef.current,
//         }),
//       });
//       pollStatus(data.job_id, "cost", planJobId);
//     } catch {
//       setBotStatus("");
//     }
//   };

//   const triggerApply = async (planJobId) => {
//     const blueprint = sessionAttributesRef.current.infra_blueprint
//       ? (() => {
//           try {
//             return JSON.parse(sessionAttributesRef.current.infra_blueprint);
//           } catch {
//             return null;
//           }
//         })()
//       : null;

//     const payloadBody = {
//       project_id: activeProjectIdRef.current,
//       job_id: planJobId,
//     };
//     if (blueprint) payloadBody.infra_blueprint = blueprint;

//     try {
//       setBotStatus("Starting deployment...");
//       const data = await apiFetch(`/apply`, {
//         method: "POST",
//         body: JSON.stringify(payloadBody),
//       });

//       apiFetch("/chats", {
//         method: "POST",
//         body: JSON.stringify({
//           project_id: activeProjectIdRef.current,
//           sender: "BOT",
//           message_text: "Initiating deployment...",
//           job_id: data.apply_job_id,
//         }),
//       }).catch(() => console.error("Failed to save apply message"));

//       pollStatus(data.apply_job_id, "apply", planJobId);
//     } catch {
//       setBotStatus("");
//     }
//   };

//   /* ========================================================= */
//   /* CORE LEX HANDLER                                           */
//   /* ========================================================= */

//   const talkToLex = async (text, isSystemEvent = false) => {
//     let currentProjId = activeProjectIdRef.current;

//     if (!isSystemEvent) {
//       if (!currentProjId) {
//         try {
//           const newProjTitle =
//             text.length > 30 ? text.substring(0, 30) + "..." : text;
//           const projRes = await apiFetch("/projects", {
//             method: "POST",
//             body: JSON.stringify({
//               project_name: newProjTitle,
//               environment: "development",
//             }),
//           });
//           currentProjId = projRes.project_id;
//           handleProjectSelect(currentProjId, projRes.project_name, true);
//         } catch (e) {
//           console.error("Auto-create failed:", e);
//         }
//       }

//       updateMessages((prev) => [...prev, { role: "user", text }]);

//       if (currentProjId) {
//         apiFetch("/chats", {
//           method: "POST",
//           body: JSON.stringify({
//             project_id: currentProjId,
//             sender: "USER",
//             message_text: text,
//           }),
//         }).catch(() => {});
//       }

//       setIsTyping(true);
//       setBotStatus("CloudCrafter is thinking...");
//       setChatStarted(true);
//     }

//     try {
//       const command = new RecognizeTextCommand({
//         botId: BOT_ID,
//         botAliasId: ALIAS_ID,
//         localeId: "en_US",
//         sessionId: currentProjId || userId || "local-session",
//         text: text,
//         sessionState: {
//           sessionAttributes: {
//             ...sessionAttributesRef.current,
//             project_id: String(currentProjId),
//           },
//         },
//       });

//       const response = await lexClient.send(command);
//       const updatedAttrs = response.sessionState?.sessionAttributes || {};
//       sessionAttributesRef.current = updatedAttrs;

//       let payload = {};
//       try {
//         payload = JSON.parse(updatedAttrs.ui_payload || "{}");
//       } catch {}

//       if (payload.cost) {
//         setCostData(payload.cost);
//       }

//       // payload.message is now always set by build_response in lex.py
//       // Fall back to messages[0].content for the ACTION_CANCELLED case (no payload)
//       const botMessage =
//         payload.message || response.messages?.[0]?.content || "";
//       const currentJobId =
//         payload.job_id || payload.plan_job_id || payload.apply_job_id;

//       const isDestroyFlow = payload.type === "DESTROY_STARTED";
//       const isCancelFlow = payload.type === "ACTION_CANCELLED" || (!payload.type && !currentJobId && !payload.message && response.messages?.[0]?.content);

//       // Only push the intermediate Lex acknowledgement message if it has text
//       // and is NOT a flow that will immediately push its own UI message (plan/destroy polling)
//       const shouldPushLexMessage =
//         botMessage &&
//         payload.type !== "PLAN_STARTED" &&
//         payload.type !== "DESTROY_STARTED";

//       if (shouldPushLexMessage) {
//         updateMessages((prev) => [
//           ...prev,
//           {
//             role: "bot",
//             text: botMessage,
//             // For ACTION_CANCELLED, set the type so ChatFeed renders the yellow box
//             type: payload.type || undefined,
//           },
//         ]);
//       }

//       // For PLAN_STARTED — push the "generating..." message then poll
//       if (payload.type === "PLAN_STARTED") {
//         updateMessages((prev) => [
//           ...prev,
//           {
//             role: "bot",
//             text: botMessage,
//             type: "PLAN_STARTED",
//           },
//         ]);
//         pollStatus(currentJobId, "plan");
//       } else if (payload.type === "APPLY_STARTED") {
//         pollStatus(currentJobId, "apply", payload.plan_job_id);
//       } else if (isDestroyFlow) {
//         // Push the status message then poll — no plan card pushed here
//         updateMessages((prev) => [
//           ...prev,
//           {
//             role: "bot",
//             text: botMessage,
//             type: "DESTROY_STARTED",
//           },
//         ]);
//         pollStatus(currentJobId, "destroy");
//       }

//       if (botMessage && currentProjId) {
//         apiFetch("/chats", {
//           method: "POST",
//           body: JSON.stringify({
//             project_id: currentProjId,
//             sender: "BOT",
//             message_text: botMessage,
//             job_id: currentJobId || null,
//           }),
//         }).catch(() => {});
//       }
//     } catch {
//       updateMessages((prev) => [
//         ...prev,
//         { role: "bot", text: "⚠️ Connection lost." },
//       ]);
//     } finally {
//       if (!isSystemEvent) {
//         setIsTyping(false);
//         setBotStatus("");
//       }
//     }
//   };

//   const containerClass =
//     theme === "dark" ? "bg-[#050505] text-white" : "bg-zinc-50 text-zinc-900";

//   return (
//     <div className={`flex flex-col h-screen overflow-hidden ${containerClass}`}>
//       <header className="h-[60px] flex justify-between items-center px-6 border-b border-white/10 shrink-0">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="p-2 hover:bg-white/5 rounded-lg transition-colors"
//           >
//             ☰
//           </button>
//           <div className="flex flex-col">
//             <span className="font-bold text-sm tracking-tight uppercase opacity-50">
//               CloudCrafter v1.0
//             </span>
//             <span className="font-medium text-xs truncate max-w-[200px]">
//               {conversationName}
//             </span>
//           </div>
//         </div>

//         <div className="flex items-center gap-4">
//           {costData && (
//             <button className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-all hidden sm:block">
//               Est. ${costData.monthly_cost?.toFixed(2) || "0.00"}
//             </button>
//           )}

//           <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-white/10">
//             <div className="hidden sm:flex flex-col text-right">
//               <span className="text-xs font-bold text-zinc-200">
//                 {displayName}
//               </span>
//               <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
//                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
//                 Connected
//               </span>
//             </div>

//             <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30 uppercase shrink-0">
//               {displayName.charAt(0)}
//             </div>

//             <button
//               onClick={() => navigate("/logout")}
//               className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all ml-1"
//               title="Logout"
//             >
//               <svg
//                 width="18"
//                 height="18"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               >
//                 <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
//                 <polyline points="16 17 21 12 16 7"></polyline>
//                 <line x1="21" y1="12" x2="9" y2="12"></line>
//               </svg>
//             </button>
//           </div>
//         </div>
//       </header>

//       <div className="flex flex-1 relative overflow-hidden">
//         <Sidebar
//           isOpen={sidebarOpen}
//           onClose={() => setSidebarOpen(false)}
//           onToggleTheme={() =>
//             setTheme((p) => (p === "dark" ? "light" : "dark"))
//           }
//           currentTheme={theme}
//           activeProjectId={activeProjectId}
//           onSelectProject={handleProjectSelect}
//         />

//         <main className="flex-1 flex flex-col relative min-w-0">
//           <ChatFeed
//             messages={messages}
//             isTyping={isTyping}
//             botStatus={botStatus}
//             chatStarted={chatStarted}
//             onOptionClick={(val) => talkToLex(val)}
//             theme={theme}
//           />

//           <CommandInput
//             onSend={(val) => talkToLex(val)}
//             isTyping={isTyping}
//             chatStarted={chatStarted}
//             disabled={
//               botStatus !== "" &&
//               botStatus !== "CloudCrafter is thinking..."
//             }
//             theme={theme}
//           />
//         </main>
//       </div>
//     </div>
//   );
// };

// export default ConsoleLayout;

// import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   LexRuntimeV2Client,
//   RecognizeTextCommand,
// } from "@aws-sdk/client-lex-runtime-v2";
// import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
// import {
//   CognitoIdentityClient,
//   GetIdCommand,
// } from "@aws-sdk/client-cognito-identity";
// import Sidebar from "./Sidebar";
// import ChatFeed from "./ChatFeed";
// import CommandInput from "./CommandInput";
// import { apiFetch } from "../utils/api";
// import LogPanel from "../pages/LogPanel";

// /* ---------------- CONFIG & CLIENTS ---------------- */

// const REGION = process.env.REACT_APP_AWS_REGION;
// const BOT_ID = process.env.REACT_APP_LEX_BOT_ID;
// const ALIAS_ID = process.env.REACT_APP_LEX_BOT_ALIAS_ID;
// const POOL_ID = process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID;

// const lexClient = new LexRuntimeV2Client({
//   region: REGION,
//   credentials: fromCognitoIdentityPool({
//     identityPoolId: POOL_ID,
//     clientConfig: { region: REGION },
//   }),
// });

// const getSessionId = () => sessionStorage.getItem("cc_project_id");
// const setSessionId = (id) =>
//   id
//     ? sessionStorage.setItem("cc_project_id", id)
//     : sessionStorage.removeItem("cc_project_id");

// const ConsoleLayout = () => {
//   const navigate = useNavigate();

//   const sessionAttributesRef = useRef({});
//   const chatCache = useRef({});
//   const activeProjectIdRef = useRef(getSessionId());

//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [theme, setTheme] = useState("dark");
//   const [userId, setUserId] = useState(null);

//   const [activeProjectId, setActiveProjectId] = useState(getSessionId());
//   const [conversationName, setConversationName] = useState("New Conversation");

//   const [messages, setMessages] = useState([]);
//   const [chatStarted, setChatStarted] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [botStatus, setBotStatus] = useState("");

//   const [costData, setCostData] = useState(null);

//   // ── Log panel state ────────────────────────────────────────────────────────
//   const [logPanelOpen, setLogPanelOpen]       = useState(false);
//   const [activeLogJobId, setActiveLogJobId]   = useState(null);
//   const [activeLogMode, setActiveLogMode]     = useState(null);
//   const [activeLogStatus, setActiveLogStatus] = useState(null);

//   const openLogs = useCallback((jobId, mode, status) => {
//     setActiveLogJobId(jobId);
//     setActiveLogMode(mode);
//     setActiveLogStatus(status || "RUNNING");
//     setLogPanelOpen(true);
//   }, []);

//   const planTimeoutRef = useRef(null);
//   const applyIntervalRef = useRef(null);

//   const session = useMemo(() => {
//     try {
//       return JSON.parse(localStorage.getItem("cloudcrafter_session") || "null");
//     } catch {
//       return null;
//     }
//   }, []);

//   const displayName = session?.full_name || session?.email || "User";

//   useEffect(() => {
//     activeProjectIdRef.current = activeProjectId;
//   }, [activeProjectId]);

//   const updateMessages = useCallback((updater) => {
//     setMessages((prev) => {
//       const newMsgs = typeof updater === "function" ? updater(prev) : updater;
//       if (activeProjectIdRef.current) {
//         chatCache.current[activeProjectIdRef.current] = newMsgs;
//       }
//       return newMsgs;
//     });
//   }, []);

//   useEffect(() => {
//     const identityClient = new CognitoIdentityClient({ region: REGION });
//     const getId = async () => {
//       try {
//         const res = await identityClient.send(new GetIdCommand({ IdentityPoolId: POOL_ID }));
//         setUserId(res.IdentityId);
//       } catch {
//         setUserId("anon-" + Math.random().toString(36).substring(7));
//       }
//     };
//     getId();
//   }, []);

//   useEffect(() => {
//     document.documentElement.classList.toggle("dark", theme === "dark");
//   }, [theme]);

//   /* ---------------- HISTORY LOADING ---------------- */

//   useEffect(() => {
//     if (activeProjectId) {
//       setSessionId(activeProjectId);
//       loadChatHistory(activeProjectId);
//     } else {
//       setSessionId(null);
//       setMessages([]);
//       setChatStarted(false);
//       setConversationName("New Conversation");
//       sessionAttributesRef.current = {};
//     }
//   }, [activeProjectId]);

//   const loadChatHistory = async (projId) => {
//     if (chatCache.current[projId]) {
//       setMessages(chatCache.current[projId]);
//       setChatStarted(chatCache.current[projId].length > 0);
//       return;
//     }

//     try {
//       const data = await apiFetch(`/chats/${projId}`);
//       if (data.messages) {
//         const sortedMessages = data.messages.sort(
//           (a, b) =>
//             new Date(a.created_at || a.timestamp) -
//             new Date(b.created_at || b.timestamp)
//         );

//         const applyStatusMap = {};
//         sortedMessages.forEach((m) => {
//           if (
//             m.job_details &&
//             m.job_details.job_type === "APPLY" &&
//             m.job_details.plan_ref
//           ) {
//             applyStatusMap[m.job_details.plan_ref] = m.job_details.status;
//           }
//         });

//         const lastBotMessageWithBlueprint = [...data.messages]
//           .reverse()
//           .find((m) => m.sender.toUpperCase() === "BOT" && m.job_details?.blueprint);

//         if (lastBotMessageWithBlueprint) {
//           sessionAttributesRef.current.infra_blueprint = JSON.stringify(
//             lastBotMessageWithBlueprint.job_details.blueprint
//           );
//         }

//         const historyMsgs = [];

//         sortedMessages.forEach((m) => {
//           const baseMsg = {
//             role: m.sender.toUpperCase() === "USER" ? "user" : "bot",
//             text: m.message_text,
//           };

//           if (m.job_details) {
//             const job = m.job_details;

//             if (
//               job.job_type === "PLAN" &&
//               (job.status === "COMPLETED" || job.status === "DISCARDED")
//             ) {
//               if (baseMsg.text) {
//                 historyMsgs.push({ role: "bot", text: baseMsg.text });
//               }

//               const planMsg = {
//                 role: "bot",
//                 text: "Terraform plan complete. Review the resources below.",
//                 type: "PLAN_DISPLAY",
//                 structured_plan: job.result || { resource_changes: [] },
//                 planJobId: job.job_id,
//               };

//               if (job.status === "DISCARDED") {
//                 planMsg.planStatus = "DISCARDED";
//               } else if (applyStatusMap[job.job_id] === "COMPLETED") {
//                 planMsg.planStatus = "DEPLOYED";
//               } else if (applyStatusMap[job.job_id] === "FAILED") {
//                 planMsg.planStatus = "DEPLOYMENT_FAILED";
//               } else {
//                 planMsg.planStatus = "NOT_DEPLOYED";
//               }

//               if (job.cost_summary) {
//                 planMsg.costData = job.cost_summary;
//               }

//               historyMsgs.push(planMsg);
//               return;
//             } else if (job.job_type === "APPLY" && job.status === "COMPLETED") {
//               baseMsg.type = "DEPLOYMENT_SUCCESS";
//               baseMsg.outputs = job.result?.outputs || {};
//               baseMsg.access = job.result?.access || [];
//             } else if (job.job_type === "DESTROY" && job.status === "COMPLETED") {
//               historyMsgs.push({ role: "bot", text: baseMsg.text });
//               historyMsgs.push({
//                 role: "bot",
//                 text: "Destruction complete. All resources have been removed.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYED",
//                 structured_plan: { resource_changes: [] },
//               });
//               return;
//             } else if (job.job_type === "DESTROY" && job.status === "FAILED") {
//               historyMsgs.push({ role: "bot", text: baseMsg.text });
//               historyMsgs.push({
//                 role: "bot",
//                 text: "Destruction failed. Some resources may still exist.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYMENT_FAILED",
//                 structured_plan: { resource_changes: [] },
//               });
//               historyMsgs.push({
//                 role: "bot",
//                 type: "DEPLOYMENT_FAILED",
//                 text: "Destruction failed.",
//                 errorData: job.error_message || "Manual intervention may be required in the AWS Console.",
//               });
//               return;
//             } else if (job.status === "FAILED") {
//               baseMsg.type = "DEPLOYMENT_FAILED";
//               baseMsg.errorData =
//                 job.error_message || job.error || "An unknown error occurred.";
//             }
//           }

//           historyMsgs.push(baseMsg);
//         });

//         const lastCostMsg = historyMsgs.slice().reverse().find((m) => m.costData);
//         if (lastCostMsg) {
//           setCostData(lastCostMsg.costData);
//         } else {
//           setCostData(null);
//         }

//         chatCache.current[projId] = historyMsgs;
//         setMessages(historyMsgs);
//         setChatStarted(historyMsgs.length > 0);
//       }
//     } catch (e) {
//       console.error("Failed to load history:", e);
//     }
//   };

//   const handleProjectSelect = (projId, projName, silentSync = false) => {
//     setActiveProjectId(projId);
//     activeProjectIdRef.current = projId;
//     setConversationName(projName || "New Conversation");

//     if (!projId) {
//       setSessionId(null);
//       setMessages([]);
//       setChatStarted(false);
//       sessionAttributesRef.current = {};
//     } else {
//       setSessionId(projId);
//     }

//     if (!silentSync) {
//       setSidebarOpen(false);
//     }
//   };

//   const stopPolling = useCallback(() => {
//     if (planTimeoutRef.current) clearTimeout(planTimeoutRef.current);
//     if (applyIntervalRef.current) clearInterval(applyIntervalRef.current);
//     planTimeoutRef.current = null;
//     applyIntervalRef.current = null;
//   }, []);

//   /* ========================================================= */
//   /* UNIVERSAL POLLER                                           */
//   /* ========================================================= */

//   const pollStatus = (jobId, mode, relatedPlanJobId = null) => {
//     if (!jobId) return;
//     stopPolling();

//     setBotStatus(
//       mode === "plan"
//         ? "Terraform is planning..."
//         : mode === "destroy"
//         ? "Destroying infrastructure..."
//         : "Provisioning AWS Resources..."
//     );

//     const checkStatus = async () => {
//       try {
//         const data = await apiFetch(`/status/${jobId}`, { method: "GET" });

//         if (data.status === "COMPLETED") {
//           setBotStatus("");
//           stopPolling();
//           setActiveLogStatus("COMPLETED");

//           if (mode === "plan") {
//             updateMessages((prev) => [
//               ...prev,
//               {
//                 role: "bot",
//                 text: "Terraform plan complete. Review the resources below.",
//                 type: "PLAN_DISPLAY",
//                 structured_plan: data.structured_plan,
//                 planJobId: jobId,
//                 onCalculateCost: () => triggerCost(jobId),
//                 onApprove: () => triggerApply(jobId),
//                 onDiscard: () => discardPlan(jobId),
//               },
//             ]);
//           }

//           if (mode === "cost") {
//             const costSummary = data.cost_summary;
//             updateMessages((prev) =>
//               prev.map((msg) =>
//                 msg.planJobId === relatedPlanJobId
//                   ? { ...msg, costData: costSummary }
//                   : msg
//               )
//             );
//             setCostData(costSummary);
//           }

//           if (mode === "destroy") {
//             setCostData(null);

//             const blueprint = sessionAttributesRef.current.infra_blueprint
//               ? (() => {
//                   try { return JSON.parse(sessionAttributesRef.current.infra_blueprint); }
//                   catch { return null; }
//                 })()
//               : null;

//             const destroyChanges =
//               blueprint?.components?.map((c) => ({
//                 address: `module.${c.service}[0].aws_${c.service}_resource.this`,
//                 change: { actions: ["delete"] },
//               })) || [];

//             updateMessages((prev) => [
//               ...prev,
//               {
//                 role: "bot",
//                 text: "Destruction complete. All resources have been removed.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYED",
//                 structured_plan: { resource_changes: destroyChanges },
//               },
//             ]);

//             sessionAttributesRef.current.infra_blueprint = null;

//             apiFetch("/chats", {
//               method: "POST",
//               body: JSON.stringify({
//                 project_id: activeProjectIdRef.current,
//                 sender: "BOT",
//                 message_text: "Destruction complete. All resources have been removed.",
//                 job_id: jobId,
//               }),
//             }).catch(() => {});
//           }

//           if (mode === "apply") {
//             updateMessages((prev) => {
//               const updatedPrev = prev.map((msg) =>
//                 msg.planJobId === relatedPlanJobId
//                   ? {
//                       ...msg,
//                       planStatus: "DEPLOYED",
//                       onApprove: undefined,
//                       onCalculateCost: undefined,
//                       onDiscard: undefined,
//                     }
//                   : msg
//               );
//               return [
//                 ...updatedPrev,
//                 {
//                   role: "bot",
//                   type: "DEPLOYMENT_SUCCESS",
//                   text: "Deployment completed successfully.",
//                   outputs: data.outputs || {},
//                   access: data.access || [],
//                 },
//               ];
//             });

//             apiFetch("/chats", {
//               method: "POST",
//               body: JSON.stringify({
//                 project_id: activeProjectIdRef.current,
//                 sender: "BOT",
//                 message_text: "Deployment completed successfully.",
//                 job_id: jobId,
//               }),
//             }).catch(() => {});
//           }

//         } else if (data.status === "FAILED") {
//           setBotStatus("");
//           stopPolling();
//           setActiveLogStatus("FAILED");

//           if (mode === "destroy") {
//             const blueprint = sessionAttributesRef.current.infra_blueprint
//               ? (() => {
//                   try { return JSON.parse(sessionAttributesRef.current.infra_blueprint); }
//                   catch { return null; }
//                 })()
//               : null;

//             const destroyChanges =
//               blueprint?.components?.map((c) => ({
//                 address: `module.${c.service}[0].aws_${c.service}_resource.this`,
//                 change: { actions: ["delete"] },
//               })) || [];

//             updateMessages((prev) => [
//               ...prev,
//               {
//                 role: "bot",
//                 text: "Destruction failed. Some resources may still exist.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYMENT_FAILED",
//                 structured_plan: { resource_changes: destroyChanges },
//               },
//               {
//                 role: "bot",
//                 type: "DEPLOYMENT_FAILED",
//                 text: "Destruction failed.",
//                 errorData: data.error || "Manual intervention may be required in the AWS Console.",
//               },
//             ]);

//             apiFetch("/chats", {
//               method: "POST",
//               body: JSON.stringify({
//                 project_id: activeProjectIdRef.current,
//                 sender: "BOT",
//                 message_text: "Destruction failed. Manual intervention may be required.",
//                 job_id: jobId,
//               }),
//             }).catch(() => {});
//             return;
//           }

//           updateMessages((prev) => {
//             const updatedPrev =
//               mode === "apply"
//                 ? prev.map((msg) =>
//                     msg.planJobId === relatedPlanJobId
//                       ? {
//                           ...msg,
//                           planStatus: "DEPLOYMENT_FAILED",
//                           onApprove: undefined,
//                           onCalculateCost: undefined,
//                           onDiscard: undefined,
//                         }
//                       : msg
//                   )
//                 : prev;

//             return [
//               ...updatedPrev,
//               {
//                 role: "bot",
//                 type: "DEPLOYMENT_FAILED",
//                 text: "Process failed.",
//                 errorData:
//                   data.error ||
//                   data.error_message ||
//                   "An unknown deployment error occurred.",
//               },
//             ];
//           });
//         } else {
//           const delay = mode === "apply" || mode === "destroy" ? 4000 : 3000;
//           planTimeoutRef.current = setTimeout(checkStatus, delay);
//         }
//       } catch {
//         setBotStatus("Reconnecting...");
//         planTimeoutRef.current = setTimeout(checkStatus, 5000);
//       }
//     };

//     checkStatus();
//   };

//   /* ========================================================= */
//   /* ACTION TRIGGERS                                            */
//   /* ========================================================= */

//   const discardPlan = async (planJobId) => {
//     setCostData(null);
//     updateMessages((prev) =>
//       prev.map((msg) =>
//         msg.planJobId === planJobId
//           ? {
//               ...msg,
//               planStatus: "DISCARDED",
//               onApprove: undefined,
//               onCalculateCost: undefined,
//               onDiscard: undefined,
//             }
//           : msg
//       )
//     );
//     try {
//       await apiFetch(`/jobs/${planJobId}/discard`, { method: "POST" });
//     } catch (e) {
//       console.error("Failed to discard job in DB", e);
//     }
//   };

//   const triggerCost = async (planJobId) => {
//     try {
//       setBotStatus("Calculating infrastructure cost...");
//       const data = await apiFetch(`/cost`, {
//         method: "POST",
//         body: JSON.stringify({
//           run_id: planJobId,
//           project_id: activeProjectIdRef.current,
//         }),
//       });
//       pollStatus(data.job_id, "cost", planJobId);
//     } catch {
//       setBotStatus("");
//     }
//   };

//   const triggerApply = async (planJobId) => {
//     const blueprint = sessionAttributesRef.current.infra_blueprint
//       ? (() => {
//           try { return JSON.parse(sessionAttributesRef.current.infra_blueprint); }
//           catch { return null; }
//         })()
//       : null;

//     const payloadBody = {
//       project_id: activeProjectIdRef.current,
//       job_id: planJobId,
//     };
//     if (blueprint) payloadBody.infra_blueprint = blueprint;

//     try {
//       setBotStatus("Starting deployment...");
//       const data = await apiFetch(`/apply`, {
//         method: "POST",
//         body: JSON.stringify(payloadBody),
//       });

//       apiFetch("/chats", {
//         method: "POST",
//         body: JSON.stringify({
//           project_id: activeProjectIdRef.current,
//           sender: "BOT",
//           message_text: "Initiating deployment...",
//           job_id: data.apply_job_id,
//         }),
//       }).catch(() => console.error("Failed to save apply message"));

//       openLogs(data.apply_job_id, "apply", "RUNNING");
//       pollStatus(data.apply_job_id, "apply", planJobId);
//     } catch {
//       setBotStatus("");
//     }
//   };

//   /* ========================================================= */
//   /* CORE LEX HANDLER                                           */
//   /* ========================================================= */

//   const talkToLex = async (text, isSystemEvent = false) => {
//     let currentProjId = activeProjectIdRef.current;

//     if (!isSystemEvent) {
//       if (!currentProjId) {
//         try {
//           const newProjTitle =
//             text.length > 30 ? text.substring(0, 30) + "..." : text;
//           const projRes = await apiFetch("/projects", {
//             method: "POST",
//             body: JSON.stringify({
//               project_name: newProjTitle,
//               environment: "development",
//             }),
//           });
//           currentProjId = projRes.project_id;
//           handleProjectSelect(currentProjId, projRes.project_name, true);
//         } catch (e) {
//           console.error("Auto-create failed:", e);
//         }
//       }

//       updateMessages((prev) => [...prev, { role: "user", text }]);

//       if (currentProjId) {
//         apiFetch("/chats", {
//           method: "POST",
//           body: JSON.stringify({
//             project_id: currentProjId,
//             sender: "USER",
//             message_text: text,
//           }),
//         }).catch(() => {});
//       }

//       setIsTyping(true);
//       setBotStatus("CloudCrafter is thinking...");
//       setChatStarted(true);
//     }

//     try {
//       const command = new RecognizeTextCommand({
//         botId: BOT_ID,
//         botAliasId: ALIAS_ID,
//         localeId: "en_US",
//         sessionId: currentProjId || userId || "local-session",
//         text: text,
//         sessionState: {
//           sessionAttributes: {
//             ...sessionAttributesRef.current,
//             project_id: String(currentProjId),
//           },
//         },
//       });

//       const response = await lexClient.send(command);
//       const updatedAttrs = response.sessionState?.sessionAttributes || {};
//       sessionAttributesRef.current = updatedAttrs;

//       let payload = {};
//       try {
//         payload = JSON.parse(updatedAttrs.ui_payload || "{}");
//       } catch {}

//       if (payload.cost) {
//         setCostData(payload.cost);
//       }

//       const botMessage =
//         payload.message || response.messages?.[0]?.content || "";
//       const currentJobId =
//         payload.job_id || payload.plan_job_id || payload.apply_job_id;

//       const isDestroyFlow = payload.type === "DESTROY_STARTED";

//       const shouldPushLexMessage =
//         botMessage &&
//         payload.type !== "PLAN_STARTED" &&
//         payload.type !== "DESTROY_STARTED";

//       if (shouldPushLexMessage) {
//         updateMessages((prev) => [
//           ...prev,
//           {
//             role: "bot",
//             text: botMessage,
//             type: payload.type || undefined,
//           },
//         ]);
//       }

//       if (payload.type === "PLAN_STARTED") {
//         updateMessages((prev) => [
//           ...prev,
//           { role: "bot", text: botMessage, type: "PLAN_STARTED" },
//         ]);
//         openLogs(currentJobId, "plan", "RUNNING");
//         pollStatus(currentJobId, "plan");
//       } else if (payload.type === "APPLY_STARTED") {
//         pollStatus(currentJobId, "apply", payload.plan_job_id);
//       } else if (isDestroyFlow) {
//         updateMessages((prev) => [
//           ...prev,
//           { role: "bot", text: botMessage, type: "DESTROY_STARTED" },
//         ]);
//         openLogs(currentJobId, "destroy", "RUNNING");
//         pollStatus(currentJobId, "destroy");
//       }

//       if (botMessage && currentProjId) {
//         apiFetch("/chats", {
//           method: "POST",
//           body: JSON.stringify({
//             project_id: currentProjId,
//             sender: "BOT",
//             message_text: botMessage,
//             job_id: currentJobId || null,
//           }),
//         }).catch(() => {});
//       }
//     } catch {
//       updateMessages((prev) => [
//         ...prev,
//         { role: "bot", text: "⚠️ Connection lost." },
//       ]);
//     } finally {
//       if (!isSystemEvent) {
//         setIsTyping(false);
//         setBotStatus("");
//       }
//     }
//   };

//   const containerClass =
//     theme === "dark" ? "bg-[#050505] text-white" : "bg-zinc-50 text-zinc-900";

//   return (
//     <div className={`flex flex-col h-screen overflow-hidden ${containerClass}`}>
//       <header className="h-[60px] flex justify-between items-center px-6 border-b border-white/10 shrink-0">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="p-2 hover:bg-white/5 rounded-lg transition-colors"
//           >
//             ☰
//           </button>
//           <div className="flex flex-col">
//             <span className="font-bold text-sm tracking-tight uppercase opacity-50">
//               CloudCrafter v1.0
//             </span>
//             <span className="font-medium text-xs truncate max-w-[200px]">
//               {conversationName}
//             </span>
//           </div>
//         </div>

//         <div className="flex items-center gap-4">
//           {costData && (
//             <button className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-all hidden sm:block">
//               Est. ${costData.monthly_cost?.toFixed(2) || "0.00"}
//             </button>
//           )}

//           {/* Single Logs toggle button */}
//           {activeLogJobId && (
//             <button
//               onClick={() => setLogPanelOpen((p) => !p)}
//               className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all hidden sm:flex
//                 ${logPanelOpen
//                   ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
//                   : "bg-white/5 text-zinc-400 border-white/10 hover:text-zinc-200 hover:bg-white/10"}`}
//             >
//               <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
//                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <polyline points="4 17 10 11 4 5" />
//                 <line x1="12" y1="19" x2="20" y2="19" />
//               </svg>
//               Logs
//               {activeLogStatus === "RUNNING" && (
//                 <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
//               )}
//             </button>
//           )}

//           <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-white/10">
//             <div className="hidden sm:flex flex-col text-right">
//               <span className="text-xs font-bold text-zinc-200">{displayName}</span>
//               <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
//                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
//                 Connected
//               </span>
//             </div>

//             <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30 uppercase shrink-0">
//               {displayName.charAt(0)}
//             </div>

//             <button
//               onClick={() => navigate("/logout")}
//               className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all ml-1"
//               title="Logout"
//             >
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
//                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
//                 <polyline points="16 17 21 12 16 7"></polyline>
//                 <line x1="21" y1="12" x2="9" y2="12"></line>
//               </svg>
//             </button>
//           </div>
//         </div>
//       </header>

//       <div className="flex flex-1 relative overflow-hidden">
//         {/* Single LogPanel instance */}
//         <LogPanel
//           isOpen={logPanelOpen}
//           onClose={() => setLogPanelOpen(false)}
//           jobId={activeLogJobId}
//           jobMode={activeLogMode}
//           jobStatus={activeLogStatus}
//           theme={theme}
//         />

//         <Sidebar
//           isOpen={sidebarOpen}
//           onClose={() => setSidebarOpen(false)}
//           onToggleTheme={() => setTheme((p) => (p === "dark" ? "light" : "dark"))}
//           currentTheme={theme}
//           activeProjectId={activeProjectId}
//           onSelectProject={handleProjectSelect}
//         />

//         <main className="flex-1 flex flex-col relative min-w-0">
//           <ChatFeed
//             messages={messages}
//             isTyping={isTyping}
//             botStatus={botStatus}
//             chatStarted={chatStarted}
//             onOptionClick={(val) => talkToLex(val)}
//             theme={theme}
//             onViewLogs={openLogs}
//           />

//           <CommandInput
//             onSend={(val) => talkToLex(val)}
//             isTyping={isTyping}
//             chatStarted={chatStarted}
//             disabled={
//               botStatus !== "" &&
//               botStatus !== "CloudCrafter is thinking..."
//             }
//             theme={theme}
//           />
//         </main>
//       </div>
//     </div>
//   );
// };

// export default ConsoleLayout;

// import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   LexRuntimeV2Client,
//   RecognizeTextCommand,
// } from "@aws-sdk/client-lex-runtime-v2";
// import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
// import {
//   CognitoIdentityClient,
//   GetIdCommand,
// } from "@aws-sdk/client-cognito-identity";
// import Sidebar from "./Sidebar";
// import ChatFeed from "./ChatFeed";
// import CommandInput from "./CommandInput";
// import { apiFetch } from "../utils/api";
// import LogPanel from "../pages/LogPanel";

// /* ---------------- CONFIG & CLIENTS ---------------- */

// const REGION = process.env.REACT_APP_AWS_REGION;
// const BOT_ID = process.env.REACT_APP_LEX_BOT_ID;
// const ALIAS_ID = process.env.REACT_APP_LEX_BOT_ALIAS_ID;
// const POOL_ID = process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID;

// const lexClient = new LexRuntimeV2Client({
//   region: REGION,
//   credentials: fromCognitoIdentityPool({
//     identityPoolId: POOL_ID,
//     clientConfig: { region: REGION },
//   }),
// });

// const getSessionId = () => sessionStorage.getItem("cc_project_id");
// const setSessionId = (id) =>
//   id
//     ? sessionStorage.setItem("cc_project_id", id)
//     : sessionStorage.removeItem("cc_project_id");

// const ConsoleLayout = () => {
//   const navigate = useNavigate();

//   const sessionAttributesRef = useRef({});
//   const chatCache = useRef({});
//   const activeProjectIdRef = useRef(getSessionId());

//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [theme, setTheme] = useState("dark");
//   const [userId, setUserId] = useState(null);

//   const [activeProjectId, setActiveProjectId] = useState(getSessionId());
//   const [conversationName, setConversationName] = useState("New Conversation");

//   const [messages, setMessages] = useState([]);
//   const [chatStarted, setChatStarted] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [botStatus, setBotStatus] = useState("");

//   const [costData, setCostData] = useState(null);

//   // ── Log panel state ────────────────────────────────────────────────────────
//   // Per-project log tracking: each project remembers its last job independently.
//   // Shape: { [projectId]: { jobId, mode, status } }
//   const projectLogsRef = useRef({});

//   const [logPanelOpen, setLogPanelOpen]       = useState(false);
//   const [activeLogJobId, setActiveLogJobId]   = useState(null);
//   const [activeLogMode, setActiveLogMode]     = useState(null);
//   const [activeLogStatus, setActiveLogStatus] = useState(null);

//   const openLogs = useCallback((jobId, mode, status) => {
//     const projId = activeProjectIdRef.current;
//     // Persist this job against the current project
//     if (projId && jobId) {
//       projectLogsRef.current[projId] = { jobId, mode, status: status || "RUNNING" };
//     }
//     setActiveLogJobId(jobId);
//     setActiveLogMode(mode);
//     setActiveLogStatus(status || "RUNNING");
//     setLogPanelOpen(true);
//   }, []);

//   // Restore the correct log job when switching projects
//   const restoreProjectLogs = useCallback((projId) => {
//     const saved = projId ? projectLogsRef.current[projId] : null;
//     if (saved) {
//       setActiveLogJobId(saved.jobId);
//       setActiveLogMode(saved.mode);
//       setActiveLogStatus(saved.status);
//     } else {
//       setActiveLogJobId(null);
//       setActiveLogMode(null);
//       setActiveLogStatus(null);
//     }
//     setLogPanelOpen(false);
//   }, []);

//   const planTimeoutRef = useRef(null);
//   const applyIntervalRef = useRef(null);

//   const session = useMemo(() => {
//     try {
//       return JSON.parse(localStorage.getItem("cloudcrafter_session") || "null");
//     } catch {
//       return null;
//     }
//   }, []);

//   const displayName = session?.full_name || session?.email || "User";

//   useEffect(() => {
//     activeProjectIdRef.current = activeProjectId;
//   }, [activeProjectId]);

//   const updateMessages = useCallback((updater) => {
//     setMessages((prev) => {
//       const newMsgs = typeof updater === "function" ? updater(prev) : updater;
//       if (activeProjectIdRef.current) {
//         chatCache.current[activeProjectIdRef.current] = newMsgs;
//       }
//       return newMsgs;
//     });
//   }, []);

//   useEffect(() => {
//     const identityClient = new CognitoIdentityClient({ region: REGION });
//     const getId = async () => {
//       try {
//         const res = await identityClient.send(new GetIdCommand({ IdentityPoolId: POOL_ID }));
//         setUserId(res.IdentityId);
//       } catch {
//         setUserId("anon-" + Math.random().toString(36).substring(7));
//       }
//     };
//     getId();
//   }, []);

//   useEffect(() => {
//     document.documentElement.classList.toggle("dark", theme === "dark");
//   }, [theme]);

//   /* ---------------- HISTORY LOADING ---------------- */

//   useEffect(() => {
//     if (activeProjectId) {
//       setSessionId(activeProjectId);
//       loadChatHistory(activeProjectId);
//     } else {
//       setSessionId(null);
//       setMessages([]);
//       setChatStarted(false);
//       setConversationName("New Conversation");
//       sessionAttributesRef.current = {};
//     }
//   }, [activeProjectId]);

//   const loadChatHistory = async (projId) => {
//     if (chatCache.current[projId]) {
//       setMessages(chatCache.current[projId]);
//       setChatStarted(chatCache.current[projId].length > 0);
//       return;
//     }

//     try {
//       const data = await apiFetch(`/chats/${projId}`);
//       if (data.messages) {
//         const sortedMessages = data.messages.sort(
//           (a, b) =>
//             new Date(a.created_at || a.timestamp) -
//             new Date(b.created_at || b.timestamp)
//         );

//         const applyStatusMap = {};
//         sortedMessages.forEach((m) => {
//           if (
//             m.job_details &&
//             m.job_details.job_type === "APPLY" &&
//             m.job_details.plan_ref
//           ) {
//             applyStatusMap[m.job_details.plan_ref] = m.job_details.status;
//           }
//         });

//         const lastBotMessageWithBlueprint = [...data.messages]
//           .reverse()
//           .find((m) => m.sender.toUpperCase() === "BOT" && m.job_details?.blueprint);

//         if (lastBotMessageWithBlueprint) {
//           sessionAttributesRef.current.infra_blueprint = JSON.stringify(
//             lastBotMessageWithBlueprint.job_details.blueprint
//           );
//         }

//         const historyMsgs = [];

//         sortedMessages.forEach((m) => {
//           const baseMsg = {
//             role: m.sender.toUpperCase() === "USER" ? "user" : "bot",
//             text: m.message_text,
//           };

//           if (m.job_details) {
//             const job = m.job_details;

//             if (
//               job.job_type === "PLAN" &&
//               (job.status === "COMPLETED" || job.status === "DISCARDED")
//             ) {
//               if (baseMsg.text) {
//                 historyMsgs.push({ role: "bot", text: baseMsg.text });
//               }

//               const planMsg = {
//                 role: "bot",
//                 text: "Terraform plan complete. Review the resources below.",
//                 type: "PLAN_DISPLAY",
//                 structured_plan: job.result || { resource_changes: [] },
//                 planJobId: job.job_id,
//               };

//               if (job.status === "DISCARDED") {
//                 planMsg.planStatus = "DISCARDED";
//               } else if (applyStatusMap[job.job_id] === "COMPLETED") {
//                 planMsg.planStatus = "DEPLOYED";
//               } else if (applyStatusMap[job.job_id] === "FAILED") {
//                 planMsg.planStatus = "DEPLOYMENT_FAILED";
//               } else {
//                 planMsg.planStatus = "NOT_DEPLOYED";
//               }

//               if (job.cost_summary) {
//                 planMsg.costData = job.cost_summary;
//               }

//               historyMsgs.push(planMsg);
//               return;
//             } else if (job.job_type === "APPLY" && job.status === "COMPLETED") {
//               baseMsg.type = "DEPLOYMENT_SUCCESS";
//               baseMsg.outputs = job.result?.outputs || {};
//               baseMsg.access = job.result?.access || [];
//             } else if (job.job_type === "DESTROY" && job.status === "COMPLETED") {
//               historyMsgs.push({ role: "bot", text: baseMsg.text });
//               historyMsgs.push({
//                 role: "bot",
//                 text: "Destruction complete. All resources have been removed.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYED",
//                 structured_plan: { resource_changes: [] },
//               });
//               return;
//             } else if (job.job_type === "DESTROY" && job.status === "FAILED") {
//               historyMsgs.push({ role: "bot", text: baseMsg.text });
//               historyMsgs.push({
//                 role: "bot",
//                 text: "Destruction failed. Some resources may still exist.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYMENT_FAILED",
//                 structured_plan: { resource_changes: [] },
//               });
//               historyMsgs.push({
//                 role: "bot",
//                 type: "DEPLOYMENT_FAILED",
//                 text: "Destruction failed.",
//                 errorData: job.error_message || "Manual intervention may be required in the AWS Console.",
//               });
//               return;
//             } else if (job.status === "FAILED") {
//               baseMsg.type = "DEPLOYMENT_FAILED";
//               baseMsg.errorData =
//                 job.error_message || job.error || "An unknown error occurred.";
//             }
//           }

//           historyMsgs.push(baseMsg);
//         });

//         const lastCostMsg = historyMsgs.slice().reverse().find((m) => m.costData);
//         if (lastCostMsg) {
//           setCostData(lastCostMsg.costData);
//         } else {
//           setCostData(null);
//         }

//         chatCache.current[projId] = historyMsgs;
//         setMessages(historyMsgs);
//         setChatStarted(historyMsgs.length > 0);
//       }
//     } catch (e) {
//       console.error("Failed to load history:", e);
//     }
//   };

//   const handleProjectSelect = (projId, projName, silentSync = false) => {
//     setActiveProjectId(projId);
//     activeProjectIdRef.current = projId;
//     setConversationName(projName || "New Conversation");

//     if (!projId) {
//       setSessionId(null);
//       setMessages([]);
//       setChatStarted(false);
//       sessionAttributesRef.current = {};
//     } else {
//       setSessionId(projId);
//     }

//     // Restore this project's last log job (or clear if none)
//     restoreProjectLogs(projId);

//     if (!silentSync) {
//       setSidebarOpen(false);
//     }
//   };

//   const stopPolling = useCallback(() => {
//     if (planTimeoutRef.current) clearTimeout(planTimeoutRef.current);
//     if (applyIntervalRef.current) clearInterval(applyIntervalRef.current);
//     planTimeoutRef.current = null;
//     applyIntervalRef.current = null;
//   }, []);

//   /* ========================================================= */
//   /* UNIVERSAL POLLER                                           */
//   /* ========================================================= */

//   const pollStatus = (jobId, mode, relatedPlanJobId = null) => {
//     if (!jobId) return;
//     stopPolling();

//     setBotStatus(
//       mode === "plan"
//         ? "Terraform is planning..."
//         : mode === "destroy"
//         ? "Destroying infrastructure..."
//         : "Provisioning AWS Resources..."
//     );

//     const checkStatus = async () => {
//       try {
//         const data = await apiFetch(`/status/${jobId}`, { method: "GET" });

//         if (data.status === "COMPLETED") {
//           setBotStatus("");
//           stopPolling();
//           setActiveLogStatus("COMPLETED");
//           // Update persisted status so it survives project switches
//           const _pid = activeProjectIdRef.current;
//           if (_pid && projectLogsRef.current[_pid]) {
//             projectLogsRef.current[_pid].status = "COMPLETED";
//           }

//           if (mode === "plan") {
//             updateMessages((prev) => [
//               ...prev,
//               {
//                 role: "bot",
//                 text: "Terraform plan complete. Review the resources below.",
//                 type: "PLAN_DISPLAY",
//                 structured_plan: data.structured_plan,
//                 planJobId: jobId,
//                 onCalculateCost: () => triggerCost(jobId),
//                 onApprove: () => triggerApply(jobId),
//                 onDiscard: () => discardPlan(jobId),
//               },
//             ]);
//           }

//           if (mode === "cost") {
//             const costSummary = data.cost_summary;
//             updateMessages((prev) =>
//               prev.map((msg) =>
//                 msg.planJobId === relatedPlanJobId
//                   ? { ...msg, costData: costSummary }
//                   : msg
//               )
//             );
//             setCostData(costSummary);
//           }

//           if (mode === "destroy") {
//             setCostData(null);

//             const blueprint = sessionAttributesRef.current.infra_blueprint
//               ? (() => {
//                   try { return JSON.parse(sessionAttributesRef.current.infra_blueprint); }
//                   catch { return null; }
//                 })()
//               : null;

//             const destroyChanges =
//               blueprint?.components?.map((c) => ({
//                 address: `module.${c.service}[0].aws_${c.service}_resource.this`,
//                 change: { actions: ["delete"] },
//               })) || [];

//             updateMessages((prev) => [
//               ...prev,
//               {
//                 role: "bot",
//                 text: "Destruction complete. All resources have been removed.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYED",
//                 structured_plan: { resource_changes: destroyChanges },
//               },
//             ]);

//             sessionAttributesRef.current.infra_blueprint = null;

//             apiFetch("/chats", {
//               method: "POST",
//               body: JSON.stringify({
//                 project_id: activeProjectIdRef.current,
//                 sender: "BOT",
//                 message_text: "Destruction complete. All resources have been removed.",
//                 job_id: jobId,
//               }),
//             }).catch(() => {});
//           }

//           if (mode === "apply") {
//             updateMessages((prev) => {
//               const updatedPrev = prev.map((msg) =>
//                 msg.planJobId === relatedPlanJobId
//                   ? {
//                       ...msg,
//                       planStatus: "DEPLOYED",
//                       onApprove: undefined,
//                       onCalculateCost: undefined,
//                       onDiscard: undefined,
//                     }
//                   : msg
//               );
//               return [
//                 ...updatedPrev,
//                 {
//                   role: "bot",
//                   type: "DEPLOYMENT_SUCCESS",
//                   text: "Deployment completed successfully.",
//                   outputs: data.outputs || {},
//                   access: data.access || [],
//                 },
//               ];
//             });

//             apiFetch("/chats", {
//               method: "POST",
//               body: JSON.stringify({
//                 project_id: activeProjectIdRef.current,
//                 sender: "BOT",
//                 message_text: "Deployment completed successfully.",
//                 job_id: jobId,
//               }),
//             }).catch(() => {});
//           }

//         } else if (data.status === "FAILED") {
//           setBotStatus("");
//           stopPolling();
//           setActiveLogStatus("FAILED");
//           // Update persisted status so it survives project switches
//           const _pid2 = activeProjectIdRef.current;
//           if (_pid2 && projectLogsRef.current[_pid2]) {
//             projectLogsRef.current[_pid2].status = "FAILED";
//           }

//           if (mode === "destroy") {
//             const blueprint = sessionAttributesRef.current.infra_blueprint
//               ? (() => {
//                   try { return JSON.parse(sessionAttributesRef.current.infra_blueprint); }
//                   catch { return null; }
//                 })()
//               : null;

//             const destroyChanges =
//               blueprint?.components?.map((c) => ({
//                 address: `module.${c.service}[0].aws_${c.service}_resource.this`,
//                 change: { actions: ["delete"] },
//               })) || [];

//             updateMessages((prev) => [
//               ...prev,
//               {
//                 role: "bot",
//                 text: "Destruction failed. Some resources may still exist.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYMENT_FAILED",
//                 structured_plan: { resource_changes: destroyChanges },
//               },
//               {
//                 role: "bot",
//                 type: "DEPLOYMENT_FAILED",
//                 text: "Destruction failed.",
//                 errorData: data.error || "Manual intervention may be required in the AWS Console.",
//               },
//             ]);

//             apiFetch("/chats", {
//               method: "POST",
//               body: JSON.stringify({
//                 project_id: activeProjectIdRef.current,
//                 sender: "BOT",
//                 message_text: "Destruction failed. Manual intervention may be required.",
//                 job_id: jobId,
//               }),
//             }).catch(() => {});
//             return;
//           }

//           updateMessages((prev) => {
//             const updatedPrev =
//               mode === "apply"
//                 ? prev.map((msg) =>
//                     msg.planJobId === relatedPlanJobId
//                       ? {
//                           ...msg,
//                           planStatus: "DEPLOYMENT_FAILED",
//                           onApprove: undefined,
//                           onCalculateCost: undefined,
//                           onDiscard: undefined,
//                         }
//                       : msg
//                   )
//                 : prev;

//             return [
//               ...updatedPrev,
//               {
//                 role: "bot",
//                 type: "DEPLOYMENT_FAILED",
//                 text: "Process failed.",
//                 errorData:
//                   data.error ||
//                   data.error_message ||
//                   "An unknown deployment error occurred.",
//               },
//             ];
//           });
//         } else {
//           const delay = mode === "apply" || mode === "destroy" ? 4000 : 3000;
//           planTimeoutRef.current = setTimeout(checkStatus, delay);
//         }
//       } catch {
//         setBotStatus("Reconnecting...");
//         planTimeoutRef.current = setTimeout(checkStatus, 5000);
//       }
//     };

//     checkStatus();
//   };

//   /* ========================================================= */
//   /* ACTION TRIGGERS                                            */
//   /* ========================================================= */

//   const discardPlan = async (planJobId) => {
//     setCostData(null);
//     updateMessages((prev) =>
//       prev.map((msg) =>
//         msg.planJobId === planJobId
//           ? {
//               ...msg,
//               planStatus: "DISCARDED",
//               onApprove: undefined,
//               onCalculateCost: undefined,
//               onDiscard: undefined,
//             }
//           : msg
//       )
//     );
//     try {
//       await apiFetch(`/jobs/${planJobId}/discard`, { method: "POST" });
//     } catch (e) {
//       console.error("Failed to discard job in DB", e);
//     }
//   };

//   const triggerCost = async (planJobId) => {
//     try {
//       setBotStatus("Calculating infrastructure cost...");
//       const data = await apiFetch(`/cost`, {
//         method: "POST",
//         body: JSON.stringify({
//           run_id: planJobId,
//           project_id: activeProjectIdRef.current,
//         }),
//       });
//       pollStatus(data.job_id, "cost", planJobId);
//     } catch {
//       setBotStatus("");
//     }
//   };

//   const triggerApply = async (planJobId) => {
//     const blueprint = sessionAttributesRef.current.infra_blueprint
//       ? (() => {
//           try { return JSON.parse(sessionAttributesRef.current.infra_blueprint); }
//           catch { return null; }
//         })()
//       : null;

//     const payloadBody = {
//       project_id: activeProjectIdRef.current,
//       job_id: planJobId,
//     };
//     if (blueprint) payloadBody.infra_blueprint = blueprint;

//     try {
//       setBotStatus("Starting deployment...");
//       const data = await apiFetch(`/apply`, {
//         method: "POST",
//         body: JSON.stringify(payloadBody),
//       });

//       apiFetch("/chats", {
//         method: "POST",
//         body: JSON.stringify({
//           project_id: activeProjectIdRef.current,
//           sender: "BOT",
//           message_text: "Initiating deployment...",
//           job_id: data.apply_job_id,
//         }),
//       }).catch(() => console.error("Failed to save apply message"));

//       openLogs(data.apply_job_id, "apply", "RUNNING");
//       pollStatus(data.apply_job_id, "apply", planJobId);
//     } catch {
//       setBotStatus("");
//     }
//   };

//   /* ========================================================= */
//   /* CORE LEX HANDLER                                           */
//   /* ========================================================= */

//   const talkToLex = async (text, isSystemEvent = false) => {
//     let currentProjId = activeProjectIdRef.current;

//     if (!isSystemEvent) {
//       if (!currentProjId) {
//         try {
//           const newProjTitle =
//             text.length > 30 ? text.substring(0, 30) + "..." : text;
//           const projRes = await apiFetch("/projects", {
//             method: "POST",
//             body: JSON.stringify({
//               project_name: newProjTitle,
//               environment: "development",
//             }),
//           });
//           currentProjId = projRes.project_id;
//           handleProjectSelect(currentProjId, projRes.project_name, true);
//         } catch (e) {
//           console.error("Auto-create failed:", e);
//         }
//       }

//       updateMessages((prev) => [...prev, { role: "user", text }]);

//       if (currentProjId) {
//         apiFetch("/chats", {
//           method: "POST",
//           body: JSON.stringify({
//             project_id: currentProjId,
//             sender: "USER",
//             message_text: text,
//           }),
//         }).catch(() => {});
//       }

//       setIsTyping(true);
//       setBotStatus("CloudCrafter is thinking...");
//       setChatStarted(true);
//     }

//     try {
//       const command = new RecognizeTextCommand({
//         botId: BOT_ID,
//         botAliasId: ALIAS_ID,
//         localeId: "en_US",
//         sessionId: currentProjId || userId || "local-session",
//         text: text,
//         sessionState: {
//           sessionAttributes: {
//             ...sessionAttributesRef.current,
//             project_id: String(currentProjId),
//           },
//         },
//       });

//       const response = await lexClient.send(command);
//       const updatedAttrs = response.sessionState?.sessionAttributes || {};
//       sessionAttributesRef.current = updatedAttrs;

//       let payload = {};
//       try {
//         payload = JSON.parse(updatedAttrs.ui_payload || "{}");
//       } catch {}

//       if (payload.cost) {
//         setCostData(payload.cost);
//       }

//       const botMessage =
//         payload.message || response.messages?.[0]?.content || "";
//       const currentJobId =
//         payload.job_id || payload.plan_job_id || payload.apply_job_id;

//       const isDestroyFlow = payload.type === "DESTROY_STARTED";

//       const shouldPushLexMessage =
//         botMessage &&
//         payload.type !== "PLAN_STARTED" &&
//         payload.type !== "DESTROY_STARTED";

//       if (shouldPushLexMessage) {
//         updateMessages((prev) => [
//           ...prev,
//           {
//             role: "bot",
//             text: botMessage,
//             type: payload.type || undefined,
//           },
//         ]);
//       }

//       if (payload.type === "PLAN_STARTED") {
//         updateMessages((prev) => [
//           ...prev,
//           { role: "bot", text: botMessage, type: "PLAN_STARTED" },
//         ]);
//         openLogs(currentJobId, "plan", "RUNNING");
//         pollStatus(currentJobId, "plan");
//       } else if (payload.type === "APPLY_STARTED") {
//         pollStatus(currentJobId, "apply", payload.plan_job_id);
//       } else if (isDestroyFlow) {
//         updateMessages((prev) => [
//           ...prev,
//           { role: "bot", text: botMessage, type: "DESTROY_STARTED" },
//         ]);
//         openLogs(currentJobId, "destroy", "RUNNING");
//         pollStatus(currentJobId, "destroy");
//       }

//       if (botMessage && currentProjId) {
//         apiFetch("/chats", {
//           method: "POST",
//           body: JSON.stringify({
//             project_id: currentProjId,
//             sender: "BOT",
//             message_text: botMessage,
//             job_id: currentJobId || null,
//           }),
//         }).catch(() => {});
//       }
//     } catch {
//       updateMessages((prev) => [
//         ...prev,
//         { role: "bot", text: "⚠️ Connection lost." },
//       ]);
//     } finally {
//       if (!isSystemEvent) {
//         setIsTyping(false);
//         setBotStatus("");
//       }
//     }
//   };

//   const containerClass =
//     theme === "dark" ? "bg-[#050505] text-white" : "bg-zinc-50 text-zinc-900";

//   return (
//     <div className={`flex flex-col h-screen overflow-hidden ${containerClass}`}>
//       <header className="h-[60px] flex justify-between items-center px-6 border-b border-white/10 shrink-0">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="p-2 hover:bg-white/5 rounded-lg transition-colors"
//           >
//             ☰
//           </button>
//           <div className="flex flex-col">
//             <span className="font-bold text-sm tracking-tight uppercase opacity-50">
//               CloudCrafter v1.0
//             </span>
//             <span className="font-medium text-xs truncate max-w-[200px]">
//               {conversationName}
//             </span>
//           </div>
//         </div>

//         <div className="flex items-center gap-4">
//           {costData && (
//             <button className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-all hidden sm:block">
//               Est. ${costData.monthly_cost?.toFixed(2) || "0.00"}
//             </button>
//           )}

//           {/* Single Logs toggle button */}
//           {activeLogJobId && (
//             <button
//               onClick={() => setLogPanelOpen((p) => !p)}
//               className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all hidden sm:flex
//                 ${logPanelOpen
//                   ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
//                   : "bg-white/5 text-zinc-400 border-white/10 hover:text-zinc-200 hover:bg-white/10"}`}
//             >
//               <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
//                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <polyline points="4 17 10 11 4 5" />
//                 <line x1="12" y1="19" x2="20" y2="19" />
//               </svg>
//               Logs
//               {activeLogStatus === "RUNNING" && (
//                 <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
//               )}
//             </button>
//           )}

//           <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-white/10">
//             <div className="hidden sm:flex flex-col text-right">
//               <span className="text-xs font-bold text-zinc-200">{displayName}</span>
//               <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
//                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
//                 Connected
//               </span>
//             </div>

//             <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30 uppercase shrink-0">
//               {displayName.charAt(0)}
//             </div>

//             <button
//               onClick={() => navigate("/logout")}
//               className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all ml-1"
//               title="Logout"
//             >
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
//                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
//                 <polyline points="16 17 21 12 16 7"></polyline>
//                 <line x1="21" y1="12" x2="9" y2="12"></line>
//               </svg>
//             </button>
//           </div>
//         </div>
//       </header>

//       <div className="flex flex-1 relative overflow-hidden">
//         {/* Single LogPanel instance */}
//         <LogPanel
//           isOpen={logPanelOpen}
//           onClose={() => setLogPanelOpen(false)}
//           jobId={activeLogJobId}
//           jobMode={activeLogMode}
//           jobStatus={activeLogStatus}
//           theme={theme}
//         />

//         <Sidebar
//           isOpen={sidebarOpen}
//           onClose={() => setSidebarOpen(false)}
//           onToggleTheme={() => setTheme((p) => (p === "dark" ? "light" : "dark"))}
//           currentTheme={theme}
//           activeProjectId={activeProjectId}
//           onSelectProject={handleProjectSelect}
//         />

//         <main className="flex-1 flex flex-col relative min-w-0">
//           <ChatFeed
//             messages={messages}
//             isTyping={isTyping}
//             botStatus={botStatus}
//             chatStarted={chatStarted}
//             onOptionClick={(val) => talkToLex(val)}
//             theme={theme}
//             onViewLogs={openLogs}
//           />

//           <CommandInput
//             onSend={(val) => talkToLex(val)}
//             isTyping={isTyping}
//             chatStarted={chatStarted}
//             disabled={
//               botStatus !== "" &&
//               botStatus !== "CloudCrafter is thinking..."
//             }
//             theme={theme}
//           />
//         </main>
//       </div>
//     </div>
//   );
// };

// export default ConsoleLayout;


// import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   LexRuntimeV2Client,
//   RecognizeTextCommand,
// } from "@aws-sdk/client-lex-runtime-v2";
// import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
// import {
//   CognitoIdentityClient,
//   GetIdCommand,
// } from "@aws-sdk/client-cognito-identity";
// import Sidebar from "./Sidebar";
// import ChatFeed from "./ChatFeed";
// import CommandInput from "./CommandInput";
// import { apiFetch } from "../utils/api";
// import LogPanel from "../pages/LogPanel";

// /* ---------------- CONFIG & CLIENTS ---------------- */

// const REGION = process.env.REACT_APP_AWS_REGION;
// const BOT_ID = process.env.REACT_APP_LEX_BOT_ID;
// const ALIAS_ID = process.env.REACT_APP_LEX_BOT_ALIAS_ID;
// const POOL_ID = process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID;

// const lexClient = new LexRuntimeV2Client({
//   region: REGION,
//   credentials: fromCognitoIdentityPool({
//     identityPoolId: POOL_ID,
//     clientConfig: { region: REGION },
//   }),
// });

// const getSessionId = () => sessionStorage.getItem("cc_project_id");
// const setSessionId = (id) =>
//   id
//     ? sessionStorage.setItem("cc_project_id", id)
//     : sessionStorage.removeItem("cc_project_id");

// const ConsoleLayout = () => {
//   const navigate = useNavigate();

//   const sessionAttributesRef = useRef({});
//   const chatCache = useRef({});
//   const activeProjectIdRef = useRef(getSessionId());

//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [theme, setTheme] = useState("dark");
//   const [userId, setUserId] = useState(null);

//   const [activeProjectId, setActiveProjectId] = useState(getSessionId());
//   const [conversationName, setConversationName] = useState("New Conversation");

//   const [messages, setMessages] = useState([]);
//   const [chatStarted, setChatStarted] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [botStatus, setBotStatus] = useState("");

//   const [costData, setCostData] = useState(null);

//   // ── Log panel state ────────────────────────────────────────────────────────
//   // Per-project log tracking: each project remembers its last job independently.
//   // Shape: { [projectId]: { jobId, mode, status } }
//   const projectLogsRef = useRef({});

//   const [logPanelOpen, setLogPanelOpen]       = useState(false);
//   const [activeLogJobId, setActiveLogJobId]   = useState(null);
//   const [activeLogMode, setActiveLogMode]     = useState(null);
//   const [activeLogStatus, setActiveLogStatus] = useState(null);

//   const openLogs = useCallback((jobId, mode, status) => {
//     const projId = activeProjectIdRef.current;
//     // Persist this job against the current project
//     if (projId && jobId) {
//       projectLogsRef.current[projId] = { jobId, mode, status: status || "RUNNING" };
//     }
//     setActiveLogJobId(jobId);
//     setActiveLogMode(mode);
//     setActiveLogStatus(status || "RUNNING");
//     setLogPanelOpen(true);
//   }, []);

//   // Restore the correct log job when switching projects
//   const restoreProjectLogs = useCallback((projId) => {
//     const saved = projId ? projectLogsRef.current[projId] : null;
//     if (saved) {
//       setActiveLogJobId(saved.jobId);
//       setActiveLogMode(saved.mode);
//       setActiveLogStatus(saved.status);
//     } else {
//       setActiveLogJobId(null);
//       setActiveLogMode(null);
//       setActiveLogStatus(null);
//     }
//     setLogPanelOpen(false);
//   }, []);

//   const planTimeoutRef = useRef(null);
//   const applyIntervalRef = useRef(null);

//   const session = useMemo(() => {
//     try {
//       return JSON.parse(localStorage.getItem("cloudcrafter_session") || "null");
//     } catch {
//       return null;
//     }
//   }, []);

//   const displayName = session?.full_name || session?.email || "User";

//   useEffect(() => {
//     activeProjectIdRef.current = activeProjectId;
//   }, [activeProjectId]);

//   const updateMessages = useCallback((updater) => {
//     setMessages((prev) => {
//       const newMsgs = typeof updater === "function" ? updater(prev) : updater;
//       if (activeProjectIdRef.current) {
//         chatCache.current[activeProjectIdRef.current] = newMsgs;
//       }
//       return newMsgs;
//     });
//   }, []);

//   useEffect(() => {
//     const identityClient = new CognitoIdentityClient({ region: REGION });
//     const getId = async () => {
//       try {
//         const res = await identityClient.send(new GetIdCommand({ IdentityPoolId: POOL_ID }));
//         setUserId(res.IdentityId);
//       } catch {
//         setUserId("anon-" + Math.random().toString(36).substring(7));
//       }
//     };
//     getId();
//   }, []);

//   useEffect(() => {
//     document.documentElement.classList.toggle("dark", theme === "dark");
//   }, [theme]);

//   /* ---------------- HISTORY LOADING ---------------- */

//   useEffect(() => {
//     if (activeProjectId) {
//       setSessionId(activeProjectId);
//       loadChatHistory(activeProjectId);
//     } else {
//       setSessionId(null);
//       setMessages([]);
//       setChatStarted(false);
//       setConversationName("New Conversation");
//       sessionAttributesRef.current = {};
//     }
//   }, [activeProjectId]);

//   const loadChatHistory = async (projId) => {
//     if (chatCache.current[projId]) {
//       setMessages(chatCache.current[projId]);
//       setChatStarted(chatCache.current[projId].length > 0);
//       return;
//     }

//     try {
//       const data = await apiFetch(`/chats/${projId}`);
//       if (data.messages) {
//         const sortedMessages = data.messages.sort(
//           (a, b) =>
//             new Date(a.created_at || a.timestamp) -
//             new Date(b.created_at || b.timestamp)
//         );

//         const applyStatusMap = {};
//         sortedMessages.forEach((m) => {
//           if (
//             m.job_details &&
//             m.job_details.job_type === "APPLY" &&
//             m.job_details.plan_ref
//           ) {
//             applyStatusMap[m.job_details.plan_ref] = m.job_details.status;
//           }
//         });

//         const lastBotMessageWithBlueprint = [...data.messages]
//           .reverse()
//           .find((m) => m.sender.toUpperCase() === "BOT" && m.job_details?.blueprint);

//         if (lastBotMessageWithBlueprint) {
//           sessionAttributesRef.current.infra_blueprint = JSON.stringify(
//             lastBotMessageWithBlueprint.job_details.blueprint
//           );
//         }

//         const historyMsgs = [];

//         sortedMessages.forEach((m) => {
//           const baseMsg = {
//             role: m.sender.toUpperCase() === "USER" ? "user" : "bot",
//             text: m.message_text,
//           };

//           if (m.job_details) {
//             const job = m.job_details;

//             if (
//               job.job_type === "PLAN" &&
//               (job.status === "COMPLETED" || job.status === "DISCARDED")
//             ) {
//               if (baseMsg.text) {
//                 historyMsgs.push({ role: "bot", text: baseMsg.text });
//               }

//               const planMsg = {
//                 role: "bot",
//                 text: "Terraform plan complete. Review the resources below.",
//                 type: "PLAN_DISPLAY",
//                 structured_plan: job.result || { resource_changes: [] },
//                 planJobId: job.job_id,
//               };

//               if (job.status === "DISCARDED") {
//                 planMsg.planStatus = "DISCARDED";
//               } else if (applyStatusMap[job.job_id] === "COMPLETED") {
//                 planMsg.planStatus = "DEPLOYED";
//               } else if (applyStatusMap[job.job_id] === "FAILED") {
//                 planMsg.planStatus = "DEPLOYMENT_FAILED";
//               } else {
//                 planMsg.planStatus = "NOT_DEPLOYED";
//               }

//               if (job.cost_summary) {
//                 planMsg.costData = job.cost_summary;
//               }

//               historyMsgs.push(planMsg);
//               return;
//             } else if (job.job_type === "APPLY" && job.status === "COMPLETED") {
//               baseMsg.type = "DEPLOYMENT_SUCCESS";
//               baseMsg.outputs = job.result?.outputs || {};
//               baseMsg.access = job.result?.access || [];
//             } else if (job.job_type === "DESTROY" && job.status === "COMPLETED") {
//               historyMsgs.push({ role: "bot", text: baseMsg.text });
//               historyMsgs.push({
//                 role: "bot",
//                 text: "Destruction complete. All resources have been removed.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYED",
//                 structured_plan: { resource_changes: [] },
//               });
//               return;
//             } else if (job.job_type === "DESTROY" && job.status === "FAILED") {
//               historyMsgs.push({ role: "bot", text: baseMsg.text });
//               historyMsgs.push({
//                 role: "bot",
//                 text: "Destruction failed. Some resources may still exist.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYMENT_FAILED",
//                 structured_plan: { resource_changes: [] },
//               });
//               historyMsgs.push({
//                 role: "bot",
//                 type: "DEPLOYMENT_FAILED",
//                 text: "Destruction failed.",
//                 errorData: job.error_message || "Manual intervention may be required in the AWS Console.",
//               });
//               return;
//             } else if (job.status === "FAILED") {
//               baseMsg.type = "DEPLOYMENT_FAILED";
//               baseMsg.errorData =
//                 job.error_message || job.error || "An unknown error occurred.";
//             }
//           }

//           historyMsgs.push(baseMsg);
//         });

//         const lastCostMsg = historyMsgs.slice().reverse().find((m) => m.costData);
//         if (lastCostMsg) {
//           setCostData(lastCostMsg.costData);
//         } else {
//           setCostData(null);
//         }

//         chatCache.current[projId] = historyMsgs;
//         setMessages(historyMsgs);
//         setChatStarted(historyMsgs.length > 0);
//       }
//     } catch (e) {
//       console.error("Failed to load history:", e);
//     }
//   };

//   const handleProjectSelect = (projId, projName, silentSync = false) => {
//     setActiveProjectId(projId);
//     activeProjectIdRef.current = projId;
//     setConversationName(projName || "New Conversation");

//     if (!projId) {
//       setSessionId(null);
//       setMessages([]);
//       setChatStarted(false);
//       sessionAttributesRef.current = {};
//     } else {
//       setSessionId(projId);
//     }

//     // Restore this project's last log job (or clear if none)
//     restoreProjectLogs(projId);

//     if (!silentSync) {
//       setSidebarOpen(false);
//     }
//   };

//   const stopPolling = useCallback(() => {
//     if (planTimeoutRef.current) clearTimeout(planTimeoutRef.current);
//     if (applyIntervalRef.current) clearInterval(applyIntervalRef.current);
//     planTimeoutRef.current = null;
//     applyIntervalRef.current = null;
//   }, []);

//   /* ========================================================= */
//   /* UNIVERSAL POLLER                                           */
//   /* ========================================================= */

//   const pollStatus = (jobId, mode, relatedPlanJobId = null) => {
//     if (!jobId) return;
//     stopPolling();

//     setBotStatus(
//       mode === "plan"
//         ? "Terraform is planning..."
//         : mode === "destroy"
//         ? "Destroying infrastructure..."
//         : "Provisioning AWS Resources..."
//     );

//     const checkStatus = async () => {
//       try {
//         const data = await apiFetch(`/status/${jobId}`, { method: "GET" });

//         if (data.status === "COMPLETED") {
//           setBotStatus("");
//           stopPolling();
//           setActiveLogStatus("COMPLETED");
//           // Update persisted status so it survives project switches
//           const _pid = activeProjectIdRef.current;
//           if (_pid && projectLogsRef.current[_pid]) {
//             projectLogsRef.current[_pid].status = "COMPLETED";
//           }

//           if (mode === "plan") {
//             updateMessages((prev) => [
//               ...prev,
//               {
//                 role: "bot",
//                 text: "Terraform plan complete. Review the resources below.",
//                 type: "PLAN_DISPLAY",
//                 structured_plan: data.structured_plan,
//                 planJobId: jobId,
//                 onCalculateCost: () => triggerCost(jobId),
//                 onApprove: () => triggerApply(jobId),
//                 onDiscard: () => discardPlan(jobId),
//               },
//             ]);
//           }

//           if (mode === "cost") {
//             const costSummary = data.cost_summary;
//             updateMessages((prev) =>
//               prev.map((msg) =>
//                 msg.planJobId === relatedPlanJobId
//                   ? { ...msg, costData: costSummary }
//                   : msg
//               )
//             );
//             setCostData(costSummary);
//           }

//           if (mode === "destroy") {
//             setCostData(null);

//             const blueprint = sessionAttributesRef.current.infra_blueprint
//               ? (() => {
//                   try { return JSON.parse(sessionAttributesRef.current.infra_blueprint); }
//                   catch { return null; }
//                 })()
//               : null;

//             const destroyChanges =
//               blueprint?.components?.map((c) => ({
//                 address: `module.${c.service}[0].aws_${c.service}_resource.this`,
//                 change: { actions: ["delete"] },
//               })) || [];

//             updateMessages((prev) => [
//               ...prev,
//               {
//                 role: "bot",
//                 text: "Destruction complete. All resources have been removed.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYED",
//                 structured_plan: { resource_changes: destroyChanges },
//               },
//             ]);

//             sessionAttributesRef.current.infra_blueprint = null;

//             apiFetch("/chats", {
//               method: "POST",
//               body: JSON.stringify({
//                 project_id: activeProjectIdRef.current,
//                 sender: "BOT",
//                 message_text: "Destruction complete. All resources have been removed.",
//                 job_id: jobId,
//               }),
//             }).catch(() => {});
//           }

//           if (mode === "apply") {
//             updateMessages((prev) => {
//               const updatedPrev = prev.map((msg) =>
//                 msg.planJobId === relatedPlanJobId
//                   ? {
//                       ...msg,
//                       planStatus: "DEPLOYED",
//                       onApprove: undefined,
//                       onCalculateCost: undefined,
//                       onDiscard: undefined,
//                     }
//                   : msg
//               );
//               return [
//                 ...updatedPrev,
//                 {
//                   role: "bot",
//                   type: "DEPLOYMENT_SUCCESS",
//                   text: "Deployment completed successfully.",
//                   outputs: data.outputs || {},
//                   access: data.access || [],
//                 },
//               ];
//             });

//             apiFetch("/chats", {
//               method: "POST",
//               body: JSON.stringify({
//                 project_id: activeProjectIdRef.current,
//                 sender: "BOT",
//                 message_text: "Deployment completed successfully.",
//                 job_id: jobId,
//               }),
//             }).catch(() => {});
//           }

//         } else if (data.status === "FAILED") {
//           setBotStatus("");
//           stopPolling();
//           setActiveLogStatus("FAILED");
//           // Update persisted status so it survives project switches
//           const _pid2 = activeProjectIdRef.current;
//           if (_pid2 && projectLogsRef.current[_pid2]) {
//             projectLogsRef.current[_pid2].status = "FAILED";
//           }

//           if (mode === "destroy") {
//             const blueprint = sessionAttributesRef.current.infra_blueprint
//               ? (() => {
//                   try { return JSON.parse(sessionAttributesRef.current.infra_blueprint); }
//                   catch { return null; }
//                 })()
//               : null;

//             const destroyChanges =
//               blueprint?.components?.map((c) => ({
//                 address: `module.${c.service}[0].aws_${c.service}_resource.this`,
//                 change: { actions: ["delete"] },
//               })) || [];

//             updateMessages((prev) => [
//               ...prev,
//               {
//                 role: "bot",
//                 text: "Destruction failed. Some resources may still exist.",
//                 type: "PLAN_DISPLAY",
//                 destroyMode: true,
//                 planStatus: "DEPLOYMENT_FAILED",
//                 structured_plan: { resource_changes: destroyChanges },
//               },
//               {
//                 role: "bot",
//                 type: "DEPLOYMENT_FAILED",
//                 text: "Destruction failed.",
//                 errorData: data.error || "Manual intervention may be required in the AWS Console.",
//               },
//             ]);

//             apiFetch("/chats", {
//               method: "POST",
//               body: JSON.stringify({
//                 project_id: activeProjectIdRef.current,
//                 sender: "BOT",
//                 message_text: "Destruction failed. Manual intervention may be required.",
//                 job_id: jobId,
//               }),
//             }).catch(() => {});
//             return;
//           }

//           updateMessages((prev) => {
//             const updatedPrev =
//               mode === "apply"
//                 ? prev.map((msg) =>
//                     msg.planJobId === relatedPlanJobId
//                       ? {
//                           ...msg,
//                           planStatus: "DEPLOYMENT_FAILED",
//                           onApprove: undefined,
//                           onCalculateCost: undefined,
//                           onDiscard: undefined,
//                         }
//                       : msg
//                   )
//                 : prev;

//             return [
//               ...updatedPrev,
//               {
//                 role: "bot",
//                 type: "DEPLOYMENT_FAILED",
//                 text: "Process failed.",
//                 errorData:
//                   data.error ||
//                   data.error_message ||
//                   "An unknown deployment error occurred.",
//               },
//             ];
//           });
//         } else {
//           const delay = mode === "apply" || mode === "destroy" ? 4000 : 3000;
//           planTimeoutRef.current = setTimeout(checkStatus, delay);
//         }
//       } catch {
//         setBotStatus("Reconnecting...");
//         planTimeoutRef.current = setTimeout(checkStatus, 5000);
//       }
//     };

//     checkStatus();
//   };

//   /* ========================================================= */
//   /* ACTION TRIGGERS                                            */
//   /* ========================================================= */

//   const discardPlan = async (planJobId) => {
//     setCostData(null);
//     updateMessages((prev) =>
//       prev.map((msg) =>
//         msg.planJobId === planJobId
//           ? {
//               ...msg,
//               planStatus: "DISCARDED",
//               onApprove: undefined,
//               onCalculateCost: undefined,
//               onDiscard: undefined,
//             }
//           : msg
//       )
//     );
//     try {
//       await apiFetch(`/jobs/${planJobId}/discard`, { method: "POST" });
//     } catch (e) {
//       console.error("Failed to discard job in DB", e);
//     }
//   };

//   const triggerCost = async (planJobId) => {
//     try {
//       setBotStatus("Calculating infrastructure cost...");
//       const data = await apiFetch(`/cost`, {
//         method: "POST",
//         body: JSON.stringify({
//           run_id: planJobId,
//           project_id: activeProjectIdRef.current,
//         }),
//       });
//       pollStatus(data.job_id, "cost", planJobId);
//     } catch {
//       setBotStatus("");
//     }
//   };

//   const triggerApply = async (planJobId) => {
//     const blueprint = sessionAttributesRef.current.infra_blueprint
//       ? (() => {
//           try { return JSON.parse(sessionAttributesRef.current.infra_blueprint); }
//           catch { return null; }
//         })()
//       : null;

//     const payloadBody = {
//       project_id: activeProjectIdRef.current,
//       job_id: planJobId,
//     };
//     if (blueprint) payloadBody.infra_blueprint = blueprint;

//     try {
//       setBotStatus("Starting deployment...");
//       const data = await apiFetch(`/apply`, {
//         method: "POST",
//         body: JSON.stringify(payloadBody),
//       });

//       apiFetch("/chats", {
//         method: "POST",
//         body: JSON.stringify({
//           project_id: activeProjectIdRef.current,
//           sender: "BOT",
//           message_text: "Initiating deployment...",
//           job_id: data.apply_job_id,
//         }),
//       }).catch(() => console.error("Failed to save apply message"));

//       openLogs(data.apply_job_id, "apply", "RUNNING");
//       pollStatus(data.apply_job_id, "apply", planJobId);
//     } catch {
//       setBotStatus("");
//     }
//   };

//   /* ========================================================= */
//   /* CORE LEX HANDLER                                           */
//   /* ========================================================= */

//   const talkToLex = async (text, isSystemEvent = false) => {
//     let currentProjId = activeProjectIdRef.current;

//     if (!isSystemEvent) {
//       if (!currentProjId) {
//         try {
//           const newProjTitle =
//             text.length > 30 ? text.substring(0, 30) + "..." : text;
//           const projRes = await apiFetch("/projects", {
//             method: "POST",
//             body: JSON.stringify({
//               project_name: newProjTitle,
//               environment: "development",
//             }),
//           });
//           currentProjId = projRes.project_id;
//           handleProjectSelect(currentProjId, projRes.project_name, true);
//         } catch (e) {
//           console.error("Auto-create failed:", e);
//         }
//       }

//       updateMessages((prev) => [...prev, { role: "user", text }]);

//       if (currentProjId) {
//         apiFetch("/chats", {
//           method: "POST",
//           body: JSON.stringify({
//             project_id: currentProjId,
//             sender: "USER",
//             message_text: text,
//           }),
//         }).catch(() => {});
//       }

//       setIsTyping(true);
//       setBotStatus("CloudCrafter is thinking...");
//       setChatStarted(true);
//     }

//     try {
//       const command = new RecognizeTextCommand({
//         botId: BOT_ID,
//         botAliasId: ALIAS_ID,
//         localeId: "en_US",
//         sessionId: currentProjId || userId || "local-session",
//         text: text,
//         sessionState: {
//           sessionAttributes: {
//             ...sessionAttributesRef.current,
//             project_id: String(currentProjId),
//           },
//         },
//       });

//       const response = await lexClient.send(command);
//       const updatedAttrs = response.sessionState?.sessionAttributes || {};
//       sessionAttributesRef.current = updatedAttrs;

//       let payload = {};
//       try {
//         payload = JSON.parse(updatedAttrs.ui_payload || "{}");
//       } catch {}

//       if (payload.cost) {
//         setCostData(payload.cost);
//       }

//       const botMessage =
//         payload.message || response.messages?.[0]?.content || "";
//       const currentJobId =
//         payload.job_id || payload.plan_job_id || payload.apply_job_id;

//       const isDestroyFlow = payload.type === "DESTROY_STARTED";

//       const shouldPushLexMessage =
//         botMessage &&
//         payload.type !== "PLAN_STARTED" &&
//         payload.type !== "DESTROY_STARTED";

//       if (shouldPushLexMessage) {
//         updateMessages((prev) => [
//           ...prev,
//           {
//             role: "bot",
//             text: botMessage,
//             type: payload.type || undefined,
//           },
//         ]);
//       }

//       if (payload.type === "PLAN_STARTED") {
//         updateMessages((prev) => [
//           ...prev,
//           { role: "bot", text: botMessage, type: "PLAN_STARTED" },
//         ]);
//         openLogs(currentJobId, "plan", "RUNNING");
//         pollStatus(currentJobId, "plan");
//       } else if (payload.type === "APPLY_STARTED") {
//         pollStatus(currentJobId, "apply", payload.plan_job_id);
//       } else if (isDestroyFlow) {
//         updateMessages((prev) => [
//           ...prev,
//           { role: "bot", text: botMessage, type: "DESTROY_STARTED" },
//         ]);
//         openLogs(currentJobId, "destroy", "RUNNING");
//         pollStatus(currentJobId, "destroy");
//       }

//       if (botMessage && currentProjId) {
//         apiFetch("/chats", {
//           method: "POST",
//           body: JSON.stringify({
//             project_id: currentProjId,
//             sender: "BOT",
//             message_text: botMessage,
//             job_id: currentJobId || null,
//           }),
//         }).catch(() => {});
//       }
//     } catch {
//       updateMessages((prev) => [
//         ...prev,
//         { role: "bot", text: "⚠️ Connection lost." },
//       ]);
//     } finally {
//       if (!isSystemEvent) {
//         setIsTyping(false);
//         setBotStatus("");
//       }
//     }
//   };

//   const containerClass =
//     theme === "dark" ? "bg-[#050505] text-white" : "bg-zinc-50 text-zinc-900";

//   return (
//     <div className={`flex flex-col h-screen overflow-hidden ${containerClass}`}>
//       <header className="h-[60px] flex justify-between items-center px-6 border-b border-white/10 shrink-0">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="p-2 hover:bg-white/5 rounded-lg transition-colors"
//           >
//             ☰
//           </button>
//           <div className="flex flex-col">
//             <span className="font-bold text-sm tracking-tight uppercase opacity-50">
//               CloudCrafter v1.0
//             </span>
//             <span className="font-medium text-xs truncate max-w-[200px]">
//               {conversationName}
//             </span>
//           </div>
//         </div>

//         <div className="flex items-center gap-4">
//           {costData && (
//             <button className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-all hidden sm:block">
//               Est. ${costData.monthly_cost?.toFixed(2) || "0.00"}
//             </button>
//           )}

//           {/* Logs toggle button — always visible, styled by state */}
//           <button
//             onClick={() => setLogPanelOpen((p) => !p)}
//             className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all hidden sm:flex
//               ${logPanelOpen
//                 ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
//                 : activeLogJobId
//                   ? "bg-white/5 text-zinc-400 border-white/10 hover:text-zinc-200 hover:bg-white/10"
//                   : "bg-white/5 text-zinc-600 border-white/5 cursor-default opacity-50"}`}
//           >
//             <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
//               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <polyline points="4 17 10 11 4 5" />
//               <line x1="12" y1="19" x2="20" y2="19" />
//             </svg>
//             Logs
//             {activeLogStatus === "RUNNING" && (
//               <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
//             )}
//           </button>

//           <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-white/10">
//             <div className="hidden sm:flex flex-col text-right">
//               <span className="text-xs font-bold text-zinc-200">{displayName}</span>
//               <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
//                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
//                 Connected
//               </span>
//             </div>

//             <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30 uppercase shrink-0">
//               {displayName.charAt(0)}
//             </div>

//             <button
//               onClick={() => navigate("/logout")}
//               className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all ml-1"
//               title="Logout"
//             >
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
//                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
//                 <polyline points="16 17 21 12 16 7"></polyline>
//                 <line x1="21" y1="12" x2="9" y2="12"></line>
//               </svg>
//             </button>
//           </div>
//         </div>
//       </header>

//       <div className="flex flex-1 relative overflow-hidden">
//         {/* Single LogPanel instance */}
//         <LogPanel
//           isOpen={logPanelOpen}
//           onClose={() => setLogPanelOpen(false)}
//           jobId={activeLogJobId}
//           jobMode={activeLogMode}
//           jobStatus={activeLogStatus}
//           theme={theme}
//         />

//         <Sidebar
//           isOpen={sidebarOpen}
//           onClose={() => setSidebarOpen(false)}
//           onToggleTheme={() => setTheme((p) => (p === "dark" ? "light" : "dark"))}
//           currentTheme={theme}
//           activeProjectId={activeProjectId}
//           onSelectProject={handleProjectSelect}
//         />

//         <main className="flex-1 flex flex-col relative min-w-0">
//           <ChatFeed
//             messages={messages}
//             isTyping={isTyping}
//             botStatus={botStatus}
//             chatStarted={chatStarted}
//             onOptionClick={(val) => talkToLex(val)}
//             theme={theme}
//             onViewLogs={openLogs}
//           />

//           <CommandInput
//             onSend={(val) => talkToLex(val)}
//             isTyping={isTyping}
//             chatStarted={chatStarted}
//             disabled={
//               botStatus !== "" &&
//               botStatus !== "CloudCrafter is thinking..."
//             }
//             theme={theme}
//           />
//         </main>
//       </div>
//     </div>
//   );
// };

// export default ConsoleLayout;

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { apiFetch } from "../utils/api";
import LogPanel from "../pages/LogPanel";

/* ---------------- CONFIG & CLIENTS ---------------- */

const REGION = process.env.REACT_APP_AWS_REGION;
const BOT_ID = process.env.REACT_APP_LEX_BOT_ID;
const ALIAS_ID = process.env.REACT_APP_LEX_BOT_ALIAS_ID;
const POOL_ID = process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID;

const lexClient = new LexRuntimeV2Client({
  region: REGION,
  credentials: fromCognitoIdentityPool({
    identityPoolId: POOL_ID,
    clientConfig: { region: REGION },
  }),
});

const getSessionId = () => sessionStorage.getItem("cc_project_id");
const setSessionId = (id) =>
  id
    ? sessionStorage.setItem("cc_project_id", id)
    : sessionStorage.removeItem("cc_project_id");

const ConsoleLayout = () => {
  const navigate = useNavigate();

  const sessionAttributesRef = useRef({});
  const chatCache = useRef({});
  const activeProjectIdRef = useRef(getSessionId());

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [userId, setUserId] = useState(null);

  const [activeProjectId, setActiveProjectId] = useState(getSessionId());
  const [conversationName, setConversationName] = useState("New Conversation");

  const [messages, setMessages] = useState([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [botStatus, setBotStatus] = useState("");

  const [costData, setCostData] = useState(null);

  // ── Log panel state ────────────────────────────────────────────────────────
  // Per-project log tracking: each project remembers its last job independently.
  // Shape: { [projectId]: { jobId, mode, status } }
  const projectLogsRef = useRef({});

  const [logPanelOpen, setLogPanelOpen]       = useState(false);
  const [activeLogJobId, setActiveLogJobId]   = useState(null);
  const [activeLogMode, setActiveLogMode]     = useState(null);
  const [activeLogStatus, setActiveLogStatus] = useState(null);

  const openLogs = useCallback((jobId, mode, status) => {
    const projId = activeProjectIdRef.current;
    // Persist this job against the current project
    if (projId && jobId) {
      projectLogsRef.current[projId] = { jobId, mode, status: status || "RUNNING" };
    }
    setActiveLogJobId(jobId);
    setActiveLogMode(mode);
    setActiveLogStatus(status || "RUNNING");
    setLogPanelOpen(true);
  }, []);

  // Restore the correct log job when switching projects
  const restoreProjectLogs = useCallback((projId) => {
    // Always close the panel when switching context — avoids stale logs showing
    setLogPanelOpen(false);
    // Clear state unconditionally first, then re-populate if this project has a saved job
    setActiveLogJobId(null);
    setActiveLogMode(null);
    setActiveLogStatus(null);
    if (projId) {
      const saved = projectLogsRef.current[projId];
      if (saved) {
        setActiveLogJobId(saved.jobId);
        setActiveLogMode(saved.mode);
        setActiveLogStatus(saved.status);
      }
    }
  }, []);

  const planTimeoutRef = useRef(null);
  const applyIntervalRef = useRef(null);

  const session = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("cloudcrafter_session") || "null");
    } catch {
      return null;
    }
  }, []);

  const displayName = session?.full_name || session?.email || "User";

  useEffect(() => {
    activeProjectIdRef.current = activeProjectId;
  }, [activeProjectId]);

  const updateMessages = useCallback((updater) => {
    setMessages((prev) => {
      const newMsgs = typeof updater === "function" ? updater(prev) : updater;
      if (activeProjectIdRef.current) {
        chatCache.current[activeProjectIdRef.current] = newMsgs;
      }
      return newMsgs;
    });
  }, []);

  useEffect(() => {
    const identityClient = new CognitoIdentityClient({ region: REGION });
    const getId = async () => {
      try {
        const res = await identityClient.send(new GetIdCommand({ IdentityPoolId: POOL_ID }));
        setUserId(res.IdentityId);
      } catch {
        setUserId("anon-" + Math.random().toString(36).substring(7));
      }
    };
    getId();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  /* ---------------- HISTORY LOADING ---------------- */

  useEffect(() => {
    if (activeProjectId) {
      setSessionId(activeProjectId);
      loadChatHistory(activeProjectId);
      // restoreProjectLogs is called at the END of loadChatHistory
      // after projectLogsRef has been seeded from history.
    } else {
      setSessionId(null);
      setMessages([]);
      setChatStarted(false);
      setConversationName("New Conversation");
      sessionAttributesRef.current = {};
      // No history to load — clear log panel immediately
      restoreProjectLogs(null);
    }
  }, [activeProjectId]);

  const loadChatHistory = async (projId) => {
    if (chatCache.current[projId]) {
      setMessages(chatCache.current[projId]);
      setChatStarted(chatCache.current[projId].length > 0);
      // projectLogsRef already seeded from the first load — just restore
      restoreProjectLogs(projId);
      return;
    }

    try {
      const data = await apiFetch(`/chats/${projId}`);
      if (data.messages) {
        const sortedMessages = data.messages.sort(
          (a, b) =>
            new Date(a.created_at || a.timestamp) -
            new Date(b.created_at || b.timestamp)
        );

        const applyStatusMap = {};
        sortedMessages.forEach((m) => {
          if (
            m.job_details &&
            m.job_details.job_type === "APPLY" &&
            m.job_details.plan_ref
          ) {
            applyStatusMap[m.job_details.plan_ref] = m.job_details.status;
          }
        });

        const lastBotMessageWithBlueprint = [...data.messages]
          .reverse()
          .find((m) => m.sender.toUpperCase() === "BOT" && m.job_details?.blueprint);

        if (lastBotMessageWithBlueprint) {
          sessionAttributesRef.current.infra_blueprint = JSON.stringify(
            lastBotMessageWithBlueprint.job_details.blueprint
          );
        }

        const historyMsgs = [];

        sortedMessages.forEach((m) => {
          const baseMsg = {
            role: m.sender.toUpperCase() === "USER" ? "user" : "bot",
            text: m.message_text,
          };

          if (m.job_details) {
            const job = m.job_details;

            if (
              job.job_type === "PLAN" &&
              (job.status === "COMPLETED" || job.status === "DISCARDED")
            ) {
              if (baseMsg.text) {
                historyMsgs.push({ role: "bot", text: baseMsg.text });
              }

              const planMsg = {
                role: "bot",
                text: "Terraform plan complete. Review the resources below.",
                type: "PLAN_DISPLAY",
                structured_plan: job.result || { resource_changes: [] },
                planJobId: job.job_id,
              };

              if (job.status === "DISCARDED") {
                planMsg.planStatus = "DISCARDED";
              } else if (applyStatusMap[job.job_id] === "COMPLETED") {
                planMsg.planStatus = "DEPLOYED";
              } else if (applyStatusMap[job.job_id] === "FAILED") {
                planMsg.planStatus = "DEPLOYMENT_FAILED";
              } else {
                planMsg.planStatus = "NOT_DEPLOYED";
              }

              if (job.cost_summary) {
                planMsg.costData = job.cost_summary;
              }

              historyMsgs.push(planMsg);
              return;
            } else if (job.job_type === "APPLY" && job.status === "COMPLETED") {
              baseMsg.type = "DEPLOYMENT_SUCCESS";
              baseMsg.outputs = job.result?.outputs || {};
              baseMsg.access = job.result?.access || [];
            } else if (job.job_type === "DESTROY" && job.status === "COMPLETED") {
              historyMsgs.push({ role: "bot", text: baseMsg.text });
              historyMsgs.push({
                role: "bot",
                text: "Destruction complete. All resources have been removed.",
                type: "PLAN_DISPLAY",
                destroyMode: true,
                planStatus: "DEPLOYED",
                structured_plan: { resource_changes: [] },
              });
              return;
            } else if (job.job_type === "DESTROY" && job.status === "FAILED") {
              historyMsgs.push({ role: "bot", text: baseMsg.text });
              historyMsgs.push({
                role: "bot",
                text: "Destruction failed. Some resources may still exist.",
                type: "PLAN_DISPLAY",
                destroyMode: true,
                planStatus: "DEPLOYMENT_FAILED",
                structured_plan: { resource_changes: [] },
              });
              historyMsgs.push({
                role: "bot",
                type: "DEPLOYMENT_FAILED",
                text: "Destruction failed.",
                errorData: job.error_message || "Manual intervention may be required in the AWS Console.",
              });
              return;
            } else if (job.status === "FAILED") {
              baseMsg.type = "DEPLOYMENT_FAILED";
              baseMsg.errorData =
                job.error_message || job.error || "An unknown error occurred.";
            }
          }

          historyMsgs.push(baseMsg);
        });

        const lastCostMsg = historyMsgs.slice().reverse().find((m) => m.costData);
        if (lastCostMsg) {
          setCostData(lastCostMsg.costData);
        } else {
          setCostData(null);
        }

        chatCache.current[projId] = historyMsgs;
        setMessages(historyMsgs);
        setChatStarted(historyMsgs.length > 0);

        // Seed projectLogsRef with the most recent job from history so the
        // top Logs button works correctly for projects loaded from the sidebar
        // without requiring the user to click "View logs" first.
        const lastJobMsg = [...historyMsgs].reverse().find(
          (m) => m.planJobId && m.type === "PLAN_DISPLAY"
        );
        if (lastJobMsg && projId) {
          const inferredMode = lastJobMsg.destroyMode ? "destroy" : "plan";
          const inferredStatus =
            lastJobMsg.planStatus === "DEPLOYED" ||
            lastJobMsg.planStatus === "DISCARDED" ||
            lastJobMsg.planStatus === "DEPLOYMENT_FAILED"
              ? "COMPLETED"
              : "RUNNING";
          // Only seed if this project doesn't already have a live entry
          // (live entry = set by openLogs during current session, takes priority)
          if (!projectLogsRef.current[projId]) {
            projectLogsRef.current[projId] = {
              jobId: lastJobMsg.planJobId,
              mode: inferredMode,
              status: inferredStatus,
            };
          }
        }

        // Now that projectLogsRef is seeded, restore log panel state
        // for this project. Called here (not in useEffect) so the seed
        // is guaranteed to exist before we read it.
        restoreProjectLogs(projId);
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  };

  const handleProjectSelect = (projId, projName, silentSync = false) => {
    setActiveProjectId(projId);
    activeProjectIdRef.current = projId;
    setConversationName(projName || "New Conversation");

    if (!projId) {
      setSessionId(null);
      setMessages([]);
      setChatStarted(false);
      sessionAttributesRef.current = {};
    } else {
      setSessionId(projId);
    }

    // Restore this project's last log job (or clear if none)
    restoreProjectLogs(projId);

    if (!silentSync) {
      setSidebarOpen(false);
    }
  };

  const stopPolling = useCallback(() => {
    if (planTimeoutRef.current) clearTimeout(planTimeoutRef.current);
    if (applyIntervalRef.current) clearInterval(applyIntervalRef.current);
    planTimeoutRef.current = null;
    applyIntervalRef.current = null;
  }, []);

  /* ========================================================= */
  /* UNIVERSAL POLLER                                           */
  /* ========================================================= */

  const pollStatus = (jobId, mode, relatedPlanJobId = null) => {
    if (!jobId) return;
    stopPolling();

    setBotStatus(
      mode === "plan"
        ? "Terraform is planning..."
        : mode === "destroy"
        ? "Destroying infrastructure..."
        : "Provisioning AWS Resources..."
    );

    const checkStatus = async () => {
      try {
        const data = await apiFetch(`/status/${jobId}`, { method: "GET" });

        if (data.status === "COMPLETED") {
          setBotStatus("");
          stopPolling();
          setActiveLogStatus("COMPLETED");
          // Update persisted status so it survives project switches
          const _pid = activeProjectIdRef.current;
          if (_pid && projectLogsRef.current[_pid]) {
            projectLogsRef.current[_pid].status = "COMPLETED";
          }

          if (mode === "plan") {
            updateMessages((prev) => [
              ...prev,
              {
                role: "bot",
                text: "Terraform plan complete. Review the resources below.",
                type: "PLAN_DISPLAY",
                structured_plan: data.structured_plan,
                planJobId: jobId,
                onCalculateCost: () => triggerCost(jobId),
                onApprove: () => triggerApply(jobId),
                onDiscard: () => discardPlan(jobId),
              },
            ]);
          }

          if (mode === "cost") {
            const costSummary = data.cost_summary;
            updateMessages((prev) =>
              prev.map((msg) =>
                msg.planJobId === relatedPlanJobId
                  ? { ...msg, costData: costSummary }
                  : msg
              )
            );
            setCostData(costSummary);
          }

          if (mode === "destroy") {
            setCostData(null);

            const blueprint = sessionAttributesRef.current.infra_blueprint
              ? (() => {
                  try { return JSON.parse(sessionAttributesRef.current.infra_blueprint); }
                  catch { return null; }
                })()
              : null;

            const destroyChanges =
              blueprint?.components?.map((c) => ({
                address: `module.${c.service}[0].aws_${c.service}_resource.this`,
                change: { actions: ["delete"] },
              })) || [];

            updateMessages((prev) => [
              ...prev,
              {
                role: "bot",
                text: "Destruction complete. All resources have been removed.",
                type: "PLAN_DISPLAY",
                destroyMode: true,
                planStatus: "DEPLOYED",
                structured_plan: { resource_changes: destroyChanges },
              },
            ]);

            sessionAttributesRef.current.infra_blueprint = null;

            apiFetch("/chats", {
              method: "POST",
              body: JSON.stringify({
                project_id: activeProjectIdRef.current,
                sender: "BOT",
                message_text: "Destruction complete. All resources have been removed.",
                job_id: jobId,
              }),
            }).catch(() => {});
          }

          if (mode === "apply") {
            updateMessages((prev) => {
              const updatedPrev = prev.map((msg) =>
                msg.planJobId === relatedPlanJobId
                  ? {
                      ...msg,
                      planStatus: "DEPLOYED",
                      onApprove: undefined,
                      onCalculateCost: undefined,
                      onDiscard: undefined,
                    }
                  : msg
              );
              return [
                ...updatedPrev,
                {
                  role: "bot",
                  type: "DEPLOYMENT_SUCCESS",
                  text: "Deployment completed successfully.",
                  outputs: data.outputs || {},
                  access: data.access || [],
                },
              ];
            });

            apiFetch("/chats", {
              method: "POST",
              body: JSON.stringify({
                project_id: activeProjectIdRef.current,
                sender: "BOT",
                message_text: "Deployment completed successfully.",
                job_id: jobId,
              }),
            }).catch(() => {});
          }

        } else if (data.status === "FAILED") {
          setBotStatus("");
          stopPolling();
          setActiveLogStatus("FAILED");
          // Update persisted status so it survives project switches
          const _pid2 = activeProjectIdRef.current;
          if (_pid2 && projectLogsRef.current[_pid2]) {
            projectLogsRef.current[_pid2].status = "FAILED";
          }

          if (mode === "destroy") {
            const blueprint = sessionAttributesRef.current.infra_blueprint
              ? (() => {
                  try { return JSON.parse(sessionAttributesRef.current.infra_blueprint); }
                  catch { return null; }
                })()
              : null;

            const destroyChanges =
              blueprint?.components?.map((c) => ({
                address: `module.${c.service}[0].aws_${c.service}_resource.this`,
                change: { actions: ["delete"] },
              })) || [];

            updateMessages((prev) => [
              ...prev,
              {
                role: "bot",
                text: "Destruction failed. Some resources may still exist.",
                type: "PLAN_DISPLAY",
                destroyMode: true,
                planStatus: "DEPLOYMENT_FAILED",
                structured_plan: { resource_changes: destroyChanges },
              },
              {
                role: "bot",
                type: "DEPLOYMENT_FAILED",
                text: "Destruction failed.",
                errorData: data.error || "Manual intervention may be required in the AWS Console.",
              },
            ]);

            apiFetch("/chats", {
              method: "POST",
              body: JSON.stringify({
                project_id: activeProjectIdRef.current,
                sender: "BOT",
                message_text: "Destruction failed. Manual intervention may be required.",
                job_id: jobId,
              }),
            }).catch(() => {});
            return;
          }

          updateMessages((prev) => {
            const updatedPrev =
              mode === "apply"
                ? prev.map((msg) =>
                    msg.planJobId === relatedPlanJobId
                      ? {
                          ...msg,
                          planStatus: "DEPLOYMENT_FAILED",
                          onApprove: undefined,
                          onCalculateCost: undefined,
                          onDiscard: undefined,
                        }
                      : msg
                  )
                : prev;

            return [
              ...updatedPrev,
              {
                role: "bot",
                type: "DEPLOYMENT_FAILED",
                text: "Process failed.",
                errorData:
                  data.error ||
                  data.error_message ||
                  "An unknown deployment error occurred.",
              },
            ];
          });
        } else {
          const delay = mode === "apply" || mode === "destroy" ? 4000 : 3000;
          planTimeoutRef.current = setTimeout(checkStatus, delay);
        }
      } catch {
        setBotStatus("Reconnecting...");
        planTimeoutRef.current = setTimeout(checkStatus, 5000);
      }
    };

    checkStatus();
  };

  /* ========================================================= */
  /* ACTION TRIGGERS                                            */
  /* ========================================================= */

  const discardPlan = async (planJobId) => {
    setCostData(null);
    updateMessages((prev) =>
      prev.map((msg) =>
        msg.planJobId === planJobId
          ? {
              ...msg,
              planStatus: "DISCARDED",
              onApprove: undefined,
              onCalculateCost: undefined,
              onDiscard: undefined,
            }
          : msg
      )
    );
    try {
      await apiFetch(`/jobs/${planJobId}/discard`, { method: "POST" });
    } catch (e) {
      console.error("Failed to discard job in DB", e);
    }
  };

  const triggerCost = async (planJobId) => {
    try {
      setBotStatus("Calculating infrastructure cost...");
      const data = await apiFetch(`/cost`, {
        method: "POST",
        body: JSON.stringify({
          run_id: planJobId,
          project_id: activeProjectIdRef.current,
        }),
      });
      pollStatus(data.job_id, "cost", planJobId);
    } catch {
      setBotStatus("");
    }
  };

  const triggerApply = async (planJobId) => {
    const blueprint = sessionAttributesRef.current.infra_blueprint
      ? (() => {
          try { return JSON.parse(sessionAttributesRef.current.infra_blueprint); }
          catch { return null; }
        })()
      : null;

    const payloadBody = {
      project_id: activeProjectIdRef.current,
      job_id: planJobId,
    };
    if (blueprint) payloadBody.infra_blueprint = blueprint;

    try {
      setBotStatus("Starting deployment...");
      const data = await apiFetch(`/apply`, {
        method: "POST",
        body: JSON.stringify(payloadBody),
      });

      apiFetch("/chats", {
        method: "POST",
        body: JSON.stringify({
          project_id: activeProjectIdRef.current,
          sender: "BOT",
          message_text: "Initiating deployment...",
          job_id: data.apply_job_id,
        }),
      }).catch(() => console.error("Failed to save apply message"));

      openLogs(data.apply_job_id, "apply", "RUNNING");
      pollStatus(data.apply_job_id, "apply", planJobId);
    } catch {
      setBotStatus("");
    }
  };

  /* ========================================================= */
  /* CORE LEX HANDLER                                           */
  /* ========================================================= */

  const talkToLex = async (text, isSystemEvent = false) => {
    let currentProjId = activeProjectIdRef.current;

    if (!isSystemEvent) {
      if (!currentProjId) {
        try {
          const newProjTitle =
            text.length > 30 ? text.substring(0, 30) + "..." : text;
          const projRes = await apiFetch("/projects", {
            method: "POST",
            body: JSON.stringify({
              project_name: newProjTitle,
              environment: "development",
            }),
          });
          currentProjId = projRes.project_id;
          handleProjectSelect(currentProjId, projRes.project_name, true);
        } catch (e) {
          console.error("Auto-create failed:", e);
        }
      }

      updateMessages((prev) => [...prev, { role: "user", text }]);

      if (currentProjId) {
        apiFetch("/chats", {
          method: "POST",
          body: JSON.stringify({
            project_id: currentProjId,
            sender: "USER",
            message_text: text,
          }),
        }).catch(() => {});
      }

      setIsTyping(true);
      setBotStatus("CloudCrafter is thinking...");
      setChatStarted(true);
    }

    try {
      const command = new RecognizeTextCommand({
        botId: BOT_ID,
        botAliasId: ALIAS_ID,
        localeId: "en_US",
        sessionId: currentProjId || userId || "local-session",
        text: text,
        sessionState: {
          sessionAttributes: {
            ...sessionAttributesRef.current,
            project_id: String(currentProjId),
          },
        },
      });

      const response = await lexClient.send(command);
      const updatedAttrs = response.sessionState?.sessionAttributes || {};
      sessionAttributesRef.current = updatedAttrs;

      let payload = {};
      try {
        payload = JSON.parse(updatedAttrs.ui_payload || "{}");
      } catch {}

      if (payload.cost) {
        setCostData(payload.cost);
      }

      const botMessage =
        payload.message || response.messages?.[0]?.content || "";
      const currentJobId =
        payload.job_id || payload.plan_job_id || payload.apply_job_id;

      const isDestroyFlow = payload.type === "DESTROY_STARTED";

      const shouldPushLexMessage =
        botMessage &&
        payload.type !== "PLAN_STARTED" &&
        payload.type !== "DESTROY_STARTED";

      if (shouldPushLexMessage) {
        updateMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: botMessage,
            type: payload.type || undefined,
          },
        ]);
      }

      if (payload.type === "PLAN_STARTED") {
        updateMessages((prev) => [
          ...prev,
          { role: "bot", text: botMessage, type: "PLAN_STARTED" },
        ]);
        openLogs(currentJobId, "plan", "RUNNING");
        pollStatus(currentJobId, "plan");
      } else if (payload.type === "APPLY_STARTED") {
        pollStatus(currentJobId, "apply", payload.plan_job_id);
      } else if (isDestroyFlow) {
        updateMessages((prev) => [
          ...prev,
          { role: "bot", text: botMessage, type: "DESTROY_STARTED" },
        ]);
        openLogs(currentJobId, "destroy", "RUNNING");
        pollStatus(currentJobId, "destroy");
      }

      if (botMessage && currentProjId) {
        apiFetch("/chats", {
          method: "POST",
          body: JSON.stringify({
            project_id: currentProjId,
            sender: "BOT",
            message_text: botMessage,
            job_id: currentJobId || null,
          }),
        }).catch(() => {});
      }
    } catch {
      updateMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Connection lost." },
      ]);
    } finally {
      if (!isSystemEvent) {
        setIsTyping(false);
        setBotStatus("");
      }
    }
  };

  const containerClass =
    theme === "dark" ? "bg-[#050505] text-white" : "bg-zinc-50 text-zinc-900";

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${containerClass}`}>
      <header className="h-[60px] flex justify-between items-center px-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            ☰
          </button>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight uppercase opacity-50">
              CloudCrafter v1.0
            </span>
            <span className="font-medium text-xs truncate max-w-[200px]">
              {conversationName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {costData && (
            <button className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-all hidden sm:block">
              Est. ${costData.monthly_cost?.toFixed(2) || "0.00"}
            </button>
          )}

          {/* Logs toggle button — always visible, styled by state */}
          <button
            onClick={() => {
              if (logPanelOpen) {
                // Closing — just close
                setLogPanelOpen(false);
              } else {
                // Opening — restore this project's logs before showing the panel
                // so the top button always shows the current project's job, not a stale one
                const projId = activeProjectIdRef.current;
                const saved = projId ? projectLogsRef.current[projId] : null;
                if (saved) {
                  setActiveLogJobId(saved.jobId);
                  setActiveLogMode(saved.mode);
                  setActiveLogStatus(saved.status);
                }
                setLogPanelOpen(true);
              }
            }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all hidden sm:flex
              ${logPanelOpen
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                : activeLogJobId
                  ? "bg-white/5 text-zinc-400 border-white/10 hover:text-zinc-200 hover:bg-white/10"
                  : "bg-white/5 text-zinc-600 border-white/5 cursor-default opacity-50"}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            Logs
            {activeLogStatus === "RUNNING" && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-white/10">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-zinc-200">{displayName}</span>
              <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                Connected
              </span>
            </div>

            <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30 uppercase shrink-0">
              {displayName.charAt(0)}
            </div>

            <button
              onClick={() => navigate("/logout")}
              className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all ml-1"
              title="Logout"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Single LogPanel instance */}
        <LogPanel
          isOpen={logPanelOpen}
          onClose={() => setLogPanelOpen(false)}
          jobId={activeLogJobId}
          jobMode={activeLogMode}
          jobStatus={activeLogStatus}
          theme={theme}
        />

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggleTheme={() => setTheme((p) => (p === "dark" ? "light" : "dark"))}
          currentTheme={theme}
          activeProjectId={activeProjectId}
          onSelectProject={handleProjectSelect}
        />

        <main className="flex-1 flex flex-col relative min-w-0">
          <ChatFeed
            messages={messages}
            isTyping={isTyping}
            botStatus={botStatus}
            chatStarted={chatStarted}
            onOptionClick={(val) => talkToLex(val)}
            theme={theme}
            onViewLogs={openLogs}
          />

          <CommandInput
            onSend={(val) => talkToLex(val)}
            isTyping={isTyping}
            chatStarted={chatStarted}
            disabled={
              botStatus !== "" &&
              botStatus !== "CloudCrafter is thinking..."
            }
            theme={theme}
          />
        </main>
      </div>
    </div>
  );
};

export default ConsoleLayout;