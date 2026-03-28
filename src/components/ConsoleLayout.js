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
// import NotificationBell from "./NotificationBell";

// // 🔥 NEW: Import our Dashboard components
// import ProjectDashboard from "../pages/ProjectDashboard";
// import CreateProjectModal from "../pages/CreateProjectModal";

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

//   const isSendingRef = useRef(false);
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

//   // Per-project log tracking
//   const projectLogsRef = useRef({});

//   const [logPanelOpen, setLogPanelOpen] = useState(false);
//   const [activeLogJobId, setActiveLogJobId] = useState(null);
//   const [activeLogMode, setActiveLogMode] = useState(null);
//   const [activeLogStatus, setActiveLogStatus] = useState(null);

//   // 🔥 NEW: Dashboard & Modal State
//   const [projects, setProjects] = useState([]);
//   const [isLoadingProjects, setIsLoadingProjects] = useState(true);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const openLogs = useCallback((jobId, mode, status) => {
//     const projId = activeProjectIdRef.current;
//     if (projId && jobId) {
//       projectLogsRef.current[projId] = {
//         jobId,
//         mode,
//         status: status || "RUNNING",
//       };
//     }
//     setActiveLogJobId(jobId);
//     setActiveLogMode(mode);
//     setActiveLogStatus(status || "RUNNING");
//     setLogPanelOpen(true);
//   }, []);

//   const restoreProjectLogs = useCallback((projId) => {
//     setLogPanelOpen(false);
//     setActiveLogJobId(null);
//     setActiveLogMode(null);
//     setActiveLogStatus(null);

//     if (projId) {
//       const saved = projectLogsRef.current[projId];
//       if (saved) {
//         setActiveLogJobId(saved.jobId);
//         setActiveLogMode(saved.mode);
//         setActiveLogStatus(saved.status);
//       }
//     }
//   }, []);

//   const planTimeoutRef = useRef(null);
//   const applyIntervalRef = useRef(null);

//   // 1. Get the session safely
//   const session = useMemo(() => {
//     try {
//       const data = localStorage.getItem("cloudcrafter_session");
//       // Prevent parsing the literal string "null"
//       return data && data !== "null" ? JSON.parse(data) : null; 
//     } catch {
//       return null;
//     }
//   }, []);

//   // 🔥 2. THE AUTH GUARD: Redirect them immediately if they aren't logged in
//   useEffect(() => {
//     if (!session) {
//       console.warn("No active session. Redirecting to login...");
//       navigate("/signin"); 
//     }
//   }, [session, navigate]);

//   const displayName = session?.full_name || session?.email || "User";
//   const userRole = session?.role; 

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
//         const res = await identityClient.send(
//           new GetIdCommand({ IdentityPoolId: POOL_ID })
//         );
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

// // 🔥 Fetch Projects on initial load for the Dashboard
//   useEffect(() => {
//     // STOP the API call if they are not logged in
//     if (!session) return; 

//     const loadProjects = async () => {
//       setIsLoadingProjects(true);
//       try {
//         const data = await apiFetch("/projects", { method: "GET" });
//         setProjects(data.projects || []);
//       } catch (error) {
//         console.error("Failed to fetch projects:", error);
//       } finally {
//         setIsLoadingProjects(false);
//       }
//     };
//     loadProjects();
//   }, [session]);

//   /* ---------------- HISTORY LOADING ---------------- */

//   const loadChatHistory = useCallback(
//     async (projId) => {
//       if (chatCache.current[projId]) {
//         setMessages(chatCache.current[projId]);
//         setChatStarted(chatCache.current[projId].length > 0);
//         restoreProjectLogs(projId);
//         return;
//       }

//       try {
//         const data = await apiFetch(`/chats/${projId}`);

//         if (data.messages) {
//           const sortedMessages = data.messages.sort(
//             (a, b) =>
//               new Date(a.created_at || a.timestamp) -
//               new Date(b.created_at || b.timestamp)
//           );

//           const applyStatusMap = {};
//           const applyJobIdMap = {};
//           sortedMessages.forEach((m) => {
//             if (
//               m.job_details &&
//               m.job_details.job_type === "APPLY" &&
//               m.job_details.plan_ref
//             ) {
//               applyStatusMap[m.job_details.plan_ref] = m.job_details.status;
//               applyJobIdMap[m.job_details.plan_ref] = m.job_details.job_id;
//             }
//           });

//           const lastBotMessageWithBlueprint = [...data.messages]
//             .reverse()
//             .find(
//               (m) =>
//                 m.sender?.toUpperCase() === "BOT" && m.job_details?.blueprint
//             );

//           if (lastBotMessageWithBlueprint) {
//             sessionAttributesRef.current.infra_blueprint = JSON.stringify(
//               lastBotMessageWithBlueprint.job_details.blueprint
//             );
//           }

//           const historyMsgs = [];

//           sortedMessages.forEach((m) => {
//             const baseMsg = {
//               role: m.sender?.toUpperCase() === "USER" ? "user" : "bot",
//               text: m.message_text,
//             };

//             if (m.job_details) {
//               const job = m.job_details;

//               if (
//                 job.job_type === "PLAN" &&
//                 (job.status === "COMPLETED" || job.status === "DISCARDED")
//               ) {
//                 if (baseMsg.text) {
//                   historyMsgs.push({ role: "bot", text: baseMsg.text });
//                 }

//                 const planMsg = {
//                   role: "bot",
//                   text: "Terraform plan complete. Review the resources below.",
//                   type: "PLAN_DISPLAY",
//                   structured_plan: job.result || { resource_changes: [] },
//                   planJobId: job.job_id,
//                 };

//                 if (job.status === "DISCARDED") {
//                   planMsg.planStatus = "DISCARDED";
//                 } else if (applyStatusMap[job.job_id] === "COMPLETED") {
//                   planMsg.planStatus = "DEPLOYED";
//                 } else if (applyStatusMap[job.job_id] === "FAILED") {
//                   planMsg.planStatus = "DEPLOYMENT_FAILED";
//                 } else {
//                   planMsg.planStatus = "NOT_DEPLOYED";
//                 }

//                 if (job.cost_summary) {
//                   planMsg.costData = job.cost_summary;
//                 }

//                 historyMsgs.push(planMsg);
//                 return;
//               } else if (
//                 job.job_type === "APPLY" &&
//                 job.status === "COMPLETED"
//               ) {
//                 baseMsg.type = "DEPLOYMENT_SUCCESS";
//                 baseMsg.outputs = job.result?.outputs || {};
//                 baseMsg.access = job.result?.access || [];
//               } else if (
//                 job.job_type === "DESTROY" &&
//                 job.status === "COMPLETED"
//               ) {
//                 historyMsgs.push({ role: "bot", text: baseMsg.text });
//                 historyMsgs.push({
//                   role: "bot",
//                   text: "Destruction complete. All resources have been removed.",
//                   type: "PLAN_DISPLAY",
//                   destroyMode: true,
//                   planStatus: "DEPLOYED",
//                   planJobId: job.job_id,
//                   structured_plan: { resource_changes: [] },
//                 });
//                 return;
//               } else if (
//                 job.job_type === "DESTROY" &&
//                 job.status === "FAILED"
//               ) {
//                 historyMsgs.push({ role: "bot", text: baseMsg.text });
//                 historyMsgs.push({
//                   role: "bot",
//                   text: "Destruction failed. Some resources may still exist.",
//                   type: "PLAN_DISPLAY",
//                   destroyMode: true,
//                   planStatus: "DEPLOYMENT_FAILED",
//                   planJobId: job.job_id,
//                   structured_plan: { resource_changes: [] },
//                 });
//                 historyMsgs.push({
//                   role: "bot",
//                   type: "DEPLOYMENT_FAILED",
//                   text: "Destruction failed.",
//                   errorData:
//                     job.error_message ||
//                     "Manual intervention may be required in the AWS Console.",
//                   aiAnalysis: job.ai_analysis || null,
//                   isAiLoading: false,
//                 });
//                 return;
//               } else if (job.status === "FAILED") {
//                 baseMsg.type = "DEPLOYMENT_FAILED";
//                 baseMsg.errorData =
//                   job.error_message || job.error || "An unknown error occurred.";
//                 baseMsg.aiAnalysis = job.ai_analysis || null;
//                 baseMsg.isAiLoading = false;
//               }
//             }

//             historyMsgs.push(baseMsg);
//           });

//           const lastCostMsg = historyMsgs.slice().reverse().find((m) => m.costData);
//           setCostData(lastCostMsg ? lastCostMsg.costData : null);

//           chatCache.current[projId] = historyMsgs;
//           setMessages(historyMsgs);
//           setChatStarted(historyMsgs.length > 0);

//           const lastJobMsg = [...historyMsgs]
//             .reverse()
//             .find((m) => m.planJobId && m.type === "PLAN_DISPLAY");

//           if (lastJobMsg && projId) {
//             const isTerminalPlanStatus =
//               lastJobMsg.planStatus === "DEPLOYED" ||
//               lastJobMsg.planStatus === "DISCARDED" ||
//               lastJobMsg.planStatus === "DEPLOYMENT_FAILED";

//             const inferredStatus = isTerminalPlanStatus ? "COMPLETED" : "RUNNING";

//             const applyJobId = applyJobIdMap[lastJobMsg.planJobId];
//             const inferredMode = lastJobMsg.destroyMode
//               ? "destroy"
//               : applyJobId
//               ? "apply"
//               : "plan";
//             const logJobId = applyJobId || lastJobMsg.planJobId;

//             if (!projectLogsRef.current[projId]) {
//               projectLogsRef.current[projId] = {
//                 jobId: logJobId,
//                 mode: inferredMode,
//                 status: inferredStatus,
//               };
//             }
//           }

//           restoreProjectLogs(projId);
//         }
//       } catch (e) {
//         console.error("Failed to load history:", e);
//       }
//     },
//     [restoreProjectLogs]
//   );

//   useEffect(() => {
//     if (activeProjectId) {
//       setSessionId(activeProjectId);
//       loadChatHistory(activeProjectId);
//     } else {
//       setSessionId(null);
//       setMessages([]);
//       setChatStarted(false);
//       setConversationName("New Conversation");
//       setCostData(null); // 🔥 NEW: Clear cost data when leaving project
//       sessionAttributesRef.current = {};
//       restoreProjectLogs(null);
//     }
//   }, [activeProjectId, loadChatHistory, restoreProjectLogs]);

//   const handleProjectSelect = (projId, projName, silentSync = false) => {
//     setActiveProjectId(projId);
//     activeProjectIdRef.current = projId;
//     setConversationName(projName || "New Conversation");

//     if (!projId) {
//       setSessionId(null);
//       setMessages([]);
//       setChatStarted(false);
//       setCostData(null); // 🔥 NEW: Clear cost data when leaving project
//       sessionAttributesRef.current = {};
//     } else {
//       setSessionId(projId);
//     }

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

//   const pollStatus = useCallback(
//     (jobId, mode, relatedPlanJobId = null) => {
//       if (!jobId) return;

//       stopPolling();

//       setBotStatus(
//         mode === "plan"
//           ? "Terraform is planning..."
//           : mode === "destroy"
//           ? "Destroying infrastructure..."
//           : "Provisioning AWS Resources..."
//       );

//       const checkStatus = async () => {
//         try {
//           const data = await apiFetch(`/status/${jobId}`, { method: "GET" });

//           if (data.status === "COMPLETED") {
//             setBotStatus("");
//             stopPolling();
//             setActiveLogStatus("COMPLETED");

//             const currentPid = activeProjectIdRef.current;
//             if (currentPid && projectLogsRef.current[currentPid]) {
//               projectLogsRef.current[currentPid].status = "COMPLETED";
//             }

//             if (mode === "plan") {
//               updateMessages((prev) => [
//                 ...prev,
//                 {
//                   role: "bot",
//                   text: "Terraform plan complete. Review the resources below.",
//                   type: "PLAN_DISPLAY",
//                   structured_plan: data.structured_plan,
//                   planJobId: jobId,
//                   onCalculateCost: () => triggerCost(jobId),
//                   onApprove: () => triggerApply(jobId),
//                   onDiscard: () => discardPlan(jobId),
//                 },
//               ]);
//             }

//             if (mode === "cost") {
//               const costSummary = data.cost_summary;
//               updateMessages((prev) =>
//                 prev.map((msg) =>
//                   msg.planJobId === relatedPlanJobId
//                     ? { ...msg, costData: costSummary }
//                     : msg
//                 )
//               );
//               setCostData(costSummary);
//             }

//             if (mode === "destroy") {
//               setCostData(null);

//               const blueprint = sessionAttributesRef.current.infra_blueprint
//                 ? (() => {
//                     try {
//                       return JSON.parse(
//                         sessionAttributesRef.current.infra_blueprint
//                       );
//                     } catch {
//                       return null;
//                     }
//                   })()
//                 : null;

//               const destroyChanges =
//                 blueprint?.components?.map((c) => ({
//                   address: `module.${c.service}.aws_${c.service}_resource.this`,
//                   change: { actions: ["delete"] },
//                 })) || [];

//               updateMessages((prev) => [
//                 ...prev,
//                 {
//                   role: "bot",
//                   text: "Destruction complete. All resources have been removed.",
//                   type: "PLAN_DISPLAY",
//                   destroyMode: true,
//                   planStatus: "DEPLOYED",
//                   planJobId: jobId,
//                   structured_plan: { resource_changes: destroyChanges },
//                 },
//               ]);

//               sessionAttributesRef.current.infra_blueprint = null;

//               apiFetch("/chats", {
//                 method: "POST",
//                 body: JSON.stringify({
//                   project_id: activeProjectIdRef.current,
//                   sender: "BOT",
//                   message_text:
//                     "Destruction complete. All resources have been removed.",
//                   job_id: jobId,
//                 }),
//               }).catch(() => {});
//             }

//             if (mode === "apply") {
//               updateMessages((prev) => {
//                 const updatedPrev = prev.map((msg) =>
//                   msg.planJobId === relatedPlanJobId
//                     ? {
//                         ...msg,
//                         planStatus: "DEPLOYED",
//                         onApprove: undefined,
//                         onCalculateCost: undefined,
//                         onDiscard: undefined,
//                       }
//                     : msg
//                 );

//                 return [
//                   ...updatedPrev,
//                   {
//                     role: "bot",
//                     type: "DEPLOYMENT_SUCCESS",
//                     text: "Deployment completed successfully.",
//                     outputs: data.outputs || {},
//                     access: data.access || [],
//                   },
//                 ];
//               });

//               apiFetch("/chats", {
//                 method: "POST",
//                 body: JSON.stringify({
//                   project_id: activeProjectIdRef.current,
//                   sender: "BOT",
//                   message_text: "Deployment completed successfully.",
//                   job_id: jobId,
//                 }),
//               }).catch(() => {});
//             }
//           } else if (data.status === "FAILED") {
//             setBotStatus("");
//             stopPolling();
//             setActiveLogStatus("FAILED");

//             const currentPid = activeProjectIdRef.current;
//             if (currentPid && projectLogsRef.current[currentPid]) {
//               projectLogsRef.current[currentPid].status = "FAILED";
//             }

//             if (mode === "destroy") {
//               const blueprint = sessionAttributesRef.current.infra_blueprint
//                 ? (() => {
//                     try {
//                       return JSON.parse(
//                         sessionAttributesRef.current.infra_blueprint
//                       );
//                     } catch {
//                       return null;
//                     }
//                   })()
//                 : null;

//               const destroyChanges =
//                 blueprint?.components?.map((c) => ({
//                   address: `module.${c.service}.aws_${c.service}_resource.this`,
//                   change: { actions: ["delete"] },
//                 })) || [];

//               updateMessages((prev) => [
//                 ...prev,
//                 {
//                   role: "bot",
//                   text: "Destruction failed. Some resources may still exist.",
//                   type: "PLAN_DISPLAY",
//                   destroyMode: true,
//                   planStatus: "DEPLOYMENT_FAILED",
//                   planJobId: jobId,
//                   structured_plan: { resource_changes: destroyChanges },
//                 },
//                 {
//                   role: "bot",
//                   type: "DEPLOYMENT_FAILED",
//                   text: "Destruction failed.",
//                   errorData:
//                     data.error ||
//                     "Manual intervention may be required in the AWS Console.",
//                   aiAnalysis: data.ai_analysis || null,
//                   isAiLoading: !data.ai_analysis,
//                   failJobId: jobId,
//                 },
//               ]);

//               if (!data.ai_analysis) {
//                 setTimeout(async () => {
//                   try {
//                     const updated = await apiFetch(`/status/${jobId}`, { method: "GET" });
//                     if (updated.ai_analysis) {
//                       updateMessages((prev) =>
//                         prev.map((m) =>
//                           m.failJobId === jobId
//                             ? { ...m, aiAnalysis: updated.ai_analysis, isAiLoading: false }
//                             : m
//                         )
//                       );
//                     }
//                   } catch {}
//                 }, 5000);
//               }

//               apiFetch("/chats", {
//                 method: "POST",
//                 body: JSON.stringify({
//                   project_id: activeProjectIdRef.current,
//                   sender: "BOT",
//                   message_text:
//                     "Destruction failed. Manual intervention may be required.",
//                   job_id: jobId,
//                 }),
//               }).catch(() => {});

//               return;
//             }

//             updateMessages((prev) => {
//               const updatedPrev =
//                 mode === "apply"
//                   ? prev.map((msg) =>
//                       msg.planJobId === relatedPlanJobId
//                         ? {
//                             ...msg,
//                             planStatus: "DEPLOYMENT_FAILED",
//                             onApprove: undefined,
//                             onCalculateCost: undefined,
//                             onDiscard: undefined,
//                           }
//                         : msg
//                     )
//                   : prev;

//               return [
//                 ...updatedPrev,
//                 {
//                   role: "bot",
//                   type: "DEPLOYMENT_FAILED",
//                   text: "Process failed.",
//                   errorData:
//                     data.error ||
//                     data.error_message ||
//                     "An unknown deployment error occurred.",
//                   aiAnalysis: data.ai_analysis || null,
//                   isAiLoading: !data.ai_analysis,
//                   failJobId: jobId,
//                 },
//               ];
//             });

//             if (!data.ai_analysis) {
//               setTimeout(async () => {
//                 try {
//                   const updated = await apiFetch(`/status/${jobId}`, { method: "GET" });
//                   if (updated.ai_analysis) {
//                     updateMessages((prev) =>
//                       prev.map((m) =>
//                         m.failJobId === jobId
//                           ? { ...m, aiAnalysis: updated.ai_analysis, isAiLoading: false }
//                           : m
//                       )
//                     );
//                   }
//                 } catch {}
//               }, 5000);
//             }
//           } else {
//             const delay = mode === "apply" || mode === "destroy" ? 4000 : 3000;
//             planTimeoutRef.current = setTimeout(checkStatus, delay);
//           }
//         } catch {
//           setBotStatus("Reconnecting...");
//           planTimeoutRef.current = setTimeout(checkStatus, 5000);
//         }
//       };

//       checkStatus();
//     },
//     [stopPolling, updateMessages]
//   );

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
//     if (isSendingRef.current && !isSystemEvent) return;
//     if (!isSystemEvent) {
//       isSendingRef.current = true;
//     }

//     let currentProjId = activeProjectIdRef.current;

//     try {
//       if (!isSystemEvent) {
//         if (!currentProjId) {
//           try {
//             const newProjTitle =
//               text.length > 30 ? text.substring(0, 30) + "..." : text;

//             const projRes = await apiFetch("/projects", {
//               method: "POST",
//               body: JSON.stringify({
//                 project_name: newProjTitle,
//                 environment: "development",
//               }),
//             });

//             currentProjId = projRes.project_id;
//             // Update the projects list so it appears in the sidebar/dashboard immediately
//             setProjects((prev) => [projRes, ...prev]);
//             handleProjectSelect(currentProjId, projRes.project_name, true);
//           } catch (e) {
//             console.error("Auto-create failed:", e);
//           }
//         }

//         updateMessages((prev) => [...prev, { role: "user", text }]);

//         if (currentProjId) {
//           apiFetch("/chats", {
//             method: "POST",
//             body: JSON.stringify({
//               project_id: currentProjId,
//               sender: "USER",
//               message_text: text,
//             }),
//           }).catch(() => {});
//         }

//         setIsTyping(true);
//         setBotStatus("CloudCrafter is thinking...");
//         setChatStarted(true);
//       }

//       const command = new RecognizeTextCommand({
//         botId: BOT_ID,
//         botAliasId: ALIAS_ID,
//         localeId: "en_US",
//         sessionId: currentProjId || userId || "local-session",
//         text,
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

//       // 1. Get the UI payload if it exists
//       let payload = {};
//       try {
//         payload = JSON.parse(updatedAttrs.ui_payload || "{}");
//       } catch {
//         payload = {};
//       }

//       if (payload.cost) {
//         setCostData(payload.cost);
//       }

//       // 2. Safely get the text message from either the payload or Lex
//       const botMessage =
//         payload.message || response.messages?.content || "";

//       // 3. Get the Job ID from the various possible payload fields
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
//     } catch (error) {
//       console.error("talkToLex failed:", error);

//       updateMessages((prev) => [
//         ...prev,
//         {
//           role: "bot",
//           text: `⚠️ Connection lost. ${error?.message || "Unknown error"}`,
//         },
//       ]);
//     } finally {
//       if (!isSystemEvent) {
//         isSendingRef.current = false;
//         setIsTyping(false);
//         setBotStatus("");
//       }
//     }
//   };

//   const containerClass =
//     theme === "dark" ? "bg-[#050505] text-white" : "bg-zinc-50 text-zinc-900";

// /* ========================================================= */
//   /* MAIN RENDER LOGIC (THE TRAFFIC CONTROLLER)                  */
//   /* ========================================================= */

//   // 🔥 Prevent the dashboard from rendering and firing ghost requests
//   if (!session) {
//     return (
//       <div className={`flex items-center justify-center h-screen overflow-hidden ${containerClass}`}>
//         <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//         </svg>
//       </div>
//     );
//   }

//   // SCENARIO 1: No active project -> Show Dashboard
//   if (!activeProjectId) {
//     return (
//       <div className={`flex flex-col h-screen overflow-hidden ${containerClass}`}>
        
//         {/* Simple Header for Dashboard */}
//         <header className="h-[60px] flex justify-between items-center px-6 border-b border-white/10 shrink-0">
//           <div className="flex items-center gap-4">
//             <span className="font-bold text-lg tracking-tight">CloudCrafter</span>
//           </div>
//           <div className="flex items-center gap-4">
//             <NotificationBell />
//             <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-white/10">
//               <div className="hidden sm:flex flex-col text-right">
//                 <span className="text-xs font-bold text-zinc-200">{displayName}</span>
//                 <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
//                   <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
//                   Connected
//                 </span>
//               </div>
//               <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30 uppercase shrink-0">
//                 {displayName.charAt(0)}
//               </div>
//               <button
//                 onClick={() => navigate("/logout")}
//                 className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all ml-1"
//                 title="Logout"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
//                   <polyline points="16 17 21 12 16 7"></polyline>
//                   <line x1="21" y1="12" x2="9" y2="12"></line>
//                 </svg>
//               </button>
//             </div>
//           </div>
//         </header>

//         {/* The beautiful grid of projects */}
//         <div className="flex-1 overflow-y-auto">
//           <ProjectDashboard 
//             projects={projects}
//             userRole={userRole}
//             isLoading={isLoadingProjects}
//             onSelectProject={handleProjectSelect}
//             onCreateClick={() => setIsModalOpen(true)}
//           />
//         </div>

//         {/* The Popup Modal for Admins */}
//         <CreateProjectModal 
//           isOpen={isModalOpen}
//           onClose={() => setIsModalOpen(false)}
//           onProjectCreated={(newProj) => {
//             setProjects([newProj, ...projects]);
//             handleProjectSelect(newProj.project_id, newProj.project_name);
//           }}
//         />
//       </div>
//     );
//   }

//   // SCENARIO 2: Active Project Selected -> Show the Workspace
//   return (
//     <div className={`flex flex-col h-screen overflow-hidden ${containerClass}`}>
//       <header className="h-[60px] flex justify-between items-center px-6 border-b border-white/10 shrink-0">
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="p-2 hover:bg-white/5 rounded-lg transition-colors"
//           >
//             ☰
//           </button>
          
//           {/* 🔥 NEW: Back to Dashboard Button */}
//           <button 
//             onClick={() => handleProjectSelect(null, "")}
//             className="text-zinc-400 hover:text-white flex items-center gap-1.5 text-sm font-medium transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
//           >
//             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
//             Dashboard
//           </button>
          
//           <div className="w-px h-6 bg-white/10 mx-2"></div>

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

//           <button
//             onClick={() => {
//               if (logPanelOpen) {
//                 setLogPanelOpen(false);
//               } else {
//                 const projId = activeProjectIdRef.current;
//                 const saved = projId ? projectLogsRef.current[projId] : null;
//                 if (saved) {
//                   setActiveLogJobId(saved.jobId);
//                   setActiveLogMode(saved.mode);
//                   setActiveLogStatus(saved.status);
//                 }
//                 setLogPanelOpen(true);
//               }
//             }}
//             className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all hidden sm:flex
//               ${
//                 logPanelOpen
//                   ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
//                   : activeLogJobId
//                   ? "bg-white/5 text-zinc-400 border-white/10 hover:text-zinc-200 hover:bg-white/10"
//                   : "bg-white/5 text-zinc-600 border-white/5 cursor-default opacity-50"
//               }`}
//           >
//             <svg
//               width="12"
//               height="12"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             >
//               <polyline points="4 17 10 11 4 5" />
//               <line x1="12" y1="19" x2="20" y2="19" />
//             </svg>
//             Logs
//             {activeLogStatus === "RUNNING" && (
//               <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
//             )}
//           </button>

//           <NotificationBell />

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
//             disabled={botStatus !== "" && botStatus !== "CloudCrafter is thinking..."}
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
import { getAuthToken } from "../utils/api";
import LogPanel from "../pages/LogPanel";
import NotificationBell from "./NotificationBell";
import ProjectDashboard from "../pages/ProjectDashboard";
import CreateProjectModal from "../pages/CreateProjectModal";
import { useRealtimeInsert, useRealtimeUpdate } from "../hooks/useSupabaseRealtime";

/* ---------------- CONFIG & CLIENTS ---------------- */

const REGION   = process.env.REACT_APP_AWS_REGION;
const BOT_ID   = process.env.REACT_APP_LEX_BOT_ID;
const ALIAS_ID = process.env.REACT_APP_LEX_BOT_ALIAS_ID;
const POOL_ID  = process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID;

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

/* ================================================== */
/*  COMPONENT                                         */
/* ================================================== */

const ConsoleLayout = () => {
  const navigate = useNavigate();

  const isSendingRef         = useRef(false);
  const sessionAttributesRef = useRef({});
  const chatCache            = useRef({});
  const activeProjectIdRef   = useRef(getSessionId());

  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [theme,             setTheme]             = useState("dark");
  const [userId,            setUserId]            = useState(null);

  const [activeProjectId,   setActiveProjectId]   = useState(getSessionId());
  const [conversationName,  setConversationName]  = useState("New Conversation");

  const [messages,          setMessages]          = useState([]);
  const [chatStarted,       setChatStarted]       = useState(false);
  const [isTyping,          setIsTyping]          = useState(false);
  const [botStatus,         setBotStatus]         = useState("");

  const [costData,          setCostData]          = useState(null);

  const projectLogsRef = useRef({});

  const [logPanelOpen,    setLogPanelOpen]    = useState(false);
  const [activeLogJobId,  setActiveLogJobId]  = useState(null);
  const [activeLogMode,   setActiveLogMode]   = useState(null);
  const [activeLogStatus, setActiveLogStatus] = useState(null);

  const [projects,          setProjects]          = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isModalOpen,       setIsModalOpen]       = useState(false);

  const planTimeoutRef  = useRef(null);
  const applyIntervalRef = useRef(null);

  /* ── Session ─────────────────────────────────────────────────────────── */

  const [session, setSession] = useState(null);

  useEffect(() => {
    try {
      const data = localStorage.getItem("cloudcrafter_session");
      const parsed = data && data !== "null" ? JSON.parse(data) : null;
      setSession(parsed);
    } catch {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    if (session === null) return; // wait until loaded

    if (!session) {
      console.warn("No active session. Redirecting...");
      setTimeout(() => navigate("/signin"), 100);
    }
  }, [session, navigate]);

  const displayName = session?.full_name || session?.email || "User";
  const userRole    = session?.role;

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      navigate("/signin");
    }
  }, []);
  
  /* ── Sync ref ────────────────────────────────────────────────────────── */

  useEffect(() => {
    activeProjectIdRef.current = activeProjectId;
  }, [activeProjectId]);

  /* ── Message updater ─────────────────────────────────────────────────── */

  const updateMessages = useCallback((updater) => {
    setMessages((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (activeProjectIdRef.current) {
        chatCache.current[activeProjectIdRef.current] = next;
      }
      return next;
    });
  }, []);

  /* ── Cognito identity ────────────────────────────────────────────────── */

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

  /* ── Theme ───────────────────────────────────────────────────────────── */

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  /* ── Fetch projects ──────────────────────────────────────────────────── */

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      setIsLoadingProjects(true);
      try {
        const data = await apiFetch("/projects", { method: "GET" });
        setProjects(data.projects || []);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    load();
  }, [session]);

  /* ── Log helpers ─────────────────────────────────────────────────────── */

  const openLogs = useCallback((jobId, mode, status) => {
    const projId = activeProjectIdRef.current;
    if (projId && jobId) {
      projectLogsRef.current[projId] = { jobId, mode, status: status || "RUNNING" };
    }
    setActiveLogJobId(jobId);
    setActiveLogMode(mode);
    setActiveLogStatus(status || "RUNNING");
    setLogPanelOpen(true);
  }, []);

  const restoreProjectLogs = useCallback((projId) => {
    setLogPanelOpen(false);
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

  /* ── Realtime: new projects ──────────────────────────────────────────── */

  useRealtimeInsert("projects", (newRow) => {
    setProjects((prev) => {
      if (prev.some((p) => p.project_id === newRow.project_id)) return prev;
      return [newRow, ...prev];
    });
  });

  /* ── Realtime: job status updates ────────────────────────────────────── */

  useRealtimeUpdate(
    "jobs",
    (updatedJob) => {
      if (updatedJob.project_id !== activeProjectId) return;
      if (updatedJob.status === "COMPLETED" || updatedJob.status === "FAILED") {
        setActiveLogStatus(updatedJob.status);
        const projId = activeProjectIdRef.current;
        if (projId && projectLogsRef.current[projId]) {
          projectLogsRef.current[projId].status = updatedJob.status;
        }
      }
    },
    activeProjectId ? `project_id=eq.${activeProjectId}` : null,
    [activeProjectId]
  );

  /* ── Realtime: incoming chat messages from other users ───────────────── */

  const handleNewRealtimeMessage = useCallback((row) => {
    // Skip own messages — already added optimistically in talkToLex
    const session = (() => {
      try { return JSON.parse(localStorage.getItem("cloudcrafter_session") || "{}"); }
      catch { return {}; }
    })();
    const currentUserName = session?.full_name || session?.email || "";
    if (row.sender_name === currentUserName) return;

    const newMsg = {
      role: row.sender?.toUpperCase() === "USER" ? "user" : "bot",
      text: row.message_text,
      senderName: row.sender_name,
      senderRole: row.sender_role,
    };

    updateMessages((prev) => {
      const duplicate = prev.some(
        (m) => m.text === newMsg.text && m.senderName === newMsg.senderName
      );
      if (duplicate) return prev;
      return [...prev, newMsg];
    });
  }, [updateMessages]);

  /* ── History loading ─────────────────────────────────────────────────── */

  const loadChatHistory = useCallback(
    async (projId) => {
      if (chatCache.current[projId]) {
        setMessages(chatCache.current[projId]);
        setChatStarted(chatCache.current[projId].length > 0);
        restoreProjectLogs(projId);
        return;
      }

      try {
        const data = await apiFetch(`/chats/${projId}`);

        if (!data.messages) return;

        const sorted = data.messages.sort(
          (a, b) =>
            new Date(a.created_at || a.timestamp) -
            new Date(b.created_at || b.timestamp)
        );

        const applyStatusMap = {};
        const applyJobIdMap  = {};
        sorted.forEach((m) => {
          if (
            m.job_details?.job_type === "APPLY" &&
            m.job_details?.plan_ref
          ) {
            applyStatusMap[m.job_details.plan_ref] = m.job_details.status;
            applyJobIdMap[m.job_details.plan_ref]  = m.job_details.job_id;
          }
        });

        const lastBotWithBlueprint = [...data.messages]
          .reverse()
          .find((m) => m.sender?.toUpperCase() === "BOT" && m.job_details?.blueprint);

        if (lastBotWithBlueprint) {
          sessionAttributesRef.current.infra_blueprint = JSON.stringify(
            lastBotWithBlueprint.job_details.blueprint
          );
        }

        const historyMsgs = [];

        sorted.forEach((m) => {
          const isUser = m.sender?.toUpperCase() === "USER";

          // ── Base message shape including group-chat sender fields ──
          const baseMsg = {
            role:       isUser ? "user" : "bot",
            text:       m.message_text,
            senderName: m.sender_name || (isUser ? "User" : "CloudCrafter"),
            senderRole: m.sender_role || (isUser ? "admin" : "bot"),
          };

          if (m.job_details) {
            const job = m.job_details;

            if (
              job.job_type === "PLAN" &&
              (job.status === "COMPLETED" || job.status === "DISCARDED")
            ) {
              if (baseMsg.text) {
                historyMsgs.push({ role: "bot", text: baseMsg.text, senderName: "CloudCrafter", senderRole: "bot" });
              }

              const planMsg = {
                role:           "bot",
                text:           "Terraform plan complete. Review the resources below.",
                senderName:     "CloudCrafter",
                senderRole:     "bot",
                type:           "PLAN_DISPLAY",
                structured_plan: job.result || { resource_changes: [] },
                planJobId:      job.job_id,
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

              if (job.cost_summary) planMsg.costData = job.cost_summary;

              historyMsgs.push(planMsg);
              return;

            } else if (job.job_type === "APPLY" && job.status === "COMPLETED") {
              baseMsg.type    = "DEPLOYMENT_SUCCESS";
              baseMsg.outputs = job.result?.outputs || {};
              baseMsg.access  = job.result?.access  || [];

            } else if (job.job_type === "DESTROY" && job.status === "COMPLETED") {
              historyMsgs.push({ role: "bot", text: baseMsg.text, senderName: "CloudCrafter", senderRole: "bot" });
              historyMsgs.push({
                role: "bot", senderName: "CloudCrafter", senderRole: "bot",
                text: "Destruction complete. All resources have been removed.",
                type: "PLAN_DISPLAY", destroyMode: true, planStatus: "DEPLOYED",
                planJobId: job.job_id, structured_plan: { resource_changes: [] },
              });
              return;

            } else if (job.job_type === "DESTROY" && job.status === "FAILED") {
              historyMsgs.push({ role: "bot", text: baseMsg.text, senderName: "CloudCrafter", senderRole: "bot" });
              historyMsgs.push({
                role: "bot", senderName: "CloudCrafter", senderRole: "bot",
                text: "Destruction failed. Some resources may still exist.",
                type: "PLAN_DISPLAY", destroyMode: true, planStatus: "DEPLOYMENT_FAILED",
                planJobId: job.job_id, structured_plan: { resource_changes: [] },
              });
              historyMsgs.push({
                role: "bot", senderName: "CloudCrafter", senderRole: "bot",
                type: "DEPLOYMENT_FAILED", text: "Destruction failed.",
                errorData: job.error_message || "Manual intervention may be required.",
                aiAnalysis: job.ai_analysis || null, isAiLoading: false,
              });
              return;

            } else if (job.status === "FAILED") {
              baseMsg.type      = "DEPLOYMENT_FAILED";
              baseMsg.errorData = job.error_message || job.error || "An unknown error occurred.";
              baseMsg.aiAnalysis  = job.ai_analysis || null;
              baseMsg.isAiLoading = false;
            }
          }

          historyMsgs.push(baseMsg);
        });

        const lastCostMsg = historyMsgs.slice().reverse().find((m) => m.costData);
        setCostData(lastCostMsg ? lastCostMsg.costData : null);

        chatCache.current[projId] = historyMsgs;
        setMessages(historyMsgs);
        setChatStarted(historyMsgs.length > 0);

        // Restore log panel state
        const lastJobMsg = [...historyMsgs]
          .reverse()
          .find((m) => m.planJobId && m.type === "PLAN_DISPLAY");

        if (lastJobMsg && projId) {
          const isTerminal = ["DEPLOYED", "DISCARDED", "DEPLOYMENT_FAILED"]
            .includes(lastJobMsg.planStatus);
          const inferredStatus  = isTerminal ? "COMPLETED" : "RUNNING";
          const applyJobId      = applyJobIdMap[lastJobMsg.planJobId];
          const inferredMode    = lastJobMsg.destroyMode ? "destroy" : applyJobId ? "apply" : "plan";
          const logJobId        = applyJobId || lastJobMsg.planJobId;

          if (!projectLogsRef.current[projId]) {
            projectLogsRef.current[projId] = { jobId: logJobId, mode: inferredMode, status: inferredStatus };
          }
        }

        restoreProjectLogs(projId);
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    },
    [restoreProjectLogs]
  );

  useEffect(() => {
    if (activeProjectId) {
      setSessionId(activeProjectId);
      loadChatHistory(activeProjectId);
    } else {
      setSessionId(null);
      setMessages([]);
      setChatStarted(false);
      setConversationName("New Conversation");
      setCostData(null);
      sessionAttributesRef.current = {};
      restoreProjectLogs(null);
    }
  }, [activeProjectId, loadChatHistory, restoreProjectLogs]);

  /* ── Project selection ───────────────────────────────────────────────── */

  const handleProjectSelect = (projId, projName, silentSync = false) => {
    setActiveProjectId(projId);
    activeProjectIdRef.current = projId;
    setConversationName(projName || "New Conversation");

    if (!projId) {
      setSessionId(null);
      setMessages([]);
      setChatStarted(false);
      setCostData(null);
      sessionAttributesRef.current = {};
    } else {
      setSessionId(projId);
    }

    restoreProjectLogs(projId);
    if (!silentSync) setSidebarOpen(false);
  };

  /* ── Polling ─────────────────────────────────────────────────────────── */

  const stopPolling = useCallback(() => {
    if (planTimeoutRef.current)  clearTimeout(planTimeoutRef.current);
    if (applyIntervalRef.current) clearInterval(applyIntervalRef.current);
    planTimeoutRef.current   = null;
    applyIntervalRef.current = null;
  }, []);

  const pollStatus = useCallback(
    (jobId, mode, relatedPlanJobId = null) => {
      if (!jobId) return;
      stopPolling();

      setBotStatus(
        mode === "plan"    ? "Terraform is planning..."       :
        mode === "destroy" ? "Destroying infrastructure..."   :
                             "Provisioning AWS Resources..."
      );

      const checkStatus = async () => {
        try {
          const data = await apiFetch(`/status/${jobId}`, { method: "GET" });

          if (data.status === "COMPLETED") {
            setBotStatus("");
            stopPolling();
            setActiveLogStatus("COMPLETED");

            const currentPid = activeProjectIdRef.current;
            if (currentPid && projectLogsRef.current[currentPid]) {
              projectLogsRef.current[currentPid].status = "COMPLETED";
            }

            if (mode === "plan") {
              updateMessages((prev) => [
                ...prev,
                {
                  role: "bot", senderName: "CloudCrafter", senderRole: "bot",
                  text: "Terraform plan complete. Review the resources below.",
                  type: "PLAN_DISPLAY",
                  structured_plan: data.structured_plan,
                  planJobId: jobId,
                  onCalculateCost: () => triggerCost(jobId),
                  onApprove:       () => triggerApply(jobId),
                  onDiscard:       () => discardPlan(jobId),
                },
              ]);
            }

            if (mode === "cost") {
              updateMessages((prev) =>
                prev.map((msg) =>
                  msg.planJobId === relatedPlanJobId
                    ? { ...msg, costData: data.cost_summary }
                    : msg
                )
              );
              setCostData(data.cost_summary);
            }

            if (mode === "destroy") {
              setCostData(null);
              const blueprint = (() => {
                try { return JSON.parse(sessionAttributesRef.current.infra_blueprint || "null"); }
                catch { return null; }
              })();
              const destroyChanges = blueprint?.components?.map((c) => ({
                address: `module.${c.service}.aws_${c.service}_resource.this`,
                change: { actions: ["delete"] },
              })) || [];

              updateMessages((prev) => [
                ...prev,
                {
                  role: "bot", senderName: "CloudCrafter", senderRole: "bot",
                  text: "Destruction complete. All resources have been removed.",
                  type: "PLAN_DISPLAY", destroyMode: true, planStatus: "DEPLOYED",
                  planJobId: jobId,
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
                const updated = prev.map((msg) =>
                  msg.planJobId === relatedPlanJobId
                    ? { ...msg, planStatus: "DEPLOYED", onApprove: undefined, onCalculateCost: undefined, onDiscard: undefined }
                    : msg
                );
                return [
                  ...updated,
                  {
                    role: "bot", senderName: "CloudCrafter", senderRole: "bot",
                    type: "DEPLOYMENT_SUCCESS",
                    text: "Deployment completed successfully.",
                    outputs: data.outputs || {},
                    access:  data.access  || [],
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

            const currentPid = activeProjectIdRef.current;
            if (currentPid && projectLogsRef.current[currentPid]) {
              projectLogsRef.current[currentPid].status = "FAILED";
            }

            if (mode === "destroy") {
              const blueprint = (() => {
                try { return JSON.parse(sessionAttributesRef.current.infra_blueprint || "null"); }
                catch { return null; }
              })();
              const destroyChanges = blueprint?.components?.map((c) => ({
                address: `module.${c.service}.aws_${c.service}_resource.this`,
                change: { actions: ["delete"] },
              })) || [];

              updateMessages((prev) => [
                ...prev,
                {
                  role: "bot", senderName: "CloudCrafter", senderRole: "bot",
                  text: "Destruction failed. Some resources may still exist.",
                  type: "PLAN_DISPLAY", destroyMode: true, planStatus: "DEPLOYMENT_FAILED",
                  planJobId: jobId,
                  structured_plan: { resource_changes: destroyChanges },
                },
                {
                  role: "bot", senderName: "CloudCrafter", senderRole: "bot",
                  type: "DEPLOYMENT_FAILED", text: "Destruction failed.",
                  errorData: data.error || "Manual intervention may be required in the AWS Console.",
                  aiAnalysis: data.ai_analysis || null,
                  isAiLoading: !data.ai_analysis,
                  failJobId: jobId,
                },
              ]);

              if (!data.ai_analysis) {
                setTimeout(async () => {
                  try {
                    const updated = await apiFetch(`/status/${jobId}`, { method: "GET" });
                    if (updated.ai_analysis) {
                      updateMessages((prev) =>
                        prev.map((m) =>
                          m.failJobId === jobId
                            ? { ...m, aiAnalysis: updated.ai_analysis, isAiLoading: false }
                            : m
                        )
                      );
                    }
                  } catch {}
                }, 5000);
              }

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
              const updated =
                mode === "apply"
                  ? prev.map((msg) =>
                      msg.planJobId === relatedPlanJobId
                        ? { ...msg, planStatus: "DEPLOYMENT_FAILED", onApprove: undefined, onCalculateCost: undefined, onDiscard: undefined }
                        : msg
                    )
                  : prev;
              return [
                ...updated,
                {
                  role: "bot", senderName: "CloudCrafter", senderRole: "bot",
                  type: "DEPLOYMENT_FAILED", text: "Process failed.",
                  errorData: data.error || data.error_message || "An unknown deployment error occurred.",
                  aiAnalysis:  data.ai_analysis || null,
                  isAiLoading: !data.ai_analysis,
                  failJobId:   jobId,
                },
              ];
            });

            if (!data.ai_analysis) {
              setTimeout(async () => {
                try {
                  const updated = await apiFetch(`/status/${jobId}`, { method: "GET" });
                  if (updated.ai_analysis) {
                    updateMessages((prev) =>
                      prev.map((m) =>
                        m.failJobId === jobId
                          ? { ...m, aiAnalysis: updated.ai_analysis, isAiLoading: false }
                          : m
                      )
                    );
                  }
                } catch {}
              }, 5000);
            }

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
    },
    [stopPolling, updateMessages]
  );

  /* ── Action triggers ─────────────────────────────────────────────────── */

  const discardPlan = async (planJobId) => {
    setCostData(null);
    updateMessages((prev) =>
      prev.map((msg) =>
        msg.planJobId === planJobId
          ? { ...msg, planStatus: "DISCARDED", onApprove: undefined, onCalculateCost: undefined, onDiscard: undefined }
          : msg
      )
    );
    try { await apiFetch(`/jobs/${planJobId}/discard`, { method: "POST" }); }
    catch (e) { console.error("Failed to discard job:", e); }
  };

  const triggerCost = async (planJobId) => {
    try {
      setBotStatus("Calculating infrastructure cost...");
      const data = await apiFetch("/cost", {
        method: "POST",
        body: JSON.stringify({ run_id: planJobId, project_id: activeProjectIdRef.current }),
      });
      pollStatus(data.job_id, "cost", planJobId);
    } catch { setBotStatus(""); }
  };

  const triggerApply = async (planJobId) => {
    const blueprint = (() => {
      try { return JSON.parse(sessionAttributesRef.current.infra_blueprint || "null"); }
      catch { return null; }
    })();

    const body = { project_id: activeProjectIdRef.current, job_id: planJobId };
    if (blueprint) body.infra_blueprint = blueprint;

    try {
      setBotStatus("Starting deployment...");
      const data = await apiFetch("/apply", { method: "POST", body: JSON.stringify(body) });
      apiFetch("/chats", {
        method: "POST",
        body: JSON.stringify({
          project_id: activeProjectIdRef.current,
          sender: "BOT",
          message_text: "Initiating deployment...",
          job_id: data.apply_job_id,
        }),
      }).catch(() => {});
      openLogs(data.apply_job_id, "apply", "RUNNING");
      pollStatus(data.apply_job_id, "apply", planJobId);
    } catch { setBotStatus(""); }
  };

  /* ── Lex handler ─────────────────────────────────────────────────────── */

  const talkToLex = async (text, isSystemEvent = false) => {
    if (isSendingRef.current && !isSystemEvent) return;
    if (!isSystemEvent) isSendingRef.current = true;

    let currentProjId = activeProjectIdRef.current;

    try {
      if (!isSystemEvent) {
        if (!currentProjId) {
          try {
            const newProjTitle = text.length > 30 ? text.substring(0, 30) + "..." : text;
            const projRes = await apiFetch("/projects", {
              method: "POST",
              body: JSON.stringify({ project_name: newProjTitle, environment: "development" }),
            });
            currentProjId = projRes.project_id;
            setProjects((prev) => [projRes, ...prev]);
            handleProjectSelect(currentProjId, projRes.project_name, true);
          } catch (e) {
            console.error("Auto-create failed:", e);
          }
        }

        // Optimistic message with sender info
        updateMessages((prev) => [
          ...prev,
          { role: "user", text, senderName: displayName, senderRole: userRole },
        ]);

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

      const command = new RecognizeTextCommand({
        botId:    BOT_ID,
        botAliasId: ALIAS_ID,
        localeId: "en_US",
        sessionId: currentProjId || userId || "local-session",
        text,
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
      try { payload = JSON.parse(updatedAttrs.ui_payload || "{}"); }
      catch { payload = {}; }

      if (payload.cost) setCostData(payload.cost);

      const botMessage   = payload.message || response.messages?.content || "";
      const currentJobId = payload.job_id || payload.plan_job_id || payload.apply_job_id;
      const isDestroyFlow = payload.type === "DESTROY_STARTED";

      const shouldPushLexMessage =
        botMessage &&
        payload.type !== "PLAN_STARTED" &&
        payload.type !== "DESTROY_STARTED";

      if (shouldPushLexMessage) {
        updateMessages((prev) => [
          ...prev,
          { role: "bot", senderName: "CloudCrafter", senderRole: "bot", text: botMessage, type: payload.type || undefined },
        ]);
      }

      if (payload.type === "PLAN_STARTED") {
        updateMessages((prev) => [
          ...prev,
          { role: "bot", senderName: "CloudCrafter", senderRole: "bot", text: botMessage, type: "PLAN_STARTED" },
        ]);
        openLogs(currentJobId, "plan", "RUNNING");
        pollStatus(currentJobId, "plan");
      } else if (payload.type === "APPLY_STARTED") {
        pollStatus(currentJobId, "apply", payload.plan_job_id);
      } else if (isDestroyFlow) {
        updateMessages((prev) => [
          ...prev,
          { role: "bot", senderName: "CloudCrafter", senderRole: "bot", text: botMessage, type: "DESTROY_STARTED" },
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
    } catch (error) {
      console.error("talkToLex failed:", error);
      updateMessages((prev) => [
        ...prev,
        { role: "bot", senderName: "CloudCrafter", senderRole: "bot", text: `⚠️ Connection lost. ${error?.message || "Unknown error"}` },
      ]);
    } finally {
      if (!isSystemEvent) {
        isSendingRef.current = false;
        setIsTyping(false);
        setBotStatus("");
      }
    }
  };

  /* ── Styling ─────────────────────────────────────────────────────────── */

  const containerClass =
    theme === "dark" ? "bg-[#050505] text-white" : "bg-zinc-50 text-zinc-900";

  /* ── Loading guard ───────────────────────────────────────────────────── */

  if (!session) {
    return (
      <div className={`flex items-center justify-center h-screen overflow-hidden ${containerClass}`}>
        <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
      </div>
    );
  }

  /* ── SCENARIO 1: Dashboard ───────────────────────────────────────────── */

  if (!activeProjectId) {
    return (
      <div className={`flex flex-col h-screen overflow-hidden ${containerClass}`}>
        <header className="h-[60px] flex justify-between items-center px-6 border-b border-white/10 shrink-0">
          <span className="font-bold text-lg tracking-tight">CloudCrafter</span>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-white/10">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-zinc-200">{displayName}</span>
                <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  Connected
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30 uppercase shrink-0">
                {displayName.charAt(0)}
              </div>
              <button onClick={() => navigate("/logout")} className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all ml-1" title="Logout">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <ProjectDashboard
            projects={projects}
            userRole={userRole}
            isLoading={isLoadingProjects}
            onSelectProject={handleProjectSelect}
            onCreateClick={() => setIsModalOpen(true)}
          />
        </div>

        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onProjectCreated={(newProj) => {
            setProjects((prev) => [newProj, ...prev]);
            handleProjectSelect(newProj.project_id, newProj.project_name);
          }}
        />
      </div>
    );
  }

  /* ── SCENARIO 2: Workspace ───────────────────────────────────────────── */

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${containerClass}`}>
      <header className="h-[60px] flex justify-between items-center px-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">☰</button>

          <button
            onClick={() => handleProjectSelect(null, "")}
            className="text-zinc-400 hover:text-white flex items-center gap-1.5 text-sm font-medium transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Dashboard
          </button>

          <div className="w-px h-6 bg-white/10 mx-2" />

          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight uppercase opacity-50">CloudCrafter v1.0</span>
            <span className="font-medium text-xs truncate max-w-[200px]">{conversationName}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {costData && (
            <button className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-all hidden sm:block">
              Est. ${costData.monthly_cost?.toFixed(2) || "0.00"}
            </button>
          )}

          <button
            onClick={() => {
              if (logPanelOpen) {
                setLogPanelOpen(false);
              } else {
                const saved = activeProjectIdRef.current
                  ? projectLogsRef.current[activeProjectIdRef.current]
                  : null;
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
                  : "bg-white/5 text-zinc-600 border-white/5 cursor-default opacity-50"
              }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5"/>
              <line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
            Logs
            {activeLogStatus === "RUNNING" && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <NotificationBell />

          <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-white/10">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-zinc-200">{displayName}</span>
              <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                Connected
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30 uppercase shrink-0">
              {displayName.charAt(0)}
            </div>
            <button onClick={() => navigate("/logout")} className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all ml-1" title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
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
          projects={projects}
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
            activeProjectId={activeProjectId}
            onNewRealtimeMessage={handleNewRealtimeMessage}
          />

          <CommandInput
            onSend={(val) => talkToLex(val)}
            isTyping={isTyping}
            chatStarted={chatStarted}
            disabled={botStatus !== "" && botStatus !== "CloudCrafter is thinking..."}
            theme={theme}
          />
        </main>
      </div>
    </div>
  );
};

export default ConsoleLayout;