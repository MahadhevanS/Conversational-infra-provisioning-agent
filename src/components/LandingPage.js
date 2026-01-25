import React from "react";

const LandingPage = ({ onStart }) => {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-black text-white flex items-center justify-center">

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
