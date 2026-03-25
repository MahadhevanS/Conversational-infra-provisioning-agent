import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function AcceptInvite() {
  const { token } = useParams(); // Grabs the /join/xxxx-xxxx token from the URL
  const navigate = useNavigate();
  
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if they are already logged into CloudCrafter
  useEffect(() => {
    const authToken = localStorage.getItem("cloudcrafter_token");
    setIsAuthenticated(!!authToken);
  }, []);

  const handleAcceptInvite = async () => {
    setStatus("loading");
    setErrorMsg("");

    try {
      const authToken = localStorage.getItem("cloudcrafter_token");
      
      const response = await fetch(`http://localhost:8000/invitations/${token}/accept`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to accept invitation.");
      }

      setStatus("success");
      
      // Redirect them to their dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);

    } catch (error) {
      setStatus("error");
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f16] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#151521] border border-white/10 rounded-2xl shadow-2xl p-8 text-center">
        
        {/* Icon */}
        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-indigo-400">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Project Invitation</h2>
        
        {/* State: Not Logged In */}
        {!isAuthenticated && (
          <div className="space-y-4 mt-6 animate-in fade-in">
            <p className="text-gray-400 text-sm leading-relaxed">
              You need to be logged into your CloudCrafter account to accept this invitation.
            </p>
            <div className="flex gap-3 pt-4">
              <Link to="/login" className="flex-1 py-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors font-medium border border-white/10">
                Log In
              </Link>
              <Link to="/signup" className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors font-medium">
                Create Account
              </Link>
            </div>
          </div>
        )}

        {/* State: Logged In & Ready */}
        {isAuthenticated && status === "idle" && (
          <div className="mt-6 animate-in fade-in">
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              You've been invited to join a workspace as a Cloud Architect. Click below to securely join the team.
            </p>
            <button
              onClick={handleAcceptInvite}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors font-medium shadow-lg shadow-indigo-500/20"
            >
              Accept Invitation & Join
            </button>
          </div>
        )}

        {/* State: Loading */}
        {status === "loading" && (
          <div className="mt-8 mb-4">
            <p className="text-indigo-400 font-medium animate-pulse">Verifying secure invitation...</p>
          </div>
        )}

        {/* State: Success */}
        {status === "success" && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl animate-in zoom-in-95">
            <p className="text-green-400 font-medium">Successfully joined! Redirecting to dashboard...</p>
          </div>
        )}

        {/* State: Error */}
        {status === "error" && (
          <div className="mt-6 space-y-4 animate-in slide-in-from-bottom-2">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
              <p className="text-red-400 text-sm">{errorMsg}</p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-400 hover:text-white text-sm transition-colors mt-2"
            >
              Return to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}