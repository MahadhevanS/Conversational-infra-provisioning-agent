import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setAuthToken, setProjectId } from "../utils/api";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function SignIn() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false); 

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true); 

    try {
      // 🔥 FIX: We use a raw fetch here instead of apiFetch to bypass the global 401 page-reload trap!
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ email, password })
      });

      // 🔥 Handle invalid credentials gracefully without reloading the page
      if (!response.ok) {
        let errorText = "Invalid email or password";
        try {
          const errorData = await response.json();
          errorText = errorData.detail || errorData.message || errorText;
        } catch (parseErr) {}
        throw new Error(errorText);
      }

      const loginData = await response.json();

      setAuthToken(loginData.access_token);

      const sessionData = {
        email: loginData.email || email,
        full_name: loginData.full_name || "",
        aws: {
          aws_account_id: loginData.aws_account_id || "",
          aws_region: loginData.aws_region || "",
          role_arn: loginData.role_arn || "",
          external_id: loginData.external_id || ""
        }
      };
      localStorage.setItem("cloudcrafter_session", JSON.stringify(sessionData));

      if (loginData.project_id) {
        setProjectId(loginData.project_id);
      }

      // Redirect directly to the console instead of the landing page
      navigate("/console");

    } catch (err) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070714] text-white px-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10">
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