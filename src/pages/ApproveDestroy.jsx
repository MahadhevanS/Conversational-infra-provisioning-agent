import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function ApproveDestroy() {
  const { token }  = useParams();
  const navigate   = useNavigate();

  const [approval, setApproval]   = useState(null);
  const [status,   setStatus]     = useState("loading"); // loading | ready | actioning | done | error
  const [result,   setResult]     = useState(null);      // "approved" | "rejected"
  const [errorMsg, setErrorMsg]   = useState("");

  const authToken = localStorage.getItem("cloudcrafter_token");

  useEffect(() => {
    if (!authToken) {
      navigate(`/signin?redirect=/approve-destroy/${token}`);
      return;
    }
    fetchApproval();
  }, [token]);

  const fetchApproval = async () => {
    try {
      const res = await fetch(`${BASE_URL}/destroy-approvals/${token}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load request");
      setApproval(data);
      setStatus(data.status === "pending" ? "ready" : "done");
      if (data.status !== "pending") setResult(data.status);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  const handleAction = async (action) => {
    setStatus("actioning");
    try {
      const res = await fetch(`${BASE_URL}/destroy-approvals/${token}/${action}`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Failed to ${action}`);
      setResult(action === "approve" ? "approved" : "rejected");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  const formatDate = (v) => v ? new Date(v).toLocaleString() : "";

  return (
    <div className="min-h-screen bg-[#0f0f16] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-[#151521] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-400">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Destroy Approval Request</h1>
            <p className="text-xs text-zinc-500 mt-0.5">CloudCrafter Infrastructure Management</p>
          </div>
        </div>

        <div className="p-8">

          {/* Loading */}
          {status === "loading" && (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{errorMsg}</p>
              </div>
              <button onClick={() => navigate("/console")}
                className="text-zinc-400 hover:text-white text-sm transition-colors">
                ← Return to Dashboard
              </button>
            </div>
          )}

          {/* Ready — show details + action buttons */}
          {(status === "ready" || status === "actioning") && approval && (
            <div className="space-y-6">

              {/* Project */}
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Project</p>
                <p className="text-white font-semibold text-lg">{approval.project_name}</p>
              </div>

              {/* Requested by */}
              <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl space-y-2">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Requested by</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm border border-amber-500/30 uppercase">
                    {approval.requested_by_name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{approval.requested_by_name}</p>
                    <p className="text-zinc-500 text-xs">{approval.requested_by_email}</p>
                  </div>
                </div>
              </div>

              {/* Scope */}
              <div className="p-4 bg-red-500/[0.06] border border-red-500/20 rounded-xl">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Destroy scope</p>
                <p className="text-red-400 font-semibold">
                  {approval.scope === "ALL" ? "⚠️ Entire environment (all resources)" : "⚠️ Selected resources only"}
                </p>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Requested at</p>
                  <p className="text-zinc-300 text-sm">{formatDate(approval.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Expires at</p>
                  <p className="text-zinc-300 text-sm">{formatDate(approval.expires_at)}</p>
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl">
                <p className="text-amber-400 text-sm font-medium">
                  This action is irreversible. Approving will immediately begin destroying AWS infrastructure.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleAction("reject")}
                  disabled={status === "actioning"}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-all disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction("approve")}
                  disabled={status === "actioning"}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "actioning" ? "Processing..." : "Approve Destroy"}
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {status === "done" && (
            <div className="space-y-6">
              {result === "approved" ? (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                  <p className="text-2xl mb-2">💥</p>
                  <p className="text-red-400 font-semibold text-lg">Destroy Approved</p>
                  <p className="text-zinc-400 text-sm mt-1">
                    Infrastructure destruction has been initiated. The architect has been notified.
                  </p>
                </div>
              ) : (
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                  <p className="text-2xl mb-2">🛡️</p>
                  <p className="text-emerald-400 font-semibold text-lg">Request Rejected</p>
                  <p className="text-zinc-400 text-sm mt-1">
                    The destroy request has been rejected. The architect has been notified.
                  </p>
                </div>
              )}

              <button
                onClick={() => navigate("/console")}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}