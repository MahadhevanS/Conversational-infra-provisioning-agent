import React, { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";

const LandingPage = ({ onStart }) => {
  const navigate = useNavigate();

  // Read session to dynamically update the header
  const session = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("cloudcrafter_session") || "null");
    } catch {
      return null;
    }
  }, []);

  const isLoggedIn = !!session;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-white font-sans selection:bg-indigo-500/30">
      
      {/* 🌌 Animated Nebula Background (Fixed so it stays while scrolling) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="
            absolute w-[200%] h-[200%] -top-1/2 -left-1/2
            bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.12),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.08),transparent_40%)]
            blur-[90px] opacity-80 animate-spin-slow
          "
        />
        {/* 🧊 Subtle Grid */}
        <div
          className="
            absolute inset-0 opacity-[0.03]
            bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)]
            bg-[size:64px_64px]
          "
        />
      </div>

      {/* ✅ Dynamic Navigation Bar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="font-black tracking-widest text-lg text-white drop-shadow-md">
          CLOUDCRAFTER
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <button 
                onClick={() => navigate("/console")}
                className="text-sm font-medium text-zinc-300 hover:text-white transition"
              >
                Console
              </button>
              <button
                onClick={() => navigate("/logout")}
                className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate("/signin")}
                className="text-sm font-medium text-zinc-300 hover:text-white transition"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-5 py-2.5 rounded-full bg-white text-black hover:bg-zinc-200 transition text-sm font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* 🌟 Main Hero Section */}
      <main className="relative z-10 pt-20 pb-16 px-4 sm:px-6 text-center animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-wide uppercase mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Cloud Infrastructure Platform v1.0
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 leading-[1.1] drop-shadow-2xl mb-6">
            Deploy AWS at the <br className="hidden md:block"/> speed of chat.
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
            A conversational AI assistant that simplifies cloud infrastructure. Generate, estimate costs, and deploy Terraform modules directly from your browser.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onStart}
              className="group relative w-full sm:w-auto px-10 py-4 rounded-full bg-white text-black font-bold text-lg transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95"
            >
              <span className="relative z-10">{isLoggedIn ? "Go to Console" : "Get Started"}</span>
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity" />
            </button>

            <button
              onClick={() => window.open("https://developer.hashicorp.com/terraform/docs", "_blank")}
              className="w-full sm:w-auto px-10 py-4 rounded-full border border-white/20 text-white font-semibold text-lg backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]"
            >
              View Documentation
            </button>
          </div>
        </div>

        {/* 💻 App Mockup Visual */}
        <div className="mt-20 max-w-5xl mx-auto rounded-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          {/* Mockup Header */}
          <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-white/5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            <div className="mx-auto text-xs font-mono text-zinc-500 font-semibold tracking-wider">CloudCrafter Console</div>
          </div>
          {/* Mockup Body */}
          <div className="p-8 flex flex-col gap-6 text-left">
            <div className="self-end bg-indigo-600 text-white px-5 py-3 rounded-2xl rounded-br-none max-w-[80%] text-sm shadow-lg">
              Create a secure S3 bucket for website hosting.
            </div>
            <div className="self-start flex gap-3 w-full max-w-[80%]">
              <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-white/10">CC</div>
              <div className="bg-zinc-900 border border-white/10 rounded-2xl rounded-tl-none p-5 w-full shadow-lg">
                <div className="text-sm text-zinc-300 mb-4">Here is the Terraform plan for your S3 bucket:</div>
                <div className="flex gap-4 text-[10px] font-bold font-mono uppercase tracking-widest border-b border-white/5 pb-2 mb-3">
                  <span className="text-emerald-500">2 to add</span>
                  <span className="text-amber-500">0 to change</span>
                  <span className="text-rose-500">0 to destroy</span>
                </div>
                <div className="font-mono text-xs text-zinc-400 space-y-1 mb-4">
                  <div className="flex gap-2"><span className="text-emerald-400">(+)</span> aws_s3_bucket.website</div>
                  <div className="flex gap-2"><span className="text-emerald-400">(+)</span> aws_s3_bucket_public_access_block.website</div>
                </div>
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center mb-4">
                  <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Estimated Monthly Cost</div>
                  <div className="text-xl font-bold mt-1 text-emerald-300">$0.00</div>
                </div>
                <div className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-center bg-emerald-600 text-white opacity-50">Approve & Deploy</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ⚡ Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition duration-300">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Conversational IaC</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Describe your infrastructure in plain English. CloudCrafter translates your intent into secure, modular Terraform code instantly.</p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Live Cost Estimation</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">No more billing surprises. Integrated Infracost APIs analyze your Terraform plans to provide accurate monthly cost projections before you deploy.</p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition duration-300">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-6 text-amber-400">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Zero-Touch Provisioning</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Approve the plan and let the backend do the heavy lifting. CloudCrafter directly interfaces with AWS to provision your environments securely.</p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-xs text-zinc-600">
        <p className="tracking-widest uppercase mb-2">Powered by AWS · Lex · Terraform · Infracost</p>
        <p>© 2026 CloudCrafter. All rights reserved.</p>
      </footer>

      {/* Animation Styles */}
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