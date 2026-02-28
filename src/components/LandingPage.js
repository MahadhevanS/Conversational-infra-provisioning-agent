import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = ({ onStart }) => {
  const navigate = useNavigate();

  // Read session stored by authLocal.js
  const session = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("cloudcrafter_session") || "null");
    } catch {
      return null;
    }
  }, []);

  const aws = session?.aws || {};
  const userEmail = session?.email || "";
  const fullName = session?.full_name || "";

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-black text-white flex items-center justify-center">
      {/* ✅ Top bar (Profile + Logout) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <p className="text-xs text-white/60">Signed in as</p>
          <p className="text-sm font-semibold text-white">
            {fullName ? fullName : userEmail}
          </p>
        </div>

        <button
          onClick={() => navigate("/logout")}
          className="px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition text-sm"
        >
          Logout
        </button>
      </div>

      {/* 🌌 Animated Nebula */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="
            absolute w-[200%] h-[200%] -top-1/2 -left-1/2
            bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.12),transparent_45%)]
            blur-[90px] opacity-80 animate-spin-slow
          "
        />
      </div>

      {/* 🧊 Subtle Grid */}
      <div
        className="
          absolute inset-0 pointer-events-none opacity-10
          bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]
          bg-[size:48px_48px]
        "
      />

      {/* 🌟 Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 w-full max-w-4xl">
        {/* Title */}
        <h1
          className="
            text-4xl sm:text-6xl md:text-8xl
            font-black tracking-tight
            text-transparent bg-clip-text
            bg-gradient-to-b from-white via-slate-200 to-slate-500
            drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]
            leading-tight
          "
        >
          CLOUDCRAFTER
        </h1>

        {/* Subtitle */}
        <p
          className="
            mt-4 sm:mt-6
            text-base sm:text-lg md:text-xl
            text-zinc-400
            max-w-xl mx-auto
            leading-relaxed
          "
        >
          A conversational assistant that simplifies cloud infrastructure
          creation, modification, and cost estimation.
        </p>

        {/* ✅ AWS profile card */}
        <div className="mt-6 sm:mt-8 mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 text-left">
          <p className="text-sm font-semibold text-white/90">Connected AWS Profile</p>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-white/50 text-xs">AWS Account ID</p>
              <p className="font-medium">{aws.aws_account_id || "Not set"}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-white/50 text-xs">Default Region</p>
              <p className="font-medium">{aws.aws_region || "Not set"}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:col-span-2">
              <p className="text-white/50 text-xs">IAM Role ARN</p>
              <p className="font-medium break-all">{aws.role_arn || "Not set"}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:col-span-2">
              <p className="text-white/50 text-xs">External ID</p>
              <p className="font-medium break-all">{aws.external_id || "—"}</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-white/50">
            (Demo mode: stored in browser localStorage. In production, store securely in backend.)
          </p>
        </div>

        {/* Divider */}
        <div className="mt-8 sm:mt-10 flex justify-center">
          <div className="h-px w-32 sm:w-40 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center">
          {/* Primary CTA */}
          <button
            onClick={onStart}
            className="
              group relative w-full sm:w-auto
              px-10 sm:px-12 py-3.5 sm:py-4
              rounded-full
              bg-white text-black font-bold
              text-base sm:text-lg
              transition-all duration-300
              hover:scale-[1.06]
              hover:shadow-[0_0_40px_rgba(255,255,255,0.35)]
              active:scale-95
            "
          >
            <span className="relative z-10">Initialize Console</span>
            <span
              className="
                absolute inset-0 rounded-full
                bg-gradient-to-r from-indigo-400 to-purple-400
                opacity-0 group-hover:opacity-20 transition-opacity
              "
            />
          </button>

          {/* Secondary CTA */}
          <button
            onClick={() =>
              window.open(
                "https://developer.hashicorp.com/terraform/docs", // change to your docs link
                "_blank"
              )
            }
            className="
              w-full sm:w-auto
              px-10 sm:px-12 py-3.5 sm:py-4
              rounded-full
              border border-white/20
              text-white font-semibold
              text-base sm:text-lg
              backdrop-blur-sm
              transition-all duration-300
              hover:bg-white/10
              hover:border-white
              hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]
            "
          >
            Read Documentation
          </button>
        </div>

        {/* Footer hint */}
        <p className="mt-10 sm:mt-14 text-[10px] sm:text-xs tracking-widest text-zinc-500 uppercase">
          Powered by AWS · Lex · Infracost
        </p>
      </div>

      {/* Animation */}
      <style>
        {`
          @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spinSlow 80s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default LandingPage;