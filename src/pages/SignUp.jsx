import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function SignUp() {
  const navigate = useNavigate();

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleArn, setRoleArn] = useState("");
  const [externalId, setExternalId] = useState("");
  
  // UI State
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔥 Real-time Validation Checks
  const isNameInvalid = fullName.length > 0 && fullName.length <= 1;
  const isEmailInvalid = email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordInvalid = password.length > 0 && password.length < 6;
  const isMatchInvalid = confirmPassword.length > 0 && password !== confirmPassword;
  const isArnInvalid = roleArn.length > 0 && (!roleArn.startsWith("arn:aws:iam::") || !roleArn.includes(":role/"));

  const passwordsMatch = useMemo(
    () => password === confirmPassword && password.length > 0,
    [password, confirmPassword]
  );

  const canSubmit =
    fullName.length > 1 &&
    !isEmailInvalid && email.length > 0 &&
    !isPasswordInvalid &&
    passwordsMatch &&
    !isArnInvalid && roleArn.length > 0;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    setErrorMsg("");
    setIsLoading(true);

    try {
      await apiFetch("/signup", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          role_arn: roleArn,
          external_id: externalId || null,
        }),
      });

      setIsSubmitted(true);
    } catch (err) {
      setErrorMsg(err.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // UI: SUCCESS STATE ("CHECK YOUR EMAIL")
  // ==========================================
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl text-center flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Check your email</h2>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            We've sent a secure verification link to <span className="text-white font-medium">{email}</span>. Please click the link to activate your account.
          </p>
          <button
            onClick={() => navigate("/signin")}
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors underline underline-offset-4"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI: SIGN UP FORM
  // ==========================================
  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create Account</h1>
          <p className="text-sm text-zinc-400">Join CloudCrafter to automate your infrastructure.</p>
        </div>

        {errorMsg && (
          <div className="p-4 mb-6 text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in duration-300">
            <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-4">
            
            {/* Full Name */}
            <div>
              <input
                className={`w-full p-3.5 rounded-xl bg-black/40 border transition-all placeholder:text-zinc-500 text-white focus:outline-none focus:ring-1 ${isNameInvalid ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/50"}`}
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              {isNameInvalid && <p className="text-red-400 text-xs mt-1.5 ml-1 animate-in fade-in">Name is too short.</p>}
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                className={`w-full p-3.5 rounded-xl bg-black/40 border transition-all placeholder:text-zinc-500 text-white focus:outline-none focus:ring-1 ${isEmailInvalid ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/50"}`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {isEmailInvalid && <p className="text-red-400 text-xs mt-1.5 ml-1 animate-in fade-in">Please enter a valid email address.</p>}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full p-3.5 pr-12 rounded-xl bg-black/40 border transition-all placeholder:text-zinc-500 text-white focus:outline-none focus:ring-1 ${isPasswordInvalid ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/50"}`}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {isPasswordInvalid && <p className="text-red-400 text-xs mt-1.5 ml-1 animate-in fade-in">Password must be at least 6 characters.</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full p-3.5 rounded-xl bg-black/40 border placeholder:text-zinc-500 text-white focus:outline-none transition-all ${
                  confirmPassword.length > 0
                    ? isMatchInvalid
                      ? "border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                      : "border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                    : "border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                }`}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {isMatchInvalid && <p className="text-red-400 text-xs mt-1.5 ml-1 animate-in fade-in">Passwords do not match.</p>}
            </div>

            {/* Role ARN */}
            <div>
              <input
                className={`w-full p-3.5 rounded-xl bg-black/40 border transition-all placeholder:text-zinc-500 text-white focus:outline-none focus:ring-1 ${isArnInvalid ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/50"}`}
                placeholder="IAM Role ARN"
                value={roleArn}
                onChange={(e) => setRoleArn(e.target.value)}
                required
              />
              {isArnInvalid ? (
                <p className="text-red-400 text-xs mt-1.5 ml-1 animate-in fade-in">Must start with 'arn:aws:iam::' and contain ':role/'</p>
              ) : (
                <p className="text-[11px] text-zinc-500 mt-1.5 ml-1">Format: arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME</p>
              )}
            </div>

            {/* External ID */}
            <input
              className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 placeholder:text-zinc-500 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              placeholder="External ID (Optional, but recommended)"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="w-full bg-white text-black py-3.5 mt-2 rounded-xl font-semibold hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-zinc-400">
          Already have an account?{" "}
          <Link to="/signin" className="text-white hover:underline font-medium transition-all">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}