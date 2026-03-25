import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setAuthToken } from "../utils/api";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function SignIn() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [sessionAlert, setSessionAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("session_expired") === "true") {
      setSessionAlert(true);
      sessionStorage.removeItem("session_expired");
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        let errorText = "Invalid email or password";
        try {
          const errorData = await response.json();
          errorText = errorData.detail || errorData.message || errorText;
        } catch (_) {}
        throw new Error(errorText);
      }

      const loginData = await response.json();

      // Save the auth token
      setAuthToken(loginData.access_token);

      // Build and save session object
      const sessionData = {
        email: loginData.email,
        full_name: loginData.full_name || "",
        role: loginData.role || "",
        aws: {
          aws_account_id: loginData.aws_account_id || "",
          aws_region: loginData.aws_region || "us-east-1",
          role_arn: loginData.role_arn || "",
          external_id: loginData.external_id || ""
        }
      };

      localStorage.setItem("cloudcrafter_session", JSON.stringify(sessionData));

      // ✅ FIX: Removed debug alert(), restored navigation
      navigate("/console");

    } catch (err) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070714] text-white px-4 relative overflow-hidden">

      {sessionAlert && (
        <div className="absolute top-10 flex items-center gap-3 px-5 py-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium animate-in slide-in-from-top-10 fade-in duration-500 shadow-[0_0_30px_rgba(245,158,11,0.1)] z-50">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Your session expired. Please log in again.
        </div>
      )}

      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative z-10">
        <h1 className="text-2xl font-bold mb-6 text-center">CloudCrafter Login</h1>

        {errorMsg && (
          <div className="p-3 mb-4 text-sm text-red-400 bg-red-900/30 border border-red-500/50 rounded-xl animate-in fade-in zoom-in-95 duration-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            className="w-full p-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-indigo-500 transition-colors"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />

          <input
            type="password"
            className="w-full p-3 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-indigo-500 transition-colors"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-xl font-semibold flex justify-center items-center transition-all duration-200 ${
              isLoading
                ? "bg-zinc-600 text-zinc-300 cursor-not-allowed"
                : "bg-white text-black hover:bg-zinc-200 active:scale-[0.98]"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center mt-5 text-sm">
          New user?{" "}
          <Link to="/signup" className="underline hover:text-indigo-400 transition-colors">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}